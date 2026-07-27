'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAdminSession } from '@/lib/admin-actions';
import type { DbJob } from '@/lib/supabase/types';

export type JobInput = {
  title: string;
  department: string;
  location?: string;
  type?: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
  salary?: string;
  description: string;
  requirements?: string[];
  apply_google_form_url?: string;
  apply_whatsapp_number?: string;
  status?: 'active' | 'closed';
};

// ── Public Actions ───────────────────────────────────────────────────────────

export async function getPublicJobs(): Promise<DbJob[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getPublicJobs warning:', error.message);
      return [];
    }
    return (data as DbJob[]) || [];
  } catch (err: any) {
    console.error('getPublicJobs error:', err?.message);
    return [];
  }
}

export async function getJobById(id: string): Promise<DbJob | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as DbJob;
  } catch (err: any) {
    console.error('getJobById error:', err?.message);
    return null;
  }
}

// ── Admin Actions ────────────────────────────────────────────────────────────

export async function getAllJobsAdmin(): Promise<DbJob[]> {
  await verifyAdminSession();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as DbJob[]) || [];
  } catch (err: any) {
    console.error('getAllJobsAdmin error:', err?.message);
    return [];
  }
}

export async function createJob(input: JobInput): Promise<DbJob> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const payload = {
    title: input.title.trim(),
    department: input.department.trim(),
    location: input.location?.trim() || 'Bristol, United Kingdom',
    type: input.type || 'Full-time',
    salary: input.salary?.trim() || null,
    description: input.description,
    requirements: input.requirements || [],
    apply_google_form_url: input.apply_google_form_url?.trim() || null,
    apply_whatsapp_number: input.apply_whatsapp_number?.trim() || null,
    status: input.status || 'active',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create job posting: ${error.message}`);
  }

  revalidatePath('/jobs');
  revalidatePath('/admin/jobs');
  return data as DbJob;
}

export async function updateJob(id: string, input: Partial<JobInput>): Promise<DbJob> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.department !== undefined) payload.department = input.department.trim();
  if (input.location !== undefined) payload.location = input.location ? input.location.trim() : 'Bristol, United Kingdom';
  if (input.type !== undefined) payload.type = input.type;
  if (input.salary !== undefined) payload.salary = input.salary ? input.salary.trim() : null;
  if (input.description !== undefined) payload.description = input.description;
  if (input.requirements !== undefined) payload.requirements = input.requirements;
  if (input.apply_google_form_url !== undefined) payload.apply_google_form_url = input.apply_google_form_url ? input.apply_google_form_url.trim() : null;
  if (input.apply_whatsapp_number !== undefined) payload.apply_whatsapp_number = input.apply_whatsapp_number ? input.apply_whatsapp_number.trim() : null;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update job posting: ${error.message}`);
  }

  revalidatePath('/jobs');
  revalidatePath('/admin/jobs');
  return data as DbJob;
}

export async function deleteJob(id: string): Promise<{ success: boolean }> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete job posting: ${error.message}`);
  }

  revalidatePath('/jobs');
  revalidatePath('/admin/jobs');
  return { success: true };
}
