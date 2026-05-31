// ============================================
// Login API Route
// ============================================
// POST /api/auth/login - Sign in user

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 1) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in with password
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: signInError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Failed to sign in' },
        { status: 500 }
      );
    }

    // Get user profile to check role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, status')
      .eq('id', authData.user.id)
      .single();

    // Determine redirect based on role
    let redirectUrl = '/dashboard';
    if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'system_owner') {
      redirectUrl = '/admin/dashboard';
    }

    // Create response with session data
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      redirectUrl,
    });

    // Set session cookies for middleware authentication
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    };

    response.cookies.set('sb-access-token', authData.session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
      ...cookieOptions,
      httpOnly: false, // Refresh token needs to be accessible for token refresh
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
