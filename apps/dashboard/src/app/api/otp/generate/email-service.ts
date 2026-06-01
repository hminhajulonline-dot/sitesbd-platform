// ============================================
// Email Service
// ============================================
// Direct SMTP email sending using nodemailer

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

function getSmtpConfig(): SmtpConfig | null {
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
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const smtpConfig = getSmtpConfig();

  console.log('[Email] Starting email send');
  console.log('[Email] SMTP Config Check:', {
    SMTP_HOST: process.env.SMTP_HOST ? '***' : 'MISSING',
    SMTP_USER: process.env.SMTP_USER ? '***' : 'MISSING',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
  });

  if (!smtpConfig) {
    console.log('[Email] SMTP not configured, simulating send:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    return {
      success: true,
      messageId: 'simulated',
    };
  }

  console.log('[Email] SMTP configured, creating transporter...');
  console.log('[Email] SMTP Config:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user,
  });

  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      connectionTimeout: 10000,
    });

    console.log('[Email] Verifying transporter connection...');
    await transporter.verify();
    console.log('[Email] Transporter verified, sending email...');

    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to,
      subject,
      html,
    });

    console.log('[Email] Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Email] Failed to send email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
