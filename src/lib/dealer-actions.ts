'use server';

import { createServiceRoleClient, createServerClient } from './supabase/server';
import { revalidatePath } from 'next/cache';
import type { DbDealer } from './supabase/types';
import { DealerApplicationSchema } from './validation';
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

export async function getApprovedDealers(filters?: { city?: string; search?: string }) {
  const supabase = createServiceRoleClient();
  let query = supabase.from('dealers').select('*').eq('status', 'approved').order('created_at', { ascending: false });

  if (filters?.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters?.search) {
    query = query.ilike('company_name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as DbDealer[];
}

export async function getAllDealers(page: number = 1, pageSize: number = 20) {
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const supabase = createServiceRoleClient();
  const { count } = await supabase.from('dealers').select('*', { count: 'exact', head: true });
  const total = count ?? 0;
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const totalPages = Math.ceil(total / safePageSize);

  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (error) throw new Error(error.message);
  return { data: data as DbDealer[], total, page: safePage, pageSize: safePageSize, totalPages };
}

export async function getDealerById(id: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('dealers').select('*').eq('id', id).single();

  if (error) throw new Error(error.message);
  return data as DbDealer;
}

export async function getDealerCars(dealerId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('dealer_id', dealerId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function applyForDealer(
  data: Omit<DbDealer, 'id' | 'status' | 'is_verified' | 'rating_avg' | 'total_reviews' | 'created_at' | 'updated_at'>
) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) {
    throw new Error('Too many requests. Please try again later.');
  }

  try {
    const parsed = DealerApplicationSchema.parse(data);

    const adminSupabase = createServiceRoleClient();

    const { error } = await adminSupabase.from('dealers').insert({
      company_name: parsed.company_name,
      license_number: parsed.license_number,
      email: parsed.email,
      phone: parsed.phone,
      city: parsed.city,
      address: parsed.address,
      website: parsed.website || null,
      description: parsed.description,
      user_id: data.user_id || null,
      logo_url: data.logo_url || null,
      business_hours: data.business_hours || null,
      status: 'pending',
      is_verified: false,
      rating_avg: 0,
      total_reviews: 0,
    });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/dealers');
    return true;
  } catch (err) {
    console.error('applyForDealer error:', err);
    throw err;
  }
}

export async function updateDealerStatus(dealerId: string, status: 'approved' | 'suspended' | 'pending') {
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('dealers').update({ status }).eq('id', dealerId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/dealers');
  revalidatePath('/dealers');
  return true;
}
