// ============================================
// OTP Verify API Route
// ============================================
// POST /api/otp/verify - Verify OTP code

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Logging helper
function logOtpVerify(stage: string, data: Record<string, unknown>) {
  console.log(`[OTP Verify - ${stage}]:`, JSON.stringify(data, null, 2));
}

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  MAX_ATTEMPTS: 5,
};

// Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate purpose
function isValidPurpose(purpose: string): boolean {
  return ['registration', 'forgot_password', 'email_change', 'admin_login'].includes(purpose);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, otpCode, purpose } = body;

    logOtpVerify('INPUT_RECEIVED', {
      email,
      otpCodeLength: otpCode?.length || 0,
      purpose,
    });

    if (!email || !isValidEmail(email)) {
      logOtpVerify('VALIDATION_FAILED', { reason: 'invalid_email' });
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!otpCode || otpCode.length !== OTP_CONFIG.LENGTH) {
      logOtpVerify('VALIDATION_FAILED', { reason: 'invalid_otp_length', providedLength: otpCode?.length || 0 });
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    if (!purpose || !isValidPurpose(purpose)) {
      logOtpVerify('VALIDATION_FAILED', { reason: 'invalid_purpose', providedPurpose: purpose });
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find the OTP record
    logOtpVerify('FINDING_OTP', {
      email: email.toLowerCase(),
      purpose,
      statusFilter: 'pending',
    });

    const { data: otp, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .single();

    logOtpVerify('OTP_QUERY_RESULT', {
      otpFound: !!otp,
      otpStatus: otp?.status,
      otpAttemptCount: otp?.attempt_count,
      otpExpiresAt: otp?.expires_at,
      queryError: error ? { message: error.message, code: error.code } : null,
    });

    if (error || !otp) {
      logOtpVerify('OTP_NOT_FOUND_OR_ERROR', {
        errorMessage: error?.message,
        errorCode: error?.code,
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'not_found',
          message: 'OTP not found or already used. Please request a new one.',
        },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(otp.expires_at) < new Date()) {
      logOtpVerify('OTP_EXPIRED', { expiresAt: otp.expires_at });
      
      // Mark as expired
      await supabase
        .from('email_otps')
        .update({ status: 'expired' })
        .eq('id', otp.id);

      return NextResponse.json(
        { 
          success: false,
          error: 'expired',
          message: 'OTP has expired. Please request a new one.',
        },
        { status: 410 }
      );
    }

    // Check attempt count
    if (otp.attempt_count >= OTP_CONFIG.MAX_ATTEMPTS) {
      logOtpVerify('MAX_ATTEMPTS_EXCEEDED', { attemptCount: otp.attempt_count });
      
      await supabase
        .from('email_otps')
        .update({ status: 'expired' })
        .eq('id', otp.id);

      return NextResponse.json(
        { 
          success: false,
          error: 'max_attempts',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        },
        { status: 429 }
      );
    }

    // Verify the code
    const codeMatch = otp.otp_code === otpCode;
    logOtpVerify('VERIFYING_CODE', {
      codeMatch,
      providedCodeLength: otpCode.length,
      storedCodeLength: otp.otp_code.length,
    });

    if (!codeMatch) {
      const newAttemptCount = otp.attempt_count + 1;
      
      // Increment attempt count
      await supabase
        .from('email_otps')
        .update({ attempt_count: newAttemptCount })
        .eq('id', otp.id);

      const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - newAttemptCount;

      logOtpVerify('INVALID_OTP', {
        newAttemptCount,
        remainingAttempts,
      });

      return NextResponse.json(
        { 
          success: false,
          error: 'invalid_otp',
          message: `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Mark as verified
    logOtpVerify('MARKING_VERIFIED', { otpId: otp.id });

    await supabase
      .from('email_otps')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', otp.id);

    logOtpVerify('VERIFICATION_COMPLETE', {
      email: email.toLowerCase(),
      purpose,
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      email,
      purpose,
    });

  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    );
  }
}