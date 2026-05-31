// ============================================
// Reset Password API Route
// ============================================
// POST /api/auth/reset-password - Reset user password

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Logging helper
function logPasswordReset(stage: string, data: Record<string, unknown>) {
  console.log(`[Password Reset - ${stage}]:`, JSON.stringify(data, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, newPassword } = body;

    logPasswordReset('INPUT_RECEIVED', {
      email,
      hasNewPassword: !!newPassword,
      passwordLength: newPassword?.length || 0,
    });

    // Validate input
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logPasswordReset('VALIDATION_FAILED', { reason: 'invalid_email' });
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      logPasswordReset('VALIDATION_FAILED', { reason: 'weak_password' });
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check OTP verification status
    logPasswordReset('CHECKING_OTP_STATUS', { email: email.toLowerCase(), purpose: 'forgot_password' });

    const { data: otp, error: otpError } = await supabaseAdmin
      .from('email_otps')
      .select('status, verified_at, expires_at')
      .eq('email', email.toLowerCase())
      .eq('purpose', 'forgot_password')
      .single();

    logPasswordReset('OTP_QUERY_RESULT', {
      otpFound: !!otp,
      otpStatus: otp?.status,
      otpVerifiedAt: otp?.verified_at,
      otpError: otpError ? { message: otpError.message, code: otpError.code } : null,
    });

    if (otpError) {
      logPasswordReset('OTP_ERROR', { message: otpError.message, code: otpError.code });
      return NextResponse.json(
        {
          error: 'Database error checking OTP status',
          code: otpError.code,
        },
        { status: 500 }
      );
    }

    if (!otp) {
      logPasswordReset('OTP_NOT_FOUND', { email: email.toLowerCase() });
      return NextResponse.json(
        { error: 'OTP not found. Please request a new verification code.' },
        { status: 400 }
      );
    }

    if (otp.status !== 'verified') {
      logPasswordReset('OTP_NOT_VERIFIED', { currentStatus: otp.status });
      return NextResponse.json(
        {
          error: `Email OTP not verified. Current status: ${otp.status}`,
          otpStatus: otp.status,
        },
        { status: 400 }
      );
    }

    // Find user by email
    logPasswordReset('FINDING_USER', { email: email.toLowerCase() });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError) {
      logPasswordReset('PROFILE_ERROR', { message: profileError.message, code: profileError.code });
      return NextResponse.json(
        {
          error: 'Error finding user account',
          code: profileError.code,
        },
        { status: 500 }
      );
    }

    if (!profile) {
      logPasswordReset('USER_NOT_FOUND', { email: email.toLowerCase() });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user password using Supabase Admin API
    logPasswordReset('UPDATING_PASSWORD', { userId: profile.id });

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      {
        password: newPassword,
        email_confirm: true, // Ensure email is confirmed
      }
    );

    logPasswordReset('PASSWORD_UPDATE_RESULT', {
      success: !!updateData?.user,
      userId: updateData?.user?.id,
      updateError: updateError ? {
        message: updateError.message,
        code: updateError.code,
        name: updateError.name,
      } : null,
    });

    if (updateError) {
      logPasswordReset('UPDATE_ERROR', {
        message: updateError.message,
        code: updateError.code,
        name: updateError.name,
      });
      return NextResponse.json(
        {
          error: updateError.message,
          code: updateError.code,
          details: 'Password update failed',
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('email_otps')
      .update({ status: 'used' })
      .eq('email', email.toLowerCase())
      .eq('purpose', 'forgot_password');

    logPasswordReset('PASSWORD_RESET_COMPLETE', { userId: profile.id });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}