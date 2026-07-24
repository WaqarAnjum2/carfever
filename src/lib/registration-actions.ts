'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceRoleClient, createServerClient } from './supabase/server';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

import { verifyAdminSession } from './admin-actions';
import type { DbRegistrationRequest } from './supabase/types';

export type AllowedRegistrationRole = 'buyer' | 'seller';

const RegistrationRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller'], { message: 'Admin role is not permitted' }),
  message: z.string().max(1000).optional(),
});

const ApprovalActionSchema = z.object({
  requestId: z.string().uuid(),
  adminNotes: z.string().max(500).optional(),
});

function handleError(error: unknown, message: string): never {
  console.error(`[registration-actions] ${message}:`, error);
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

export async function submitRegistrationRequest(input: {
  name: string;
  email: string;
  phone?: string;
  role: AllowedRegistrationRole;
  message?: string;
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('signup', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  try {
    const parsed = RegistrationRequestSchema.parse(input);
    const email = parsed.email.toLowerCase().trim();

    const supabase = createServiceRoleClient();

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    // 2. Check if a pending registration request already exists
    const { data: existingReq } = await supabase
      .from('registration_requests')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingReq) {
      return { success: false, error: 'A pending registration request for this email address already exists.' };
    }

    // 3. Auto-approve Buyer accounts instantly on creation (no admin approval needed)
    if (parsed.role === 'buyer') {
      const passwordToSet = 'Buyer' + Math.floor(100000 + Math.random() * 900000) + '!';
      let authUserId: string | null = null;

      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: passwordToSet,
        email_confirm: true,
        user_metadata: { name: parsed.name, role: 'buyer' },
      });

      if (signUpError || !authData?.user) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email?.toLowerCase() === email);
        if (existing) {
          authUserId = existing.id;
          await supabase.auth.admin.updateUserById(authUserId, { password: passwordToSet });
        } else {
          throw new Error(`Failed to create buyer account: ${signUpError?.message || 'Unknown error'}`);
        }
      } else {
        authUserId = authData.user.id;
      }

      await supabase.from('users').upsert({
        auth_user_id: authUserId,
        name: parsed.name,
        email: email,
        phone: parsed.phone || null,
        role: 'buyer',
        status: 'active',
      }, { onConflict: 'email' });

      await supabase.from('registration_requests').insert({
        name: parsed.name,
        email: email,
        phone: parsed.phone || null,
        role: 'buyer',
        status: 'approved',
        admin_notes: 'Auto-approved buyer account',
        reviewed_at: new Date().toISOString(),
      });

      revalidatePath('/admin/users');

      return {
        success: true,
        autoApproved: true,
        email,
        password: passwordToSet,
      };
    }

    // 4. Seller / Dealer registration requires admin approval
    const dbRole = 'seller';
    const formattedMessage = parsed.message || null;

    const { error } = await supabase
      .from('registration_requests')
      .insert({
        name: parsed.name,
        email: email,
        phone: parsed.phone || null,
        role: dbRole,
        message: formattedMessage,
        status: 'pending',
      });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/registrations');
    return { success: true, autoApproved: false };
  } catch (err) {
    console.error('submitRegistrationRequest error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit registration request',
    };
  }
}

function extractRequestedRole(request: { role: string; message: string | null }): string {
  if (request.message && request.message.startsWith('[Requested Role: ')) {
    const match = request.message.match(/^\[Requested Role:\s*([^\]]+)\]/);
    if (match && match[1]) return match[1];
  }
  return request.role;
}

