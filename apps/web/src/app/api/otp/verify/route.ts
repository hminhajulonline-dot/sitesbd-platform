// ============================================
// OTP Verify API Route
// ============================================
// POST /api/otp/verify - Verify OTP code

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  console.log('[OTP Verify] Starting verification');
  
  try {
    const body = await request.json();

    const { email, otpCode, purpose } = body;

    console.log('[OTP Verify] Input:', { email, purpose, otpCodeLength: otpCode?.length });

    if (!email || !isValidEmail(email)) {
      console.log('[OTP Verify] Invalid email');
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!otpCode || otpCode.length !== OTP_CONFIG.LENGTH) {
      console.log('[OTP Verify] Invalid OTP code');
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    if (!purpose || !isValidPurpose(purpose)) {
      console.log('[OTP Verify] Invalid purpose:', purpose);
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    console.log('[OTP Verify] Querying OTP for:', email.toLowerCase(), 'purpose:', purpose);

    // Find the OTP record
    const { data: otp, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .single();

    console.log('[OTP Verify] Query result:', { 
      found: !!otp, 
      error: error?.message,
      otpStatus: otp?.status,
      otpCodeMatch: otp?.otp_code === otpCode,
    });

    if (error || !otp) {
      console.log('[OTP Verify] OTP not found or error:', error?.message);
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
      console.log('[OTP Verify] OTP expired');
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
      console.log('[OTP Verify] Max attempts exceeded');
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
    if (otp.otp_code !== otpCode) {
      console.log('[OTP Verify] Invalid OTP code');
      // Increment attempt count
      await supabase
        .from('email_otps')
        .update({ attempt_count: otp.attempt_count + 1 })
        .eq('id', otp.id);

      const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - otp.attempt_count - 1;

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
    console.log('[OTP Verify] OTP valid, marking as verified');
    await supabase
      .from('email_otps')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', otp.id);

    console.log('[OTP Verify] Verification complete');
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      email,
      purpose,
    });

  } catch (error) {
    console.error('[OTP Verify] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}