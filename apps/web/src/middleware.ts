// ============================================
// Middleware
// Handles authentication and profile completion redirects
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Routes to redirect authenticated users away from
const guestRoutes = ['/login', '/register'];

// Check if profile is incomplete
async function isProfileIncomplete(supabaseUrl: string, supabaseAnonKey: string, accessToken: string): Promise<boolean> {
  try {
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
    
    // Fetch profile
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}&select=full_name,phone`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    const profiles = await profileResponse.json();
    const profile = profiles?.[0];

    // Fetch preferences
    const prefsResponse = await fetch(`${supabaseUrl}/rest/v1/user_preferences?user_id=eq.${user.id}&select=language,timezone`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    const prefs = await prefsResponse.json();
    const preferences = prefs?.[0];

    // Check completion
    const hasFullName = profile?.full_name && profile.full_name.trim().length > 0;
    const hasLanguage = preferences?.language && preferences.language.trim().length > 0;
    const hasTimezone = preferences?.timezone && preferences.timezone.trim().length > 0;

    return !hasFullName || !hasLanguage || !hasTimezone;
  } catch {
    return true; // Assume incomplete on error
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
  const isGuestRoute = guestRoutes.some(route => pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // Redirect authenticated users away from guest routes
  if (isAuthenticated && isGuestRoute) {
    // Check if profile is complete
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
