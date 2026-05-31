// ============================================
// Email OTP Service
// ============================================
// Handles OTP generation, verification, and rate limiting
// Uses Supabase for storage and SMTP for email delivery

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type OtpPurpose = 'registration' | 'forgot_password' | 'email_change' | 'admin_login';
export type OtpStatus = 'pending' | 'verified' | 'expired' | 'used';

export interface OtpRecord {
  id: string;
  email: string;
  otp_code: string;
  purpose: OtpPurpose;
  status: OtpStatus;
  expires_at: string;
  verified_at: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface OtpGenerationResult {
  success: boolean;
  otpId?: string;
  expiresAt?: string;
  error?: string;
}

export interface OtpVerificationResult {
  success: boolean;
  error?: 'invalid_otp' | 'expired' | 'max_attempts' | 'not_found' | 'rate_limited' | 'server_error';
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests?: number;
  retryAfter?: number;
  error?: string;
}

// ============================================
// Configuration
// ============================================

export const OTP_CONFIG = {
  // OTP length (6 digits)
  LENGTH: 6,
  
  // Expiration time in seconds (5 minutes)
  EXPIRATION_SECONDS: 5 * 60,
  
  // Maximum verification attempts
  MAX_ATTEMPTS: 5,
  
  // Rate limit window in seconds (60 seconds)
  RATE_LIMIT_WINDOW: 60,
  
  // Maximum OTP requests per window
  MAX_REQUESTS_PER_WINDOW: 3,
} as const;

// ============================================
// SMTP Configuration
// ============================================

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export const getSmtpConfig = (): SmtpConfig | null => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sitesbd.com';

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: port === '465',
    auth: { user, pass },
    from,
  };
};

// ============================================
// Supabase Client
// ============================================

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdmin;
}

// ============================================
// OTP Generation
// ============================================

/**
 * Generate a random 6-digit OTP
 */
export function generateOtpCode(): string {
  const min = Math.pow(10, OTP_CONFIG.LENGTH - 1);
  const max = Math.pow(10, OTP_CONFIG.LENGTH) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Check rate limiting before generating OTP
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  email: string,
  purpose: OtpPurpose
): Promise<RateLimitResult> {
  try {
    // Clean up expired rate limits first
    await supabase
      .from('otp_rate_limits')
      .delete()
      .lt('window_end', new Date().toISOString());

    // Check current rate limit status
    const { data: rateLimit, error } = await supabase
      .from('otp_rate_limits')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .gt('window_end', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      return { allowed: false, error: 'Failed to check rate limit' };
    }

    if (rateLimit) {
      const remaining = OTP_CONFIG.MAX_REQUESTS_PER_WINDOW - rateLimit.request_count;
      if (remaining <= 0) {
        const retryAfter = Math.ceil(
          (new Date(rateLimit.window_end).getTime() - Date.now()) / 1000
        );
        return {
          allowed: false,
          remainingRequests: 0,
          retryAfter,
          error: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
        };
      }
      return { allowed: true, remainingRequests: remaining };
    }

    return { allowed: true, remainingRequests: OTP_CONFIG.MAX_REQUESTS_PER_WINDOW };
  } catch {
    return { allowed: false, error: 'Server error checking rate limit' };
  }
}

/**
 * Increment rate limit counter
 */
export async function incrementRateLimit(
  supabase: SupabaseClient,
  email: string,
  purpose: OtpPurpose
): Promise<void> {
  try {
    const windowStart = new Date();
    const windowEnd = new Date(windowStart.getTime() + OTP_CONFIG.RATE_LIMIT_WINDOW * 1000);

    // Try to update existing record
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
      // Create new rate limit record
      await supabase.from('otp_rate_limits').insert({
        email: email.toLowerCase(),
        purpose,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        request_count: 1,
      });
    }
  } catch {
    // Silently fail - rate limit is best effort
  }
}

/**
 * Generate and store a new OTP
 */
export async function generateOtp(
  email: string,
  purpose: OtpPurpose
): Promise<OtpGenerationResult> {
  try {
    const supabase = getSupabaseAdmin();

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(supabase, email, purpose);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded',
      };
    }

    // Expire any existing pending OTPs for this email+purpose
    await supabase
      .from('email_otps')
      .update({ status: 'expired' })
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .eq('status', 'pending');

    // Generate new OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRATION_SECONDS * 1000);

    // Store OTP
    const { data, error } = await supabase
      .from('email_otps')
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        purpose,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        attempt_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: 'Failed to generate OTP' };
    }

    // Increment rate limit
    await incrementRateLimit(supabase, email, purpose);

    return {
      success: true,
      otpId: data.id,
      expiresAt: expiresAt.toISOString(),
    };
  } catch {
    return { success: false, error: 'Server error generating OTP' };
  }
}

// ============================================
// Email Sending
// ============================================

/**
 * Send OTP via email using SMTP
 */