export async function checkRegistrationStatus(emailInput: string) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('status-check', ip);
  if (!allowed) {
    return { success: false, error: 'Too many status check requests. Please wait a moment.' };
  }

  const email = emailInput.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const supabase = createServiceRoleClient();

    // Check registration requests
    const { data: request } = await supabase
      .from('registration_requests')
      .select('status, role, message, admin_notes, created_at, reviewed_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (request) {
      const displayRole = extractRequestedRole(request);
      return {
        success: true as const,
        found: true as const,
        status: request.status as 'pending' | 'approved' | 'rejected',
        role: displayRole,
        createdAt: request.created_at,
        reviewedAt: request.reviewed_at,
        adminNotes: request.admin_notes,
      };
    }

    // Check existing user account
    const { data: user } = await supabase
      .from('users')
      .select('role, status, created_at')
      .eq('email', email)
      .maybeSingle();

    if (user) {
      return {
        success: true as const,
        found: true as const,
        status: 'approved' as const,
        role: user.role,
        createdAt: user.created_at,
        reviewedAt: null,
        adminNotes: 'Account active on platform',
      };
    }

    return {
      success: true as const,
      found: false as const,
    };
  } catch (err) {
    console.error('checkRegistrationStatus error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to check request status',
    };
  }
}

export async function approveRegistrationRequest(
  requestId: string,
  customPassword?: string,
  adminNotes?: string,
) {
  await verifyAdminSession();
  const serviceClient = createServiceRoleClient();

  const { data: request, error: fetchError } = await serviceClient
    .from('registration_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error('Registration request not found or already processed');
  }

  const passwordToSet = customPassword && customPassword.trim().length >= 6
    ? customPassword.trim()
    : (crypto.randomUUID().slice(0, 10) + 'A1!');

  const requestedRole = extractRequestedRole(request);

  // 1. Create user in Supabase Auth via Service Role Admin API
  let authUserId: string | null = null;
  const { data: authData, error: signUpError } = await serviceClient.auth.admin.createUser({
    email: request.email,
    password: passwordToSet,
    email_confirm: true,
    user_metadata: { name: request.name, role: requestedRole }
  });

  if (signUpError || !authData?.user) {
    // If auth user already exists, find existing user & update password
    const { data: listData } = await serviceClient.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email?.toLowerCase() === request.email.toLowerCase());
    if (existing) {
      authUserId = existing.id;
      await serviceClient.auth.admin.updateUserById(authUserId, { password: passwordToSet });
    } else {
      throw new Error(`Failed to create auth user: ${signUpError?.message || 'Unknown error'}`);
    }
  } else {
    authUserId = authData.user.id;
  }

  // 2. Upsert profile in public.users table
  const validRole = (['buyer', 'seller', 'content_manager', 'inspection_manager', 'admin'].includes(requestedRole) ? requestedRole : 'seller') as any;

  const { error: profileError } = await serviceClient
    .from('users')
    .upsert({
      auth_user_id: authUserId,
      name: request.name,
      email: request.email,
      phone: request.phone,
      role: validRole,
      status: 'active',
    }, { onConflict: 'email' });

  if (profileError) {
    console.error('[approveRegistrationRequest] profile upsert error:', profileError);
  }

  // 3. Mark registration request as approved
  const { error: updateError } = await serviceClient
    .from('registration_requests')
    .update({
      status: 'approved',
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    throw new Error('Failed to update request status');
  }

  revalidatePath('/admin/registrations');
  revalidatePath('/admin/users');

  return {
    success: true as const,
    tempPassword: passwordToSet,
    email: request.email,
  };
}

export async function rejectRegistrationRequest(
  requestId: string,
  adminNotes?: string,
) {
  await verifyAdminSession();
  const serviceClient = createServiceRoleClient();

  const { error: updateError } = await serviceClient
    .from('registration_requests')
    .update({
      status: 'rejected',
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw new Error('Failed to reject request');

  revalidatePath('/admin/registrations');
  return { success: true as const };
}

export async function deleteRegistrationRequest(requestId: string) {
  await verifyAdminSession();
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from('registration_requests')
    .delete()
    .eq('id', requestId);

  if (error) throw new Error('Failed to delete registration request');

  revalidatePath('/admin/registrations');
  return { success: true as const };
}

export async function fetchRegistrationRequests(statusFilter?: 'pending' | 'approved' | 'rejected') {
  try {
    await verifyAdminSession();
    const serviceClient = createServiceRoleClient();

    let query = serviceClient
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) return [];
    return (data as DbRegistrationRequest[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPendingRegistrationCount() {
  try {
    const supabase = createServiceRoleClient();
    const { count } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return count ?? 0;
  } catch {
    return 0;
  }
}
