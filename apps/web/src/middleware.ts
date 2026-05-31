// ============================================
// Middleware
// Handles authentication, profile completion, and admin protection
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Routes to redirect authenticated users away from
const guestRoutes = ['/login', '/register'];

// Admin roles
const ADMIN_ROLES = ['admin', 'super_admin', 'system_owner'];

// Check if profile is incomplete (PRD requirements)
async function isProfileIncomplete(supabaseUrl: string, supabaseAnonKey: string, accessToken: string): Promise<boolean> {
  try {
    // Fetch user info
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      return true; // Assume incomplete if we can't verify
    }

    const user = await response.json();
    
    // Fetch profile with required fields
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

    // PRD: Profile is incomplete if any required field is missing
    const hasFullName = profile?.full_name && profile.full_name.trim().length > 0;
    const hasPhone = profile?.phone && profile.phone.trim().length > 0;
    const hasAddress = profile?.address && profile.address.trim().length > 0;
    const hasCustomerId = profile?.customer_id && profile.customer_id.trim().length > 0;

    return !hasFullName || !hasPhone || !hasAddress || !hasCustomerId;
  } catch {
    return true; // Assume incomplete on error
  }
}

// Check if user has admin role
async function hasAdminRole(supabaseUrl: string, supabaseAnonKey: string, accessToken: string): Promise<boolean> {
  try {
    // Fetch user info
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      return false;
    }

    const user = await response.json();
    
    // Check profile role
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        },
      }
    );

    const profiles = await profileResponse.json();
    const profile = profiles?.[0];

    return profile?.role && ADMIN_ROLES.includes(profile.role);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Get the access token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;

  const isAuthenticated = !!accessToken;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');
  const isGuestRoute = guestRoutes.some(route => pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isSetupRoute = pathname.startsWith('/setup');

  // Admin route protection (BUG #3 FIX)
  if (isAdminRoute) {
    if (!isAuthenticated) {
      // Not logged in - redirect to login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin role
    const isAdmin = await hasAdminRole(supabaseUrl, supabaseAnonKey, accessToken);
    
    if (!isAdmin) {
      // Not admin - return 403 or redirect to dashboard
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // Redirect authenticated users away from guest routes
  if (isAuthenticated && isGuestRoute) {
    // Check if profile is complete (BUG #4 FIX)
    const incomplete = await isProfileIncomplete(supabaseUrl, supabaseAnonKey, accessToken);
    
    if (incomplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle onboarding route - redirect if authenticated and profile is complete
  if (isOnboardingRoute && isAuthenticated) {
    const incomplete = await isProfileIncomplete(supabaseUrl, supabaseAnonKey, accessToken);
    
    if (!incomplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Handle setup route - same as onboarding
  if (isSetupRoute && isAuthenticated) {
    const incomplete = await isProfileIncomplete(supabaseUrl, supabaseAnonKey, accessToken);
    
    if (!incomplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
