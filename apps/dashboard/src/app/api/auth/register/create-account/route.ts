// ============================================
// OTP Registration API Routes
// ============================================
// Step 1: POST /api/auth/register/send-otp - Send OTP for registration
// Step 2: POST /api/auth/register/verify-otp - Verify OTP
// Step 3: POST /api/auth/register/create-account - Create account

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Logging helper for structured debugging
function logRegistrationFlow(stage: string, data: Record<string, unknown>) {
  console.log(`[Registration Flow - ${stage}]:`, JSON.stringify(data, null, 2));
}

// Validate environment variables on startup
function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  }

  // CRITICAL: Log key details for debugging
  console.log('[Registration Flow - ENV_VALIDATED]', {
    supabaseUrl: supabaseUrl ? '✓ set' : '✗ missing',
    serviceRoleKeyExists: !!serviceRoleKey,
    serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 20),
    anonKeyExists: !!anonKey,
    anonKeyPrefix: anonKey?.substring(0, 20),
    keysAreDifferent: serviceRoleKey !== anonKey,
    usingServiceRoleForAdmin: true,
  });
}

// Supabase admin client (uses service role key)
function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // CRITICAL: Log exactly which key is being used
  console.log('[Registration Flow - CLIENT_INIT]', {
    keyType: 'service-role',
    url: url,
    serviceRoleKeyExists: !!serviceRoleKey,
    serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 20) + '...',
    expectedKeyLength: serviceRoleKey?.length,
  });

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Log the actual apikey header being sent
  console.log('[Registration Flow - CLIENT_CREATED]', {
    hasAuth: !!client.auth,
    authType: typeof client.auth,
  });

  return client;
}

// ============================================
// POST /api/auth/register/create-account
// ============================================
// Create user account after OTP verification
// OTP IS the email verification - no confirmation email needed

export async function POST(request: NextRequest) {
  try {
    // Validate environment on every request
    validateEnvironment();

    const body = await request.json();

    const { email, password, fullName, phone, otpVerified } = body;

    logRegistrationFlow('INPUT_RECEIVED', {
      email,
      hasPassword: !!password,
      hasFullName: !!fullName,
      hasPhone: !!phone,
      otpVerified,
      passwordLength: password?.length || 0,
    });

    // Validate input
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logRegistrationFlow('VALIDATION_FAILED', { reason: 'invalid_email', email });
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      logRegistrationFlow('VALIDATION_FAILED', { reason: 'invalid_password', passwordLength: password?.length || 0 });
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if OTP was verified
    if (!otpVerified) {
      logRegistrationFlow('VALIDATION_FAILED', { reason: 'otp_not_verified_flag', otpVerified });
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      );
    }

    // Check OTP verification status in database
    const supabaseAdmin = getSupabaseAdmin();
    logRegistrationFlow('CHECKING_OTP_STATUS', { email: email.toLowerCase(), purpose: 'registration' });

    const { data: otp, error: otpError } = await supabaseAdmin
      .from('email_otps')
      .select('status, verified_at, expires_at, created_at')
      .eq('email', email.toLowerCase())
      .eq('purpose', 'registration')
      .single();

    logRegistrationFlow('OTP_QUERY_RESULT', {
      otpFound: !!otp,
      otpStatus: otp?.status,
      otpVerifiedAt: otp?.verified_at,
      otpExpiresAt: otp?.expires_at,
      otpError: otpError ? { message: otpError.message, code: otpError.code, details: otpError.details, hint: otpError.hint } : null,
    });

    if (otpError) {
      logRegistrationFlow('OTP_QUERY_ERROR', {
        message: otpError.message,
        code: otpError.code,
        details: otpError.details,
        hint: otpError.hint,
      });
      return NextResponse.json(
        {
          error: 'Database error checking OTP status',
          code: otpError.code,
          message: otpError.message,
        },
        { status: 500 }
      );
    }

    if (!otp) {
      logRegistrationFlow('OTP_NOT_FOUND', { email: email.toLowerCase(), purpose: 'registration' });
      return NextResponse.json(
        { error: 'Email OTP not found. Please request a new verification code.' },
        { status: 400 }
      );
    }

    if (otp.status !== 'verified') {
      logRegistrationFlow('OTP_NOT_VERIFIED', {
        currentStatus: otp.status,
        verifiedAt: otp.verified_at,
        expectedStatus: 'verified',
      });
      return NextResponse.json(
        {
          error: `Email OTP not verified. Current status: ${otp.status}`,
          otpStatus: otp.status,
          verifiedAt: otp.verified_at,
        },
        { status: 400 }
      );
    }

    // Create Supabase Auth user
    // IMPORTANT: email_confirm: true disables Supabase email confirmation
    // because OTP verification already confirms the email
    logRegistrationFlow('CREATING_AUTH_USER', {
      email,
      hasFullName: !!fullName,
      hasPhone: !!phone,
      email_confirm: true,
      usingServiceRole: true,
    });

    // Use admin client (service role key) for user creation
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Disable confirmation email - OTP is the verification
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      },
    });

    logRegistrationFlow('AUTH_USER_CREATE_RESULT', {
      success: !!authData?.user,
      userId: authData?.user?.id,
      userEmail: authData?.user?.email,
      signUpError: signUpError ? {
        message: signUpError.message,
        code: signUpError.code,
        name: signUpError.name,
      } : null,
    });

    if (signUpError) {
      logRegistrationFlow('SIGNUP_ERROR', {
        message: signUpError.message,
        code: signUpError.code,
        name: signUpError.name,
      });

      // Return detailed error instead of generic message
      return NextResponse.json(
        {
          error: signUpError.message,
          code: signUpError.code,
          details: 'Account creation failed',
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      logRegistrationFlow('NO_USER_DATA', { authData });
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create profile
    logRegistrationFlow('CREATING_PROFILE', {
      userId: authData.user.id,
      email: email.toLowerCase(),
      fullName,
      phone: phone || null,
    });

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      phone: phone || null,
      email: email.toLowerCase(),
      status: 'pre_verified', // User is pre-verified via OTP
    });

    logRegistrationFlow('PROFILE_CREATE_RESULT', {
      success: !profileError,
      profileError: profileError ? {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      } : null,
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

    logRegistrationFlow('REGISTRATION_COMPLETE', {
      userId: authData.user.id,
      email: authData.user.email,
    });

    // BUG FIX: Create session immediately after account creation
    // Sign in the user to get session tokens
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: sessionData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      logRegistrationFlow('SESSION_CREATION_FAILED', {
        message: signInError.message,
        code: signInError.code,
      });
      // Account created but session failed - return error
      return NextResponse.json(
        {
          success: true, // Account was created
          user: { id: authData.user.id, email: authData.user.email },
          message: 'Account created but automatic login failed. Please sign in.',
          requiresLogin: true,
        },
        { status: 201 }
      );
    }

    logRegistrationFlow('SESSION_CREATED', {
      userId: authData.user.id,
      hasAccessToken: !!sessionData.session?.access_token,
      hasRefreshToken: !!sessionData.session?.refresh_token,
    });

    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: 'Account created successfully. You are now logged in.',
    });

    // Set session cookies for middleware authentication
    // Use environment variable for cookie domain (cross-subdomain session)
    const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.sitesbd.com';
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      domain: cookieDomain,  // Cross-subdomain session sharing
      maxAge: 60 * 60 * 24 * 7, // 1 week
    };

    response.cookies.set('sb-access-token', sessionData.session!.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', sessionData.session!.refresh_token, {
      ...cookieOptions,
      httpOnly: false, // Refresh token needs to be accessible for token refresh
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}