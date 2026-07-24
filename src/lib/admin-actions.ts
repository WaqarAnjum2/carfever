'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceRoleClient, createServerClient } from './supabase/server';
import { Database } from './supabase/types';
import { CarCreateSchema, BlogCreateSchema, AdminLoginSchema } from './validation';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

import { getSession } from './auth';

type CarInsert = Database['public']['Tables']['cars']['Insert'];
type CarUpdate = Partial<Database['public']['Tables']['cars']['Insert']>;

const SignUpSchema = AdminLoginSchema.extend({ name: z.string().min(1) });

function handleError(error: unknown, message: string): never {
  console.error(`[admin-actions] ${message}:`, error);
  throw new Error(error instanceof Error ? error.message : message);
}

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get('x-forwarded-for')?.split(',')[0]?.trim()
      || h.get('x-real-ip')
      || 'unknown';
  } catch {
    return 'unknown';
  }
}

const ADMIN_LEVEL_ROLES = ['admin', 'content_manager', 'inspection_manager', 'seller', 'buyer'] as const;

export const verifyAdminSession = cache(async (): Promise<{ role: string; id: string; name?: string; email?: string; phone?: string | null }> => {
  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Authentication required');

  if (sessionUser.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!ADMIN_LEVEL_ROLES.includes(sessionUser.role as any)) {
    throw new Error('Access denied. Active account required.');
  }
  return { role: sessionUser.role, id: sessionUser.id, name: sessionUser.name, email: sessionUser.email, phone: sessionUser.phone };
});

export const verifyContentManagerAccess = cache(async (): Promise<void> => {
  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Authentication required');

  if (sessionUser.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!['admin', 'content_manager'].includes(sessionUser.role)) {
    throw new Error('Access denied. Insufficient permissions.');
  }
});

export const verifyInspectionManagerAccess = cache(async (): Promise<void> => {
  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Authentication required');

  if (sessionUser.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!['admin', 'inspection_manager'].includes(sessionUser.role)) {
    throw new Error('Access denied. Insufficient permissions.');
  }
});

function RATE_LIMIT_ADMIN(action: 'login' | 'admin-action', ip: string) {
  return rateLimit(action === 'login' ? 'login' : 'api', ip);
}

// ─── Car CRUD ────────────────────────────────────────────────────────────────

export async function createCar(input: CarInsert) {
  await verifyContentManagerAccess();

  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) handleError(new Error('Rate limit exceeded. Please wait a moment before trying again.'), 'Too many requests');

  const supabase = createServiceRoleClient();
  const payload: any = { ...input };
  if (payload.make && !payload.brand) {
    payload.brand = payload.make;
  }

  let { data, error } = await supabase
    .from('cars')
    .insert(payload)
    .select()
    .single();

  if (error && error.message.includes('brand')) {
    delete payload.brand;
    const retry = await supabase.from('cars').insert(payload).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to create car');
  revalidatePath('/admin/cars');
  revalidatePath('/buy-car');
  return data;
}

export async function updateCar(id: string, input: CarUpdate) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const payload: any = { ...input };
  if (payload.make && !payload.brand) {
    payload.brand = payload.make;
  }

  let { data, error } = await supabase
    .from('cars')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();

  let retries = 0;
  while (error && retries < 10) {
    retries++;
    console.warn(`[updateCar] Update error (attempt ${retries}):`, error.message);

    const match =
      error.message.match(/Could not find the '([^']+)' column/i) ||
      error.message.match(/column "(.*?)"/i) ||
      error.message.match(/column '(.*?)'/i);

    if (match && match[1] && match[1] in payload) {
      console.warn(`[updateCar] Stripping missing column '${match[1]}' and retrying...`);
      delete payload[match[1]];
    } else if (error.message.includes('brand')) {
      delete payload.brand;
    } else if (error.message.includes('make')) {
      delete payload.make;
    } else if (error.message.includes('seller_name')) {
      delete payload.seller_name;
    } else if (error.message.includes('seller_phone')) {
      delete payload.seller_phone;
    } else if (error.message.includes('engine_capacity')) {
      delete payload.engine_capacity;
    } else {
      break;
    }

    const retry = await supabase.from('cars').update(payload).eq('id', id).select().maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to update car');
  revalidatePath('/admin/cars');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');
  return data;
}

export async function deleteCar(id: string) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete car');
  revalidatePath('/admin/cars');
  revalidatePath('/buy-car');
  return true;
}

