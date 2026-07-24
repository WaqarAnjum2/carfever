import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next({ request });

  // Security headers
  const isProduction = process.env.NODE_ENV === 'production';
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Exempt public pages and login endpoints
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/seller')) {
    return response;
  }
  if (pathname === '/admin/login' || pathname === '/login') {
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: isProduction,
              sameSite: 'lax',
              path: '/',
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let { data: dbUser } = await serviceClient
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!dbUser && user.email) {
    const { data: byEmail } = await serviceClient
      .from('users')
      .select('role')
      .ilike('email', user.email.trim())
      .maybeSingle();
    if (byEmail) {
      dbUser = byEmail;
      serviceClient
        .from('users')
        .update({ auth_user_id: user.id })
        .ilike('email', user.email.trim())
        .then(() => {});
    }
  }

  const role = dbUser?.role || user.user_metadata?.role || 'buyer';

  // Security Gate for Admin Routes
  if (pathname.startsWith('/admin')) {
    if (role === 'seller') {
      return NextResponse.redirect(new URL('/seller/dashboard', request.url));
    }
    if (role === 'buyer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const ADMIN_ROLES = ['admin'];
    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Security Gate for Seller Routes
  if (pathname.startsWith('/seller')) {
    if (role === 'buyer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    const SELLER_PERMITTED_ROLES = ['seller', 'admin'];
    if (!SELLER_PERMITTED_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*'],
};
