// ============================================
// SMTP Debug API Route
// ============================================
// GET /api/debug/smtp - Check SMTP configuration

import { NextResponse } from 'next/server';
import type { Transporter } from 'nodemailer';

interface SmtpDebugResult {
  timestamp: string;
  smtp: {
    host: { present: boolean; value: string | null };
    port: { present: boolean; value: string | null };
    user: { present: boolean; value: string | null };
    password: { present: boolean; value: string | null };
    from: { present: boolean; value: string | null };
    secure: boolean;
  };
  app: {
    url: { present: boolean; value: string | null };
  };
  configured: boolean;
  transportVerify?: {
    success: boolean;
    message: string;
    error?: string;
  };
}

export async function GET() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const result: SmtpDebugResult = {
    timestamp: new Date().toISOString(),
    smtp: {
      host: {
        present: !!smtpHost,
        value: smtpHost || null,
      },
      port: {
        present: !!smtpPort,
        value: smtpPort || null,
      },
      user: {
        present: !!smtpUser,
        value: smtpUser || null,
      },
      password: {
        present: !!smtpPassword,
        value: smtpPassword ? '***' + smtpPassword.slice(-4) : null,
      },
      from: {
        present: !!smtpFrom,
        value: smtpFrom || null,
      },
      secure: smtpPort === '465',
    },
    app: {
      url: {
        present: !!appUrl,
        value: appUrl || null,
      },
    },
    configured: !!(smtpHost && smtpUser && smtpPassword),
  };

  // Try to verify transport if configured
  if (result.configured) {
    try {
      console.log('[SMTP DEBUG] Creating transporter to verify connection...');
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587', 10),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        connectionTimeout: 10000,
      }) as Transporter;

      console.log('[SMTP DEBUG] Verifying transporter connection...');
      await transporter.verify();
      result.transportVerify = {
        success: true,
        message: 'Transport connection verified',
      };
      console.log('[SMTP DEBUG] Transport verify successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SMTP DEBUG] Transport verify failed:', errorMessage);
      result.transportVerify = {
        success: false,
        message: 'Transport connection failed',
        error: errorMessage,
      };
    }
  } else {
    result.transportVerify = {
      success: false,
      message: 'SMTP not configured',
    };
  }

  return NextResponse.json(result);
}