export async function approveCar(id: string) {
  return updateCar(id, { status: 'approved' });
}

export async function rejectCar(id: string) {
  return updateCar(id, { status: 'rejected' });
}

export async function createBlog(input: Database['public']['Tables']['blogs']['Insert']) {
  await verifyContentManagerAccess();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('blogs')
    .insert(input)
    .select()
    .single();

  if (error) handleError(error, 'Failed to create blog');
  revalidatePath('/admin/blogs');
  return data;
}

export async function updateBlog(id: string, input: Database['public']['Tables']['blogs']['Update']) {
  await verifyContentManagerAccess();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('blogs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) handleError(error, 'Failed to update blog');
  revalidatePath('/admin/blogs');
  return data;
}

export async function publishBlog(_id: string) {
  return true;
}

export async function deleteBlog(_id: string) {
  return true;
}

async function ensureBucketExists(supabase: any, bucketName = 'car-images') {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === bucketName);
    if (!exists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760,
      });
    }
  } catch (err) {
    console.error('Bucket check/creation error:', err);
  }
}

export async function uploadImage(file: File): Promise<string> {
  await verifyAdminSession();

  const ip = await getClientIp();
  const { allowed } = rateLimit('upload', ip);
  if (!allowed) handleError(new Error('Upload rate limit exceeded. Please wait a moment.'), 'Too many uploads');

  const supabase = createServiceRoleClient();
  await ensureBucketExists(supabase, 'car-images');

  const isWebP = file.type === 'image/webp' || file.name.endsWith('.webp');
  const ext = isWebP ? 'webp' : (file.name.split('.').pop() || 'jpg');
  const contentType = isWebP ? 'image/webp' : (file.type || 'image/jpeg');
  const filename = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('car-images')
    .upload(filename, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from('car-images').getPublicUrl(filename);
  return data.publicUrl;
}

export async function deleteStorageImage(imageUrl: string): Promise<boolean> {
  await verifyAdminSession();
  if (!imageUrl || !imageUrl.includes('car-images')) return false;
  try {
    const supabase = createServiceRoleClient();
    const parts = imageUrl.split('car-images/');
    if (parts.length > 1) {
      const filePath = parts[1];
      const { error } = await supabase.storage.from('car-images').remove([filePath]);
      if (error) console.error('Storage remove error:', error);
      return !error;
    }
  } catch (err) {
    console.error('deleteStorageImage error:', err);
  }
  return false;
}

// ============================================================================
// SEO SETTINGS
// ============================================================================

export interface SEOSettingsPayload {
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  schema_markup: Database['public']['Tables']['seo_settings']['Insert']['schema_markup'];
}

export async function updateSEOSettings(
  pagePath: string,
  data: SEOSettingsPayload,
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const { data: existing, error: fetchError } = await supabase
    .from('seo_settings')
    .select('id')
    .eq('page_path', pagePath)
    .maybeSingle();

  if (fetchError) handleError(fetchError, 'Failed to fetch SEO settings');

  if (existing) {
    const { error } = await supabase
      .from('seo_settings')
      .update({
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        canonical_url: data.canonical_url,
        og_image: data.og_image,
        schema_markup: data.schema_markup,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) handleError(error, 'Failed to update SEO settings');
  } else {
    const { error } = await supabase
      .from('seo_settings')
      .insert({
        page_path: pagePath,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        canonical_url: data.canonical_url,
        og_image: data.og_image,
        schema_markup: data.schema_markup,
        updated_at: new Date().toISOString(),
      });

    if (error) handleError(error, 'Failed to create SEO settings');
  }

  revalidatePath('/admin/seo');
  return true;
}

export async function getAnalytics(_type: string, _dateRange: { start: string, end: string }) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const [{ count: users }, { count: cars }, { count: inquiries }] =
    await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    ]);

  return {
    users: users || 0,
    cars: cars || 0,
    inquiries: inquiries || 0,
    inspections: 0,
  };
}

// ============================================================================
// INQUIRIES ADMIN ACTIONS
// ============================================================================
export async function updateInquiryStatus(id: string, status: 'pending' | 'read' | 'replied' | 'archived') {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .update({ status, is_read: status !== 'pending' })
    .eq('id', id);

  if (error) handleError(error, 'Failed to update inquiry status');
  revalidatePath('/admin/inquiries');
  return true;
}

export async function deleteInquiry(id: string) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete inquiry');
  revalidatePath('/admin/inquiries');
  return true;
}

