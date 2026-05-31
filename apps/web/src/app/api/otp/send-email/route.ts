// ============================================
// OTP Email API Route
// ============================================
// Server-side email sending using nodemailer

import { NextRequest, NextResponse } from 'next/server';

// Nodemailer for SMTP sending (lazy loaded)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null;

async function getNodemailer() {
  if (!nodemailer) {
    nodemailer = await import('nodemailer');
  }
  return nodemailer;
}

// Create transporter from environment variables
async function createTransporter() {
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

  return nm.createTransport(smtpConfig);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate request body
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateRequest(body: any): { valid: boolean; error?: string } {
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
  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[OTP Email] SMTP not configured, simulating send:');
      console.log(`  To: ${body.to}`);
      console.log(`  Subject: ${body.subject}`);
      return NextResponse.json({
        success: true,
        message: 'Email simulated (SMTP not configured)',
        simulated: true,
      });
    }

    // Create transporter
    const transporter = await createTransporter();

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: body.to,
      subject: body.subject,
      html: body.html,
    });

    console.log('[OTP Email] Sent successfully:', {
      messageId: info.messageId,
      to: body.to,
      subject: body.subject,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[OTP Email] Failed to send:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}