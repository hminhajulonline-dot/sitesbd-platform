// ============================================
// OTP Email API Route
// ============================================
// Server-side email sending using nodemailer

import { NextRequest, NextResponse } from 'next/server';

// Nodemailer for SMTP sending (lazy loaded)
import type { Transporter } from 'nodemailer';
let nodemailerModule: typeof import('nodemailer') | null = null;

async function getNodemailer() {
  if (!nodemailerModule) {
    nodemailerModule = await import('nodemailer');
  }
  return nodemailerModule;
}

// Create transporter from environment variables
async function createTransporter(): Promise<Transporter> {
  console.log('[SMTP] Creating transporter');
  console.log('[SMTP] Environment check:', {
    SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT || 'MISSING (default 587)',
    SMTP_USER: process.env.SMTP_USER || 'MISSING',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
  });
  
  const nm = await getNodemailer();
  
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  console.log('[SMTP] Creating transport with config:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user,
  });

  return nm.createTransport(smtpConfig) as Transporter;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate request body
interface RequestBody {
  to?: string;
  subject?: string;
  html?: string;
}

function validateRequest(body: RequestBody | null): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  if (!body.to || !isValidEmail(body.to)) {
    return { valid: false, error: 'Invalid email address' };
  }

  if (!body.subject || typeof body.subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }

  if (!body.html || typeof body.html !== 'string') {
    return { valid: false, error: 'HTML content is required' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  console.log('[SMTP] === START SMTP Request ===');
  
  try {
    const body = await request.json();
    console.log('[SMTP] Request body received');

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      console.log('[SMTP] Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('[SMTP] Validation passed');
    console.log('[SMTP] To:', body.to);
    console.log('[SMTP] Subject:', body.subject);

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[SMTP] SMTP not configured, simulating send:');
      console.log(`  To: ${body.to}`);
      console.log(`  Subject: ${body.subject}`);
      return NextResponse.json({
        success: true,
        message: 'Email simulated (SMTP not configured)',
        simulated: true,
      });
    }

    console.log('[SMTP] SMTP IS configured, creating transporter...');
    
    // Create transporter
    const transporter = await createTransporter();
    console.log('[SMTP] Transporter created, sending email...');

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: body.to,
      subject: body.subject,
      html: body.html,
    });

    const messageId = typeof info === 'object' && info !== null && 'messageId' in info 
      ? String((info as { messageId: unknown }).messageId) 
      : 'unknown';

    console.log('[SMTP] Email sent successfully:', {
      messageId,
      to: body.to,
      subject: body.subject,
    });
    console.log('[SMTP] === END SMTP Request (SUCCESS) ===');

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[SMTP] === SMTP Request FAILED ===');
    console.error('[SMTP] Error message:', errorMessage);
    console.error('[SMTP] Error stack:', errorStack);
    console.error('[SMTP] === END SMTP Request (FAILED) ===');
    
    return NextResponse.json(
      { error: `SMTP Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}