export async function clearAllInquiries() {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Supabase requires a filter for safety

  if (error) handleError(error, 'Failed to clear inquiries');
  revalidatePath('/admin/inquiries');
  return true;
}

export async function markAllInquiriesRead() {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .update({ status: 'read', is_read: true })
    .eq('is_read', false);

  if (error) handleError(error, 'Failed to mark inquiries as read');
  revalidatePath('/admin/inquiries');
  return true;
}

// ============================================================================
// INSPECTIONS ADMIN ACTIONS
// ============================================================================
export async function updateInspectionStatus(id: string, status: 'pending' | 'scheduled' | 'completed' | 'cancelled') {
  await verifyInspectionManagerAccess();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inspections')
    .update({ status })
    .eq('id', id);

  if (error) handleError(error, 'Failed to update inspection status');
  revalidatePath('/admin/inspections');
  return true;
}

export async function deleteInspection(id: string) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete inspection');
  revalidatePath('/admin/inspections');
  return true;
}

// ============================================================================
// USERS ADMIN ACTIONS
// ============================================================================

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'pending',
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const { data: targetUser } = await supabase
    .from('users')
    .select('id, auth_user_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (targetUser) {
    let targetAuthId = targetUser.auth_user_id;

    if (!targetAuthId && targetUser.email) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const match = listData?.users?.find(u => u.email?.toLowerCase() === targetUser.email.toLowerCase());
      if (match) targetAuthId = match.id;
    }

    if (targetAuthId) {
      if (status === 'suspended') {
        await supabase.auth.admin.updateUserById(targetAuthId, { ban_duration: '876000h' });
      } else if (status === 'active') {
        await supabase.auth.admin.updateUserById(targetAuthId, { ban_duration: 'none' });
      }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) handleError(error, 'Failed to update user status');
  revalidatePath('/admin/users');
  return true;
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'seller' | 'buyer',
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const { data: targetUser } = await supabase
    .from('users')
    .select('id, auth_user_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (targetUser) {
    let targetAuthId = targetUser.auth_user_id;

    if (!targetAuthId && targetUser.email) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const match = listData?.users?.find(u => u.email?.toLowerCase() === targetUser.email.toLowerCase());
      if (match) targetAuthId = match.id;
    }

    if (targetAuthId) {
      await supabase.auth.admin.updateUserById(targetAuthId, {
        user_metadata: { role },
      });
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) handleError(error, 'Failed to update user role');
  revalidatePath('/admin/users');
  return true;
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

export async function saveSiteSettings(
  settings: Record<string, string>,
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value as Database['public']['Tables']['site_settings']['Insert']['value'],
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) handleError(error, 'Failed to save site settings');
  revalidatePath('/admin/settings');
  return true;
}

// ============================================================================
// AUTH
// ============================================================================

export async function loginAdmin(email: string, password: string) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('login', ip);
  if (!allowed) throw new Error('Too many login attempts. Please wait before trying again.');

  const parsed = AdminLoginSchema.parse({ email: email.toLowerCase().trim(), password });

  const supabase = await createServerClient();
  const serviceClient = createServiceRoleClient();

  // 1. Attempt login with provided email
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  // 2. If login failed by email, check if user exists in public.users DB under another case or linked Auth user
  if (authError || !authData?.user) {
    const { data: dbUser } = await serviceClient
      .from('users')
      .select('id, auth_user_id, email, status')
      .ilike('email', parsed.email)
      .maybeSingle();

    if (dbUser && dbUser.auth_user_id) {
      const { data: authUserObj } = await serviceClient.auth.admin.getUserById(dbUser.auth_user_id);
      if (authUserObj?.user?.email) {
        const retry = await supabase.auth.signInWithPassword({
          email: authUserObj.user.email,
          password: parsed.password,
        });
        if (retry.data?.user) {
          authData = retry.data;
          authError = null;
        }
      }
    }
  }

  if (authError || !authData?.user) {
    throw new Error('Invalid email or password.');
  }

  // 3. Fetch exact user profile for the authenticated user
  let { data: userData } = await serviceClient
    .from('users')
    .select('id, name, email, role, status')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  if (!userData && authData.user.email) {
    const { data: byEmail } = await serviceClient
      .from('users')
      .select('id, name, email, role, status')
      .ilike('email', authData.user.email)
      .maybeSingle();

    if (byEmail) {
      userData = byEmail;
      await serviceClient
        .from('users')
        .update({ auth_user_id: authData.user.id })
        .eq('id', byEmail.id);
    }
  }

  if (!userData) {
    // Create buyer profile if missing
    const { data: newProfile } = await serviceClient
      .from('users')
      .upsert({
        auth_user_id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
        role: authData.user.user_metadata?.role || 'buyer',
        status: 'active'
      }, { onConflict: 'auth_user_id' })
      .select('id, name, email, role, status')
      .single();

    userData = newProfile;
  }

  if (!userData) {
    await supabase.auth.signOut();
    throw new Error('User account profile could not be retrieved.');
  }

  // 4. Strict Block / Suspension Enforcement
  if (userData.status === 'suspended') {
    await supabase.auth.signOut();
    throw new Error('Your account has been suspended by an administrator. Please contact support for assistance.');
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/dashboard');
  return { success: true as const, user: userData };
}

