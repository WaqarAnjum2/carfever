import { cache } from 'react';
import { createServerClient, createServiceRoleClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export type SessionUser = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) return null;

    const serviceClient = createServiceRoleClient();

    // 1. Strictly fetch profile by auth_user_id
    let { data } = await serviceClient
      .from('users')
      .select('id, auth_user_id, name, email, role, status, phone')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // 2. Fallback: fetch by exact email
    if (!data && user.email) {
      const { data: byEmail } = await serviceClient
        .from('users')
        .select('id, auth_user_id, name, email, role, status, phone')
        .ilike('email', user.email)
        .maybeSingle();

      if (byEmail) {
        data = byEmail;
        // Link auth_user_id if missing to fix future lookups
        if (!byEmail.auth_user_id) {
          await serviceClient
            .from('users')
            .update({ auth_user_id: user.id })
            .eq('id', byEmail.id);
        }
      }
    }

    // 3. No profile found — deny session
    if (!data) return null;

    // 4. Strictly enforce suspension
    if (data.status === 'suspended') {
      await supabase.auth.signOut();
      return null;
    }

    return data as SessionUser;
  } catch (err) {
    console.error('getSession error:', err);
    return null;
  }
});

export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error || !session) return false;
    return true;
  } catch {
    return false;
  }
}

const ADMIN_ROLES = ['admin'] as const;

export function isAdminRole(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(['admin']);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireVerifiedSession(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.status === 'suspended') {
    redirect('/login?error=suspended');
  }
  return session;
}

export async function generateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60,
  });
  return token;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const stored = cookieStore.get('csrf_token');
    if (!stored) return false;
    const valid = stored.value === token;
    if (valid) {
      cookieStore.delete('csrf_token');
    }
    return valid;
  } catch {
    return false;
  }
}