export async function sendOtp(
  email: string,
  otpCode: string,
  purpose: OtpPurpose,
  additionalData?: { fullName?: string; resetLink?: string }
): Promise<{ success: boolean; error?: string }> {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    console.warn('SMTP not configured, OTP will be logged instead');
    console.log(`[OTP] Email: ${email}, Code: ${otpCode}, Purpose: ${purpose}`);
    return { success: true };
  }

  try {
    const purposeMessages: Record<OtpPurpose, { subject: string; body: string }> = {
      registration: {
        subject: 'Verify your SitesBD account',
        body: `
          <h1>Welcome to SitesBD!</h1>
          <p>Hi${additionalData?.fullName ? ` ${additionalData.fullName}` : ''},</p>
          <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otpCode}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      },
      forgot_password: {
        subject: 'Reset your SitesBD password',
        body: `
          <h1>Password Reset</h1>
          <p>You requested a password reset for your SitesBD account.</p>
          <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otpCode}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
        `,
      },
      email_change: {
        subject: 'Confirm your new email address',
        body: `
          <h1>Email Change Confirmation</h1>
          <p>You requested to change your email address to this one.</p>
          <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otpCode}</strong></p>
          <p>This code will expire in 5 minutes.</p>
        `,
      },
      admin_login: {
        subject: 'SitesBD Admin Login Verification',
        body: `
          <h1>Admin Login Verification</h1>
          <p>Your admin login verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otpCode}</strong></p>
          <p>This code will expire in 5 minutes.</p>
        `,
      },
    };

    const emailContent = purposeMessages[purpose];

    // Send email via fetch to our API route (for server-side SMTP)
    const response = await fetch('/api/otp/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: emailContent.subject,
        html: emailContent.body,
      }),
    });

    if (!response.ok) {
      const data = await response.json() as { error?: string };
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to send OTP email' };
  }
}

// ============================================
// OTP Verification
// ============================================

/**
 * Verify an OTP code
 */
export async function verifyOtp(
  email: string,
  otpCode: string,
  purpose: OtpPurpose
): Promise<OtpVerificationResult> {
  try {
    const supabase = getSupabaseAdmin();

    // Find the OTP record
    const { data: otp, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .single();

    if (error || !otp) {
      return {
        success: false,
        error: 'not_found',
        message: 'OTP not found or already used',
      };
    }

    // Check if expired
    if (new Date(otp.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('email_otps')
        .update({ status: 'expired' })
        .eq('id', otp.id);

      return {
        success: false,
        error: 'expired',
        message: 'OTP has expired. Please request a new one.',
      };
    }

    // Check attempt count
    if (otp.attempt_count >= OTP_CONFIG.MAX_ATTEMPTS) {
      await supabase
        .from('email_otps')
        .update({ status: 'expired' })
        .eq('id', otp.id);

      return {
        success: false,
        error: 'max_attempts',
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
      };
    }

    // Verify the code
    if (otp.otp_code !== otpCode) {
      // Increment attempt count
      await supabase
        .from('email_otps')
        .update({ attempt_count: otp.attempt_count + 1 })
        .eq('id', otp.id);

      return {
        success: false,
        error: 'invalid_otp',
        message: `Invalid OTP code. ${OTP_CONFIG.MAX_ATTEMPTS - otp.attempt_count - 1} attempts remaining.`,
      };
    }

    // Mark as verified
    await supabase
      .from('email_otps')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', otp.id);

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'server_error',
      message: 'Server error during verification',
    };
  }
}

// ============================================
// OTP Expiration
// ============================================

/**
 * Mark an OTP as expired
 */
export async function expireOtp(
  email: string,
  purpose: OtpPurpose
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('email_otps')
      .update({ status: 'expired' })
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: 'Failed to expire OTP' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Server error expiring OTP' };
  }
}

/**
 * Cleanup all expired OTPs
 */
export async function cleanupExpiredOtps(): Promise<{ cleaned: number }> {
  try {
    const supabase = getSupabaseAdmin();

    const { count } = await supabase.rpc('cleanup_expired_otps');
    return { cleaned: count || 0 };
  } catch {
    return { cleaned: 0 };
  }
}

// ============================================
// OTP Status
// ============================================

/**
 * Get OTP status
 */
export async function getOtpStatus(
  email: string,
  purpose: OtpPurpose
): Promise<{
  exists: boolean;
  status?: OtpStatus;
  expiresAt?: string;
  remainingAttempts?: number;
} | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: otp, error } = await supabase
      .from('email_otps')
      .select('status, expires_at, attempt_count')
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .single();

    if (error || !otp) {
      return { exists: false };
    }

    return {
      exists: true,
      status: otp.status as OtpStatus,
      expiresAt: otp.expires_at,
      remainingAttempts: OTP_CONFIG.MAX_ATTEMPTS - otp.attempt_count,
    };
  } catch {
    return null;
  }
}

// ============================================
// Combined OTP Flow
// ============================================

/**
 * Send OTP to email (generate + send)
 */
export async function sendOtpToEmail(
  email: string,
  purpose: OtpPurpose,
  additionalData?: { fullName?: string }
): Promise<OtpGenerationResult & { rateLimitInfo?: RateLimitResult }> {
  // Generate OTP
  const result = await generateOtp(email, purpose);

  if (!result.success) {
    return result;
  }

  // Get the OTP code (need to fetch it)
  const supabase = getSupabaseAdmin();
  const { data: otp } = await supabase
    .from('email_otps')
    .select('otp_code')
    .eq('id', result.otpId)
    .single();

  if (!otp) {
    return { success: false, error: 'OTP not found after generation' };
  }

  // Send email
  const emailResult = await sendOtp(email, otp.otp_code, purpose, additionalData);

  if (!emailResult.success) {
    // Expire the OTP since we couldn't send it
    await expireOtp(email, purpose);
    return { success: false, error: emailResult.error };
  }

  // Get rate limit info
  const rateLimitInfo = await checkRateLimit(supabase, email, purpose);

  return {
    ...result,
    rateLimitInfo,
  };
}

// ============================================
// Exports
// ============================================

export const EmailOtpService = {
  generateOtp,
  sendOtp,
  sendOtpToEmail,
  verifyOtp,
  expireOtp,
  checkRateLimit,
  cleanupExpiredOtps,
  getOtpStatus,
  generateOtpCode,
  OTP_CONFIG,
  getSmtpConfig,
};

export default EmailOtpService;