export async function logoutAdmin(): Promise<{ success: boolean }> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore errors during server signout
  }
  return { success: true };
}

// ============================================================================
// FETCH ALL USERS
// ============================================================================

export async function fetchAllUsers(search?: string, page: number = 1, pageSize: number = 20) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  let countQuery = supabase.from('users').select('*', { count: 'exact', head: true });
  if (search) countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  const { count } = await countQuery;
  const total = count ?? 0;
  const { page: safePage, totalPages } = buildPagination(page, pageSize, total);

  let q = supabase
    .from('users')
    .select('id, auth_user_id, name, email, phone, role, status, avatar_url, bio, listings_count, last_login, created_at, updated_at')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * pageSize, safePage * pageSize - 1);

  if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await q;

  if (error) handleError(error, 'Failed to fetch users');
  return { data: data ?? [], total, page: safePage, pageSize, totalPages };
}

export async function signUpAdmin(email: string, password: string, name: string) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('signup', ip);
  if (!allowed) throw new Error('Too many signup attempts. Please wait before trying again.');

  const parsed = SignUpSchema.parse({ email, password, name });

  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to sign up');
  }

  const serviceClient = createServiceRoleClient();
  const { error: userError } = await serviceClient
    .from('users')
    .insert({
      auth_user_id: authData.user.id,
      name: parsed.name,
      email: parsed.email,
      role: 'admin',
      status: 'active',
    });

  if (userError) {
    throw new Error('Failed to create admin profile');
  }

  return { success: true as const };
}

export const getAdminProfile = cache(async () => {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return null;

    const serviceClient = createServiceRoleClient();

    // 1. Fetch profile strictly by auth_user_id
    let { data: userData } = await serviceClient
      .from('users')
      .select('id, name, email, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // 2. Fallback: fetch by exact email match
    if (!userData && user.email) {
      const { data: byEmail } = await serviceClient
        .from('users')
        .select('id, name, email, role, status')
        .ilike('email', user.email)
        .maybeSingle();

      if (byEmail) {
        userData = byEmail;
        // Link auth_user_id to fix future lookups
        await serviceClient
          .from('users')
          .update({ auth_user_id: user.id })
          .eq('id', byEmail.id);
      }
    }

    if (!userData) return null;

    // 3. Strictly enforce suspension — sign out and deny access
    if (userData.status === 'suspended') {
      await supabase.auth.signOut();
      return { ...userData, isSuspended: true };
    }

    return userData;
  } catch (err) {
    console.error('getAdminProfile error:', err);
    return null;
  }
});

export async function checkAuthSession() {
  try {
    return await getAdminProfile();
  } catch (err) {
    console.error('checkAuthSession error:', err);
    return null;
  }
}

export async function getAdminInitialData() {
  try {
    const profile = await getAdminProfile();
    if (!profile) return null;

    if ((profile as any).isSuspended || (profile as any).status === 'suspended') {
      return {
        profile,
        pendingRegistrations: 0,
        suspended: true,
      };
    }

    const serviceClient = createServiceRoleClient();
    const { count } = await serviceClient
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      profile,
      pendingRegistrations: count ?? 0,
      suspended: false,
    };
  } catch (err) {
    console.error('getAdminInitialData error:', err);
    return null;
  }
}

