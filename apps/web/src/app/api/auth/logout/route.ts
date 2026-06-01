// ============================================
// Logout API Route
// ============================================
// POST /api/auth/logout - Sign out user and clear session

import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Create response with redirect URL for client
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      redirectUrl: '/login',
    });

    // Clear session cookies by setting maxAge to 0
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Expire immediately
    };

    response.cookies.set('sb-access-token', '', {
      ...cookieOptions,
      maxAge: 0,
    });

    response.cookies.set('sb-refresh-token', '', {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 0,
    });

    console.log('[Logout] Session cookies cleared');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Also support GET for quick logout (e.g., from email link)
export async function GET(request: NextRequest) {
  return POST(request);
}