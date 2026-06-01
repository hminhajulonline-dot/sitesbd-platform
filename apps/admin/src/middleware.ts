// ============================================
// Admin Middleware
// Handles authentication and admin role check
// Admin subdomain is HIDDEN - direct access returns 404
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin roles
const ADMIN_ROLES = ['admin', 'super_admin', 'system_owner'];

// Check if user has admin role
async function hasAdminRole(
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
      return false;
    }

    const user = await response.json();

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}&select=role`,
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
  const url = new URL(request.url);
  const pathname = url.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // /login is the only public route
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    // Check if already authenticated with admin role
    const accessToken = request.cookies.get('sb-access-token')?.value;
    if (accessToken) {
      const isAdmin = await hasAdminRole(supabaseUrl, supabaseAnonKey, accessToken);
      if (isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    // Allow access to login page
    return NextResponse.next();
  }

  // All other routes require authentication
  const accessToken = request.cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    // No session - return 404 (not a redirect to login)
    // This hides the admin subdomain from public discovery
    return NextResponse.json(
      { error: 'Not Found', message: 'This page could not be found.' },
      { status: 404 }
    );
  }

  // Verify session and admin role
  const isAdmin = await hasAdminRole(supabaseUrl, supabaseAnonKey, accessToken);

  if (!isAdmin) {
    // Authenticated but not admin - return 403
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin access required.' },
      { status: 403 }
    );
  }

  // Admin role verified - allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};