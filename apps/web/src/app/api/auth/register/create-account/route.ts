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

// ============================================
// POST /api/auth/register/create-account
// ============================================
// Create user account after OTP verification
// OTP IS the email verification - no confirmation email needed

export async function POST(request: NextRequest) {
  console.log('[Create Account] Starting account creation');
  
  try {
    const body = await request.json();

    const { email, password, fullName, phone, otpVerified } = body;

    console.log('[Create Account] Input received:', {
      email,
      hasPassword: !!password,
      fullName,
      phone,
      otpVerified,
    });

    // Validate input
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('[Create Account] Invalid email');
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      console.log('[Create Account] Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if OTP was verified
    if (!otpVerified) {
      console.log('[Create Account] OTP not verified flag');
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      );
    }

    // Check OTP verification status
    const supabaseAdmin = getSupabaseAdmin();
    console.log('[Create Account] Checking OTP verification status for:', email.toLowerCase());
    
    const { data: otp, error: otpError } = await supabaseAdmin
      .from('email_otps')
      .select('status, verified_at, expires_at')
      .eq('email', email.toLowerCase())
      .eq('purpose', 'registration')
      .single();

    console.log('[Create Account] OTP query result:', {
      otpFound: !!otp,
      otpStatus: otp?.status,
      otpVerifiedAt: otp?.verified_at,
      otpExpiresAt: otp?.expires_at,
      otpError: otpError?.message,
    });

    if (!otp || otp.status !== 'verified') {
      console.log('[Create Account] OTP not verified in database');
      return NextResponse.json(
        { error: 'Email OTP not verified. Please verify your email first.' },
        { status: 400 }
      );
    }

    // Create Supabase Auth user using admin API directly
    // Note: Regular supabase-js client doesn't have admin.createUser
    // We need to use the Supabase Admin API endpoint
    console.log('[Create Account] Creating user via admin API');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phone || null,
        },
      }),
    });

    const authData = await adminResponse.json();
    console.log('[Create Account] Admin API full response:', {
      status: adminResponse.status,
      ok: adminResponse.ok,
      data: authData,
    });

    if (!adminResponse.ok) {
      // Extract all error details from Supabase response
      const errorDetails = {
        message: authData?.message || authData?.msg || 'Unknown error',
        code: authData?.code,
        status: adminResponse.status,
        fullResponse: authData,
      };
      console.error('[Create Account] Supabase error:', errorDetails);
      
      // Return the exact error from Supabase, not a generic message
      const errorMsg = errorDetails.message;
      console.log('[Create Account] Returning error:', errorMsg);
      return NextResponse.json(
        { 
          error: errorMsg,
          code: errorDetails.code,
          details: 'See server logs for full error',
        },
        { status: adminResponse.status }
      );
    }

    if (!authData.id) {
      console.log('[Create Account] No user ID returned');
      return NextResponse.json(
        { error: 'Failed to create user - no ID returned' },
        { status: 500 }
      );
    }

    console.log('[Create Account] User created successfully:', authData.id);

    // Create profile
    console.log('[Create Account] Creating profile');
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.id,
      full_name: fullName,
      phone: phone || null,
      email: email.toLowerCase(),
      status: 'pre_verified', // User is pre-verified via OTP
    });

    if (profileError) {
      console.error('[Create Account] Profile creation error:', profileError);
      // Don't fail - user was created
    }

    // Assign default user role
    console.log('[Create Account] Assigning user role');
    const { data: userRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();

    if (userRole) {
      await supabaseAdmin.from('user_roles').insert({
        user_id: authData.id,
        role_id: userRole.id,
      });
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('email_otps')
      .update({ status: 'used' })
      .eq('email', email.toLowerCase())
      .eq('purpose', 'registration');

    console.log('[Create Account] Account creation complete');
    return NextResponse.json({
      success: true,
      user: {
        id: authData.id,
        email: authData.email,
      },
      message: 'Account created successfully.',
    });

  } catch (error) {
    console.error('[Create Account] Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}