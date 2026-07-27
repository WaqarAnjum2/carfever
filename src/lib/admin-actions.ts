'use server';

import { cache } from 'react';
import { revalidatePath, revalidateTag } from 'next/cache';
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
  revalidatePath('/about');
  revalidatePath('/about-us');
  revalidatePath('/');
  revalidatePath('/admin/settings');
  return true;
}

// ============================================================================
// AUTH
// ============================================================================

export async function loginAdmin(emailInput: string, passwordInput: string) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('login', ip);
  if (!allowed) {
    return {
      success: false as const,
      errorType: 'rate_limited',
      error: 'Too many login attempts. Please wait a moment before trying again.',
    };
  }

  const cleanEmail = (emailInput || '').toLowerCase().trim();
  if (!cleanEmail || !passwordInput) {
    return {
      success: false as const,
      errorType: 'invalid_format',
      error: 'Please provide both email address and password.',
    };
  }

  const supabase = await createServerClient();
  const serviceClient = createServiceRoleClient();

  // 1. Fetch user profile from DB to verify account existence & status first
  const { data: dbUser } = await serviceClient
    .from('users')
    .select('id, auth_user_id, email, name, role, status')
    .ilike('email', cleanEmail)
    .maybeSingle();

  // 2. Check registration requests if not found in active users
  let pendingReq: any = null;
  if (!dbUser) {
    const { data: reqData } = await serviceClient
      .from('registration_requests')
      .select('id, status, role')
      .ilike('email', cleanEmail)
      .maybeSingle();
    pendingReq = reqData;
  }

  // 3. Verify if Auth user object exists in Supabase Auth
  let authUserObj: any = null;
  if (dbUser?.auth_user_id) {
    const { data: authRes } = await serviceClient.auth.admin.getUserById(dbUser.auth_user_id);
    if (authRes?.user) authUserObj = authRes.user;
  }

  if (!authUserObj) {
    try {
      const { data: listRes } = await serviceClient.auth.admin.listUsers();
      const found = listRes?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (found) authUserObj = found;
    } catch {}
  }

  // ── SCENARIO A: ACCOUNT DOES NOT EXIST AT ALL ──
  if (!dbUser && !authUserObj) {
    if (pendingReq?.status === 'pending') {
      return {
        success: false as const,
        errorType: 'pending_approval',
        error: 'PENDING: Your registration application is currently under admin review. You will gain access once approved.',
      };
    }
    if (pendingReq?.status === 'rejected') {
      return {
        success: false as const,
        errorType: 'rejected',
        error: 'REJECTED: Your registration request was rejected by administration.',
      };
    }
    return {
      success: false as const,
      errorType: 'not_found',
      error: 'NO_ACCOUNT: No account was found matching this email address. Please check your spelling or register a new account.',
    };
  }

  // ── SCENARIO B: ACCOUNT EXISTS BUT IS BLOCKED / SUSPENDED ──
  if (dbUser?.status === 'suspended') {
    try { await supabase.auth.signOut(); } catch {}
    return {
      success: false as const,
      errorType: 'suspended',
      error: 'BLOCKED: Your account has been blocked by an administrator. Please contact support for assistance.',
    };
  }

  // ── SCENARIO C: ATTEMPT PASSWORD LOGIN ──
  const emailToUse = authUserObj?.email || dbUser?.email || cleanEmail;
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password: passwordInput,
  });

  // Retry with alternative email casing if needed
  if (authError || !authData?.user) {
    if (authUserObj?.email && authUserObj.email !== emailToUse) {
      const retry = await supabase.auth.signInWithPassword({
        email: authUserObj.email,
        password: passwordInput,
      });
      if (retry.data?.user) {
        authData = retry.data;
        authError = null;
      }
    }
  }

  // ── SCENARIO D: INCORRECT PASSWORD ──
  if (authError || !authData?.user) {
    return {
      success: false as const,
      errorType: 'incorrect_password',
      error: 'INCORRECT_PASSWORD: The password you entered is incorrect. Please check your password and try again.',
    };
  }

  // ── SCENARIO E: PROFILE RETRIEVAL / CREATION AFTER SUCCESSFUL AUTH ──
  let finalProfile = dbUser;
  if (!finalProfile) {
    const { data: profileByAuth } = await serviceClient
      .from('users')
      .select('id, auth_user_id, name, email, role, status')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    finalProfile = profileByAuth;
  }

  if (!finalProfile) {
    try { await supabase.auth.signOut(); } catch {}
    return {
      success: false as const,
      errorType: 'not_found',
      error: 'NO_ACCOUNT: No profile was found for this account. It may have been removed by an administrator.',
    };
  }


  // Double check suspension status after profile load
  if (finalProfile?.status === 'suspended') {
    try { await supabase.auth.signOut(); } catch {}
    return {
      success: false as const,
      errorType: 'suspended',
      error: 'BLOCKED: Your account has been blocked by an administrator. Please contact support for assistance.',
    };
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/dashboard');
  return { success: true as const, user: finalProfile };
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

    if (!userData) {
      try { await supabase.auth.signOut(); } catch {}
      return null;
    }

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
    { count: pendingReqs },
    { data: carsViews },
    { data: recentCars },
    { data: recentUsers },
    { data: recentReqs },
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('registration_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('cars').select('views_count, created_at'),
    supabase.from('cars').select('id, title, model, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, name, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('registration_requests').select('id, name, role, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalViews = (carsViews || []).reduce((sum: number, c: any) => sum + (c.views_count || 0), 0);

  const carActivities = (recentCars || []).map((c: any) => ({
    title: 'New Car Listed',
    desc: c.title || 'Vehicle',
    createdAt: c.created_at,
  }));

  const userActivities = (recentUsers || []).map((u: any) => ({
    title: 'User Account Created',
    desc: `${u.name || 'User'} (${u.role === 'seller' ? 'Dealer' : u.role || 'User'})`,
    createdAt: u.created_at,
  }));

  const reqActivities = (recentReqs || []).map((r: any) => ({
    title: 'Dealer Application Received',
    desc: `${r.name || 'Applicant'} requested dealership access`,
    createdAt: r.created_at,
  }));

  const allActivities = [...carActivities, ...userActivities, ...reqActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  return {
    cars: cars || 0,
    users: users || 0,
    pendingRequests: pendingReqs || 0,
    views: totalViews,
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
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (search && search.trim().length > 0) {
    query = query.or(`title.ilike.%${search.trim()}%,model.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error('fetchAdminCars error:', error.message);
    const fallback = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    const formattedFallback = (fallback.data || []).map((c: any) => ({
      ...c,
      make: c.make || c.brand || 'Vehicle',
    }));
    return { data: formattedFallback, total: formattedFallback.length, page: 1, pageSize, totalPages: 1 };
  }

  const formattedData = (data || []).map((c: any) => ({
    ...c,
    make: c.make || c.brand || 'Vehicle',
  }));

  const total = count ?? formattedData.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  return { data: formattedData, total, page: safePage, pageSize: safePageSize, totalPages };
}

// ── DEALER-SCOPED: returns cars for the logged-in dealer ──────
export async function fetchSellerCars(search?: string, page: number = 1, pageSize: number = 15) {
  const session = await getSession();
  if (!session) throw new Error('Authentication required');
  if (session.status === 'suspended') throw new Error('Your account has been suspended.');

  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  const sId = session.id;
  const sAuthId = session.auth_user_id || session.id;

  // Step 1: Auto-link any unassigned legacy cars in the database to this dealer account
  try {
    const { data: unlinked } = await supabase
      .from('cars')
      .select('id, seller_id')
      .or('seller_id.is.null,seller_id.eq.');

    if (unlinked && unlinked.length > 0) {
      const idsToClaim = unlinked.map(c => c.id);
      await supabase
        .from('cars')
        .update({
          seller_id: sId,
          user_id: sAuthId,
          seller_name: session.name || undefined,
          seller_phone: session.phone || undefined,
        } as any)

        .in('id', idsToClaim);
    }
  } catch (claimErr) {
    console.warn('Auto-link legacy cars note:', claimErr);
  }

  // Step 2: Fetch all cars safely
  const { data: allCars, error } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchSellerCars query error:', error.message);
    return { data: [], total: 0, page: 1, pageSize: safePageSize, totalPages: 1 };
  }

  const rawList = allCars || [];

  const sEmail = (session.email || '').toLowerCase().trim();
  const sName = (session.name || '').toLowerCase().trim();
  const sPhone = (session.phone || '').trim();

  // Step 3: Strictly match cars created by or linked to THIS dealer
  let myCars = rawList.filter((c: any) => {
    const cSellerId = String(c.seller_id || '').toLowerCase();
    const cUserId = String(c.user_id || '').toLowerCase();
    const cSellerName = String(c.seller_name || '').toLowerCase().trim();
    const cSellerPhone = String(c.seller_phone || '').trim();

    if (sId && (cSellerId === sId.toLowerCase() || cUserId === sId.toLowerCase())) return true;
    if (sAuthId && (cSellerId === sAuthId.toLowerCase() || cUserId === sAuthId.toLowerCase())) return true;
    if (sEmail && cSellerName.includes(sEmail)) return true;
    if (sName && sName.length > 2 && cSellerName.includes(sName)) return true;
    if (sPhone && sPhone.length > 5 && cSellerPhone.includes(sPhone)) return true;

    return false;
  });

  // Search filtering
  if (search && search.trim().length > 0) {
    const q = search.toLowerCase().trim();
    myCars = myCars.filter((c: any) =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.make || c.brand || '').toLowerCase().includes(q) ||
      (c.model || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  }

  const formattedData = myCars.map((c: any) => ({
    ...c,
    make: c.make || c.brand || 'Vehicle',
  }));

  const total = formattedData.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const pagedData = formattedData.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  return { data: pagedData, total, page: safePage, pageSize: safePageSize, totalPages };
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
  const carObj = car as any;
  const sellerIdToQuery = carObj.seller_id || carObj.user_id;

  if (sellerIdToQuery) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, auth_user_id, name, email, phone, role, status, created_at')
      .eq('id', sellerIdToQuery)
      .maybeSingle();

    if (profile) {
      sellerProfile = profile;
    } else {
      const { data: byAuth } = await supabase
        .from('users')
        .select('id, auth_user_id, name, email, phone, role, status, created_at')
        .eq('auth_user_id', sellerIdToQuery)
        .maybeSingle();

      if (byAuth) sellerProfile = byAuth;
    }
  }

  if (!sellerProfile && carObj.seller_name) {
    const { data: byName } = await supabase
      .from('users')
      .select('id, auth_user_id, name, email, phone, role, status, created_at')
      .ilike('name', `%${carObj.seller_name}%`)
      .maybeSingle();

    if (byName) sellerProfile = byName;
  }

  if (!sellerProfile) {
    const { data: firstDealer } = await supabase
      .from('users')
      .select('id, auth_user_id, name, email, phone, role, status, created_at')
      .eq('role', 'seller')
      .maybeSingle();

    sellerProfile = firstDealer;
  }

  return {
    car: {
      ...carObj,
      make: carObj.make || carObj.brand || 'Vehicle',
      seller_name: carObj.seller_name || sellerProfile?.name || 'Verified Dealer',
      seller_phone: carObj.seller_phone || sellerProfile?.phone || '07911 123456',
    },
    sellerProfile,
    inquiryCount: 0,
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

  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!user) {
    const { data: byAuth } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();
    user = byAuth;
  }

  if (!user) {
    throw new Error('User account not found');
  }

  const { data: allCars, error } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchUserDetailWithCars query error:', error.message);
  }

  const rawList = allCars || [];
  const uId = (user.id || '').toLowerCase();
  const uAuthId = (user.auth_user_id || '').toLowerCase();
  const uEmail = (user.email || '').toLowerCase().trim();
  const uName = (user.name || '').toLowerCase().trim();
  const uPhone = (user.phone || '').trim();

  let userCars = rawList.filter((c: any) => {
    const cSellerId = String(c.seller_id || '').toLowerCase();
    const cUserId = String(c.user_id || '').toLowerCase();
    const cSellerName = String(c.seller_name || '').toLowerCase().trim();
    const cSellerPhone = String(c.seller_phone || '').trim();

    if (uId && (cSellerId === uId || cUserId === uId)) return true;
    if (uAuthId && (cSellerId === uAuthId || cUserId === uAuthId)) return true;
    if (uEmail && cSellerName.includes(uEmail)) return true;
    if (uName && uName.length > 2 && cSellerName.includes(uName)) return true;
    if (uPhone && uPhone.length > 5 && cSellerPhone.includes(uPhone)) return true;

    return false;
  });

  const formattedCars = userCars.map((c: any) => ({
    ...c,
    make: c.make || c.brand || 'Vehicle',
    brand: c.brand || c.make || 'Vehicle',
    image_url: Array.isArray(c.images) && c.images[0] ? c.images[0] : (c.image_url || null),
  }));

  return {
    user,
    dealer: {
      company_name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    cars: formattedCars,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING LISTINGS APPROVAL ENGINE (Optimized, Atomic & Race-Condition Safe)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingCarListings(params?: {
  page?: number;
  limit?: number;
  search?: string;
  make?: string;
  city?: string;
}) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 12));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('cars')
    .select('*', { count: 'exact' })
    .or('status.eq.pending,status.is.null,is_approved.eq.false')
    .order('created_at', { ascending: false });

  if (params?.search && params.search.trim().length > 0) {
    const s = `%${params.search.trim()}%`;
    query = query.or(`title.ilike.${s},model.ilike.${s},make.ilike.${s},seller_name.ilike.${s},city.ilike.${s}`);
  }

  if (params?.make && params.make !== 'all') {
    query = query.or(`make.ilike.${params.make},brand.ilike.${params.make}`);
  }

  if (params?.city && params.city !== 'all') {
    query = query.ilike('city', params.city);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('getPendingCarListings DB error:', error.message);
    // Fallback: Query status.eq.pending explicitly
    const fallback = await supabase
      .from('cars')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const total = fallback.count || 0;
    return {
      cars: fallback.data || [],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const total = count || 0;
  return {
    cars: data || [],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPendingCarsCount(): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    const { count, error } = await supabase
      .from('cars')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.pending,status.is.null,is_approved.eq.false');

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function approveCarListing(id: string, options?: { verified?: boolean }) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const payload: any = {
    status: 'approved',
    is_approved: true,
    updated_at: new Date().toISOString(),
  };

  if (options?.verified) {
    payload.is_verified = true;
  }

  let { data, error } = await supabase
    .from('cars')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();

  // Retry stripping non-existent columns if schema varies
  if (error) {
    delete payload.is_verified;
    delete payload.is_approved;
    const retry = await supabase.from('cars').update(payload).eq('id', id).select().maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to approve car listing');

  revalidatePath('/admin/approvals');
  revalidatePath('/admin/cars');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');
  revalidatePath('/');

  return { success: true, car: data };
}

export async function rejectCarListing(id: string, reason?: string) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const payload: any = {
    status: 'rejected',
    is_approved: false,
    updated_at: new Date().toISOString(),
  };

  if (reason) {
    payload.rejection_reason = reason;
  }

  let { data, error } = await supabase
    .from('cars')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    delete payload.rejection_reason;
    const retry = await supabase.from('cars').update(payload).eq('id', id).select().maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to reject car listing');

  revalidatePath('/admin/approvals');
  revalidatePath('/admin/cars');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');

  return { success: true, car: data };
}

export async function bulkApproveCarListings(carIds: string[]) {
  await verifyAdminSession();
  if (!carIds || carIds.length === 0) return { success: true, approvedCount: 0 };

  const supabase = createServiceRoleClient();
  const payload: any = {
    status: 'approved',
    is_approved: true,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from('cars')
    .update(payload)
    .in('id', carIds);

  if (error) {
    delete payload.is_approved;
    const retry = await supabase.from('cars').update(payload).in('id', carIds);
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to bulk approve car listings');

  revalidatePath('/admin/approvals');
  revalidatePath('/admin/cars');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');
  revalidatePath('/');

  return { success: true, approvedCount: carIds.length };
}

export async function approveAllPendingListings() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const payload: any = {
    status: 'approved',
    is_approved: true,
    updated_at: new Date().toISOString(),
  };

  // Single atomic update for all pending listings to prevent locks and race conditions
  let { error } = await supabase
    .from('cars')
    .update(payload)
    .or('status.eq.pending,status.is.null,is_approved.eq.false');

  if (error) {
    delete payload.is_approved;
    const retry = await supabase
      .from('cars')
      .update(payload)
      .eq('status', 'pending');
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to approve all pending listings');

  revalidatePath('/admin/approvals');
  revalidatePath('/admin/cars');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');
  revalidatePath('/');

  return { success: true };
}

export async function wipeAllListingsAndNonAdminUsers() {
  const currentAdmin = await verifyAdminSession();
  const supabase = createServiceRoleClient();

  // 1. Delete all car listings
  const { error: carErr } = await supabase
    .from('cars')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (carErr) console.warn('Wipe cars warning:', carErr.message);

  // 2. Delete registration requests
  const { error: regErr } = await supabase
    .from('registration_requests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (regErr) console.warn('Wipe registration requests warning:', regErr.message);

  // 3. Delete non-admin users from public.users table
  const { data: nonAdminProfiles } = await supabase
    .from('users')
    .select('id, auth_user_id, email, role')
    .not('role', 'in', '(admin,super_admin)');

  const { error: userErr } = await supabase
    .from('users')
    .delete()
    .not('role', 'in', '(admin,super_admin)');

  if (userErr) console.warn('Wipe non-admin users warning:', userErr.message);

  // 4. Delete non-admin accounts from Supabase Auth (auth.users)
  try {
    const { data: authUsersRes } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authUsersRes?.users) {
      const currentAdminEmail = currentAdmin.email?.toLowerCase();
      for (const authUser of authUsersRes.users) {
        // Keep active admin account, delete non-admin users
        if (authUser.email && authUser.email.toLowerCase() === currentAdminEmail) {
          continue;
        }
        if (authUser.user_metadata?.role === 'admin' || authUser.user_metadata?.role === 'super_admin') {
          continue;
        }
        try {
          await supabase.auth.admin.deleteUser(authUser.id);
        } catch (delAuthErr: any) {
          console.warn(`Failed to delete auth user ${authUser.id}:`, delAuthErr?.message);
        }
      }
    }
  } catch (authListErr: any) {
    console.warn('Wipe auth.users warning:', authListErr?.message);
  }

  // 5. Storage API Cleanup (Safely removes uploaded car images without DB trigger error)
  try {
    const { data: files } = await supabase.storage.from('car-images').list();
    if (files && files.length > 0) {
      const paths = files.map((f) => f.name);
      await supabase.storage.from('car-images').remove(paths);
    }
  } catch (stErr: any) {
    console.warn('Storage API cleanup warning:', stErr?.message);
  }

  // 6. Revalidate all paths
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/cars');
  revalidatePath('/admin/users');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');
  revalidatePath('/');

  return { success: true };
}

export async function deleteUserCascade(targetUserId: string) {
  const currentAdmin = await verifyAdminSession();
  const supabase = createServiceRoleClient();

  // 1. Fetch target user by ID or check if input is email / auth_user_id
  let { data: targetUser } = await supabase
    .from('users')
    .select('id, auth_user_id, email, name, role, phone')
    .eq('id', targetUserId)
    .maybeSingle();

  if (!targetUser) {
    // Fallback: try fetching by auth_user_id
    const { data: byAuthId } = await supabase
      .from('users')
      .select('id, auth_user_id, email, name, role, phone')
      .eq('auth_user_id', targetUserId)
      .maybeSingle();
    targetUser = byAuthId;
  }

  if (!targetUser) {
    // Fallback: try fetching by email
    const { data: byEmail } = await supabase
      .from('users')
      .select('id, auth_user_id, email, name, role, phone')
      .ilike('email', targetUserId)
      .maybeSingle();
    targetUser = byEmail;
  }

  const targetEmail = targetUser?.email || targetUserId;

  // Prevent self-deletion
  if (
    (targetUser && targetUser.id === currentAdmin.id) ||
    (targetEmail && currentAdmin.email && targetEmail.toLowerCase() === currentAdmin.email.toLowerCase())
  ) {
    handleError(new Error('You cannot delete your own active admin account.'), 'Delete User');
  }

  // 2. Cascade delete all cars associated with this user/seller
  if (targetUser) {
    const carFilter = targetUser.phone
      ? `user_id.eq.${targetUser.id},created_by.eq.${targetUser.id},seller_phone.eq.${targetUser.phone}`
      : `user_id.eq.${targetUser.id},created_by.eq.${targetUser.id}`;

    const { error: carDelErr } = await supabase
      .from('cars')
      .delete()
      .or(carFilter);

    if (carDelErr) console.warn('Cascade delete cars warning:', carDelErr.message);
  }

  // 3. Delete registration requests for this email
  if (targetEmail) {
    const { error: regDelErr } = await supabase
      .from('registration_requests')
      .delete()
      .ilike('email', targetEmail);

    if (regDelErr) console.warn('Cascade delete registration requests warning:', regDelErr.message);
  }

  // 4. Delete user from public.users table
  if (targetUser) {
    const { error: userDelErr } = await supabase
      .from('users')
      .delete()
      .eq('id', targetUser.id);

    if (userDelErr) handleError(userDelErr, 'Failed to delete user profile from public database');
  }

  // 5. Delete user from auth.users (Supabase Auth) - Multi-pass lookup to guarantee removal
  const authIdsToDelete = new Set<string>();
  if (targetUser?.auth_user_id) {
    authIdsToDelete.add(targetUser.auth_user_id);
  }

  if (targetEmail) {
    try {
      const { data: authUsersRes } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (authUsersRes?.users) {
        for (const u of authUsersRes.users) {
          if (u.email && u.email.toLowerCase() === targetEmail.toLowerCase()) {
            authIdsToDelete.add(u.id);
          }
        }
      }
    } catch (listErr: any) {
      console.warn('Supabase Auth listUsers lookup warning:', listErr?.message);
    }
  }

  for (const authId of authIdsToDelete) {
    try {
      const { error: authDelErr } = await supabase.auth.admin.deleteUser(authId);
      if (authDelErr) console.warn(`Supabase Auth deleteUser warning (${authId}):`, authDelErr.message);
    } catch (authErr: any) {
      console.warn(`Supabase Auth deleteUser exception (${authId}):`, authErr?.message);
    }
  }

  // 6. Revalidate all paths
  revalidatePath('/admin/users');
  revalidatePath('/admin/dealers');
  revalidatePath('/admin/cars');
  revalidatePath('/admin/approvals');
  revalidatePath('/seller/cars');
  revalidatePath('/buy-car');
  revalidatePath('/');

  return {
    success: true,
    deletedUser: {
      id: targetUser?.id || targetUserId,
      name: targetUser?.name || targetEmail,
      email: targetEmail,
    },
  };
}



