// ============================================
// Dashboard Middleware
// Handles authentication, profile completion for user app
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if profile is incomplete (PRD requirements)
async function isProfileIncomplete(
  supabaseUrl: string,
  supabaseAnonKey: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      return true;
    }

    const user = await response.json();

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}&select=full_name,phone,address,customer_id`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        },
      }
    );

    const profiles = await profileResponse.json();
    const profile = profiles?.[0];

    const hasFullName = profile?.full_name && profile.full_name.trim().length > 0;
    const hasPhone = profile?.phone && profile.phone.trim().length > 0;
    const hasAddress = profile?.address && profile.address.trim().length > 0;
    const hasCustomerId = profile?.customer_id && profile.customer_id.trim().length > 0;

    return !hasFullName || !hasPhone || !hasAddress || !hasCustomerId;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Get access token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const isAuthenticated = !!accessToken;

  // Auth routes - redirect if already logged in
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isAuthenticated) {
      // Check if profile is incomplete
      const incomplete = await isProfileIncomplete(supabaseUrl, supabaseAnonKey, accessToken);
      if (incomplete) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Onboarding route
  if (pathname === '/onboarding') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow access - middleware will handle redirect if complete
    return NextResponse.next();
  }

  // Forgot password routes - public
  if (pathname.startsWith('/forgot-password')) {
    return NextResponse.next();
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check profile completion
    const incomplete = await isProfileIncomplete(supabaseUrl, supabaseAnonKey, accessToken);
    if (incomplete && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    return NextResponse.next();
  }

  // Default: allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login/:path*',
    '/register/:path*',
    '/onboarding/:path*',
    '/forgot-password/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
};