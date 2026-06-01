// ============================================
// OTP Generate API Route
// ============================================
// POST /api/otp/generate - Generate and send OTP

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from './email-service';

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRATION_SECONDS: 5 * 60,
  MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 60,
  MAX_REQUESTS_PER_WINDOW: 3,
};

// Generate random 6-digit OTP
function generateOtpCode(): string {
  const min = Math.pow(10, OTP_CONFIG.LENGTH - 1);
  const max = Math.pow(10, OTP_CONFIG.LENGTH) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

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

// Check rate limit
async function checkRateLimit(supabase: SupabaseClient, email: string, purpose: string) {
  // Clean up expired rate limits
  await supabase
    .from('otp_rate_limits')
    .delete()
    .lt('window_end', new Date().toISOString());

  const { data: rateLimit } = await supabase
    .from('otp_rate_limits')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('purpose', purpose)
    .gt('window_end', new Date().toISOString())
    .single();

  if (rateLimit) {
    const remaining = OTP_CONFIG.MAX_REQUESTS_PER_WINDOW - rateLimit.request_count;
    if (remaining <= 0) {
      const retryAfter = Math.ceil(
        (new Date(rateLimit.window_end).getTime() - Date.now()) / 1000
      );
      return { allowed: false, retryAfter, remainingRequests: 0 };
    }
    return { allowed: true, remainingRequests: remaining };
  }

  return { allowed: true, remainingRequests: OTP_CONFIG.MAX_REQUESTS_PER_WINDOW };
}

// Increment rate limit
async function incrementRateLimit(supabase: SupabaseClient, email: string, purpose: string) {
  const windowStart = new Date();
  const windowEnd = new Date(windowStart.getTime() + OTP_CONFIG.RATE_LIMIT_WINDOW * 1000);

  const { data: existing } = await supabase
    .from('otp_rate_limits')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('purpose', purpose)
    .gt('window_end', new Date().toISOString())
    .single();

  if (existing) {
    await supabase
      .from('otp_rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase.from('otp_rate_limits').insert({
      email: email.toLowerCase(),
      purpose,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      request_count: 1,
    });
  }
}

// Send OTP email using direct nodemailer (not API route)
async function sendOtpEmail(email: string, otpCode: string, purpose: string): Promise<{ success: boolean; error?: string }> {
  const subjects: Record<string, string> = {
    registration: 'Verify your SitesBD account',
    forgot_password: 'Reset your SitesBD password',
    email_change: 'Confirm your new email address',
    admin_login: 'SitesBD Admin Login Verification',
  };

  console.log('[OTP] Starting email send process');
  console.log('[OTP] SMTP Config Check:', {
    SMTP_HOST: process.env.SMTP_HOST ? '***' : 'MISSING',
    SMTP_USER: process.env.SMTP_USER ? '***' : 'MISSING',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
  });

  const html = `<h1>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otpCode}</strong></h1><p>This code will expire in 5 minutes.</p>`;

  // Send email directly using nodemailer from @sitesbd/auth package
  const result = await sendEmail(email, subjects[purpose] || 'Verification Code', html);

  if (result.success) {
    console.log('[OTP] Email send success');
    return { success: true };
  } else {
    console.log('[OTP] Email send failure:', result.error);
    return { success: false, error: result.error || 'Failed to send email' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, purpose } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!purpose || !isValidPurpose(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check rate limit
    const rateLimitResult = await checkRateLimit(supabase, email, purpose);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
          remainingRequests: rateLimitResult.remainingRequests,
        },
        { status: 429 }
      );
    }

    // Expire any existing pending OTPs (delete is more reliable than update for unique constraint)
    await supabase
      .from('email_otps')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .in('status', ['pending', 'expired']);

    // Generate new OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRATION_SECONDS * 1000);

    // Store OTP using upsert to avoid race conditions with unique constraint
    const { error } = await supabase
      .from('email_otps')
      .upsert(
        {
          email: email.toLowerCase(),
          otp_code: otpCode,
          purpose,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          attempt_count: 0,
        },
        {
          onConflict: 'email,purpose',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Failed to store OTP:', error);
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      );
    }

    // Increment rate limit
    await incrementRateLimit(supabase, email, purpose);

    // Send email
    console.log('[OTP] Attempting to send OTP email...');
    const emailResult = await sendOtpEmail(email, otpCode, purpose);
    
    if (!emailResult.success) {
      console.error('[OTP] Email send failed:', emailResult.error);
      // Return success but include email error for debugging
      // We still return success because OTP was generated and stored
      return NextResponse.json({
        success: true,
        expiresAt: expiresAt.toISOString(),
        remainingRequests: rateLimitResult.remainingRequests,
        emailWarning: emailResult.error || 'Failed to send verification email',
      });
    }

    console.log('[OTP] OTP generated and email sent successfully');

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      remainingRequests: rateLimitResult.remainingRequests,
    });

  } catch (error) {
    console.error('OTP generate error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}