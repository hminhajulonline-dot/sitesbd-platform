// ============================================
// OTP Registration API Routes
// ============================================
// Step 1: POST /api/auth/register/send-otp - Send OTP for registration
// Step 2: POST /api/auth/register/verify-otp - Verify OTP
// Step 3: POST /api/auth/register/create-account - Create account

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client
function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}

// ============================================
// POST /api/auth/register/create-account
// ============================================
// Create user account after OTP verification
// OTP IS the email verification - no confirmation email needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password, fullName, phone, otpVerified } = body;

    // Validate input
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if OTP was verified
    if (!otpVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      );
    }

    // Check OTP verification status
    const supabaseAdmin = getSupabaseAdmin();
    const { data: otp } = await supabaseAdmin
      .from('email_otps')
      .select('status, verified_at')
      .eq('email', email.toLowerCase())
      .eq('purpose', 'registration')
      .single();

    if (!otp || otp.status !== 'verified') {
      return NextResponse.json(
        { error: 'Email OTP not verified. Please verify your email first.' },
        { status: 400 }
      );
    }

    // Create Supabase Auth user
    // IMPORTANT: email_confirm: true disables Supabase email confirmation
    // because OTP verification already confirms the email
    const supabase = getSupabaseClient();
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Disable confirmation email - OTP is the verification
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      phone: phone || null,
      email: email.toLowerCase(),
      status: 'pre_verified', // User is pre-verified via OTP
    });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      // Don't fail - user was created
    }

    // Assign default user role
    const { data: userRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();

    if (userRole) {
      await supabaseAdmin.from('user_roles').insert({
        user_id: authData.user.id,
        role_id: userRole.id,
      });
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('email_otps')
      .update({ status: 'used' })
      .eq('email', email.toLowerCase())
      .eq('purpose', 'registration');

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: 'Account created successfully.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}