export async function getAdminDashboardStats() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const [
    { count: cars },
    { count: users },
    { data: carsViews },
    { data: recentCars },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('views_count, created_at'),
    supabase.from('cars').select('id, title, model, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, name, role, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalViews = (carsViews || []).reduce((sum: number, c: any) => sum + (c.views_count || 0), 0);

  const carActivities = (recentCars || []).map((c: any) => ({
    title: 'New Car Listed',
    desc: c.title || 'Vehicle',
    createdAt: c.created_at,
  }));

  const userActivities = (recentUsers || []).map((u: any) => ({
    title: 'User Registered',
    desc: `${u.name || 'User'} (${u.role || 'user'})`,
    createdAt: u.created_at,
  }));

  const allActivities = [...carActivities, ...userActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    cars: cars || 0,
    blogs: 0,
    users: users || 0,
    views: totalViews,
    inspections: 0,
    inquiries: 0,
    activities: allActivities,
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildPagination(page: number, pageSize: number, total: number): { page: number; totalPages: number } {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  return { page: safePage, totalPages: Math.ceil(total / safePageSize) };
}

export async function fetchAdminCars(search?: string, page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  let query = supabase
    .from('cars')
    .select('id, title, make, brand, model, year, price, currency, status, images, city, created_at, seller_id, user_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch cars');

  const formattedData = (data || []).map((c: any) => ({
    ...c,
    make: c.make || c.brand || '',
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  return { data: formattedData, total, page: safePage, pageSize: safePageSize, totalPages };
}

// ── SELLER-SCOPED: only returns cars for the currently logged-in dealer ──────
export async function fetchSellerCars(search?: string, page: number = 1, pageSize: number = 15) {
  const session = await getSession();
  if (!session) throw new Error('Authentication required');
  if (session.status === 'suspended') throw new Error('Your account has been suspended.');

  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  // Build OR filter: match seller_id OR user_id (auth_user_id)
  let orFilter = `seller_id.eq.${session.id}`;
  if (session.auth_user_id && session.auth_user_id !== session.id) {
    orFilter += `,user_id.eq.${session.auth_user_id}`;
  }
  // Also match seller_id by auth_user_id in case it was stored that way
  orFilter += `,user_id.eq.${session.id}`;

  let query = supabase
    .from('cars')
    .select('id, title, make, brand, model, year, price, currency, status, images, city, created_at, seller_id, user_id', { count: 'exact' })
    .or(orFilter)
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch seller cars');

  const formattedData = (data || []).map((c: any) => ({
    ...c,
    make: c.make || c.brand || '',
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  return { data: formattedData, total, page: safePage, pageSize: safePageSize, totalPages };
}



export async function fetchAdminBlogs(_search?: string, page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  return { data: [], total: 0, page: Math.max(1, page), pageSize: Math.min(Math.max(1, pageSize), 100), totalPages: 0 };
}

export async function fetchAdminInspections(page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  const query = supabase
    .from('inspections')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch inspections');

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  return { data: data ?? [], total, page: safePage, pageSize: safePageSize, totalPages };
}

export async function fetchAdminSettings() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) handleError(error, 'Failed to fetch site settings');
  const settings: Record<string, string> = {};
  (data || []).forEach((item: any) => {
    settings[item.key] = item.value;
  });
  return settings;
}

export async function fetchAdminSeo() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('seo_settings').select('*');
  if (error) handleError(error, 'Failed to fetch SEO settings');
  return data ?? [];
}

export async function fetchAdminAnalytics() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const [
    { count: totalCars },
    { count: totalUsers },
    { count: totalBlogs },
    { count: totalInquiries },
    { data: cars },
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('blogs').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('views_count, price, status'),
  ]);

  const totalViews = (cars || []).reduce((sum: number, c: any) => sum + (c.views_count || 0), 0);

  return {
    totalCars: totalCars || 0,
    totalUsers: totalUsers || 0,
    totalBlogs: totalBlogs || 0,
    totalInquiries: totalInquiries || 0,
    totalViews,
  };
}

export async function fetchAdminInquiries() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) handleError(error, 'Failed to fetch inquiries');
  return data ?? [];
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  await verifyAdminSession();

  if (!userId || !newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const serviceClient = createServiceRoleClient();
  const { data: userProfile, error: profileErr } = await serviceClient
    .from('users')
    .select('id, email, auth_user_id')
    .eq('id', userId)
    .single();

  if (profileErr || !userProfile) {
    throw new Error('Target user not found.');
  }

  let authUserId = userProfile.auth_user_id;

  if (!authUserId) {
    const { data: authUsers, error: listErr } = await serviceClient.auth.admin.listUsers();
    if (!listErr && authUsers?.users) {
      const matchedUser = authUsers.users.find(u => u.email?.toLowerCase() === userProfile.email.toLowerCase());
      if (matchedUser) {
        authUserId = matchedUser.id;
        await serviceClient
          .from('users')
          .update({ auth_user_id: matchedUser.id })
          .eq('id', userId);
      }
    }
  }

  if (!authUserId) {
    throw new Error(`Auth account for email ${userProfile.email} could not be resolved.`);
  }

  const { error: updateErr } = await serviceClient.auth.admin.updateUserById(authUserId, {
    password: newPassword,
  });

  if (updateErr) {
    throw new Error(updateErr.message || 'Failed to update user password.');
  }

  revalidatePath('/admin/users');
  return { success: true, message: `Password for ${userProfile.email} updated successfully.` };
}

export async function fetchCarDetailsById(id: string) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const { data: car, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !car) {
    throw new Error(error?.message || 'Car listing not found');
  }

  let sellerProfile: any = null;
  if (car.seller_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, phone, role, created_at')
      .eq('id', car.seller_id)
      .single();
    if (profile) sellerProfile = profile;
  }

  let inquiryCount = 0;
  try {
    const { count } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', id);
    inquiryCount = count || 0;
  } catch {}

  return {
    car,
    sellerProfile,
    inquiryCount,
  };
}

export async function fetchCarsForInspection(
  page: number = 1,
  filter: 'all' | 'unverified' | 'verified' = 'all',
  pageSize: number = 12
) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);

  let query = supabase
    .from('cars')
    .select('*', { count: 'exact' });

  if (filter === 'unverified') {
    query = query.or('is_inspected.is.null,is_inspected.eq.false');
  } else if (filter === 'verified') {
    query = query.eq('is_inspected', true);
  }

  query = query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch cars for inspection');

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);

  return {
    data: data || [],
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function verifyCarListing(
  carId: string,
  payload: {
    is_inspected: boolean;
    inspection_rating?: number | null;
    inspection_notes?: string | null;
  }
) {
  const sessionUser = await verifyAdminSession();
  const supabase = createServiceRoleClient();

  let inspectorName = sessionUser.name || 'Certified Inspector';
  let inspectorEmail = sessionUser.email || '';
  let inspectorPhone = sessionUser.phone || '';

  if (sessionUser.id) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('name, email, phone')
      .or(`id.eq.${sessionUser.id},auth_user_id.eq.${sessionUser.id}`)
      .maybeSingle();
    if (dbUser) {
      if (dbUser.name) inspectorName = dbUser.name;
      if (dbUser.email) inspectorEmail = dbUser.email;
      if (dbUser.phone) inspectorPhone = dbUser.phone;
    }
  }

  const updatePayload: any = {
    is_inspected: payload.is_inspected,
    inspection_rating: payload.is_inspected ? payload.inspection_rating ?? 9.0 : null,
    inspection_notes: payload.is_inspected ? payload.inspection_notes ?? null : null,
    inspected_at: payload.is_inspected ? new Date().toISOString() : null,
    inspector_id: payload.is_inspected ? sessionUser.id : null,
    inspector_name: payload.is_inspected ? inspectorName : null,
    inspector_email: payload.is_inspected ? inspectorEmail : null,
    inspector_phone: payload.is_inspected ? inspectorPhone : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('cars')
    .update(updatePayload)
    .eq('id', carId);

  if (error) {
    handleError(error, 'Failed to update vehicle inspection verification');
  }

  revalidatePath('/admin/inspections');
  revalidatePath('/seller/inspections');
  revalidatePath(`/admin/cars/${carId}`);
  revalidatePath(`/seller/cars/${carId}`);
  revalidatePath(`/buy-car/${carId}`);

  return { success: true };
}

export async function fetchUserDetailWithCars(userId: string) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !user) {
    throw new Error('User account not found');
  }

  let dealer: any = null;
  if (user.email) {
    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .or(`user_id.eq.${user.id},email.ilike.${user.email.trim()}`)
      .maybeSingle();
    dealer = dealerData;
  }

  let carFilter = `seller_id.eq.${user.id},user_id.eq.${user.id}`;
  if (user.auth_user_id) carFilter += `,user_id.eq.${user.auth_user_id}`;
  if (dealer?.id) carFilter += `,dealer_id.eq.${dealer.id}`;

  const { data: cars } = await supabase
    .from('cars')
    .select('id, title, make, brand, model, year, price, mileage, fuel_type, transmission, images, status, views_count, created_at')
    .or(carFilter)
    .order('created_at', { ascending: false });

  return {
    user,
    dealer,
    cars: cars || [],
  };
}

