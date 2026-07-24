'use server';

import { createServiceRoleClient, createServerClient } from './supabase/server';
import { revalidatePath } from 'next/cache';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

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

/** Get all active dealer profiles from public.users */
export async function getApprovedDealers(filters?: { city?: string; search?: string }) {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from('users')
    .select('*')
    .eq('role', 'seller')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((u: any) => ({
    id: u.id,
    user_id: u.auth_user_id || u.id,
    company_name: u.name,
    phone: u.phone,
    email: u.email,
    logo_url: u.avatar_url || null,
    city: 'United Kingdom',
    status: u.status,
    is_verified: true,
    rating_avg: 5.0,
    total_reviews: 0,
    created_at: u.created_at,
    updated_at: u.updated_at || u.created_at,
  }));
}

/** Get paginated list of all dealers from public.users */
export async function getAllDealers(page: number = 1, pageSize: number = 20) {
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  const { data, count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('role', 'seller')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (error) throw new Error(error.message);

  const total = count ?? (data || []).length;
  const totalPages = Math.ceil(total / safePageSize);

  const formatted = (data || []).map((u: any) => ({
    id: u.id,
    user_id: u.auth_user_id || u.id,
    company_name: u.name,
    phone: u.phone,
    email: u.email,
    logo_url: u.avatar_url || null,
    city: 'United Kingdom',
    status: u.status,
    is_verified: true,
    created_at: u.created_at,
  }));

  return { data: formatted as any[], total, page: safePage, pageSize: safePageSize, totalPages };
}


export async function getDealerById(id: string) {
  const supabase = createServiceRoleClient();
  let { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    const { data: byAuth } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', id)
      .maybeSingle();

    data = byAuth;
  }

  if (!data) {
    throw new Error('Dealer profile not found');
  }

  return {
    id: data.id,
    user_id: data.auth_user_id || data.id,
    company_name: data.name,
    phone: data.phone,
    email: data.email,
    status: 'approved',
    is_verified: true,
    logo_url: data.avatar_url || null,
    address: null,
    city: 'United Kingdom',
    website: null,
    description: data.bio || `Official Verified Dealer - ${data.name}`,
    business_hours: null,
    rating_avg: 5.0,
    total_reviews: 0,
    created_at: data.created_at,
    updated_at: data.updated_at || data.created_at,
  } as any;
}



/** Get cars for specific dealer ID */
export async function getDealerCars(dealerId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .or(`seller_id.eq.${dealerId},user_id.eq.${dealerId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function applyForDealer(input: any) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) throw new Error('Too many requests. Please try again later.');

  const supabase = createServiceRoleClient();
  const email = (input.email || '').toLowerCase().trim();

  // Create registration request or auto-approve buyer/dealer
  const { error } = await supabase.from('registration_requests').insert({
    name: input.company_name || input.name,
    email: email,
    phone: input.phone || null,
    role: 'seller',
    status: 'pending',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return true;
}

export async function updateDealerStatus(dealerId: string, status: 'approved' | 'suspended' | 'pending') {
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const supabase = createServiceRoleClient();
  const dbStatus = status === 'approved' ? 'active' : status;
  const { error } = await supabase.from('users').update({ status: dbStatus }).eq('id', dealerId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return true;
}
