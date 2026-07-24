import 'server-only';

import { createServerClient as createSSRClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value === 'placeholder') {
    throw new Error(
      `Missing or invalid environment variable: ${name}. ` +
        'Copy env.local.template to .env.local and add your Supabase credentials.'
    );
  }
  return value;
}

function getSupabaseUrl(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const opts = getCookieOptions();

  return createSSRClient<Database>(
    getSupabaseUrl(),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...opts, ...options })
            );
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
}

export function createServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(
    getSupabaseUrl(),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url && url !== 'placeholder' &&
    anon && anon !== 'placeholder' &&
    service && service !== 'placeholder'
  );
}
