'use client';

// ============================================
// Forgot Password: Verify OTP Page
// ============================================
// User enters their email and verifies OTP to reset password

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

export default function ForgotPasswordVerifyOtpPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose: 'forgot_password',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.retryAfter) {
          setError(`Please wait ${data.retryAfter} seconds before requesting another code.`);
        } else {
          setError(data.error || 'Failed to send verification code');
        }
        setIsLoading(false);
        return;
      }

      // Move to OTP verification step
      setStep('otp');
      sessionStorage.setItem('reset_password_email', email);
      
      // Start resend cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otpCode,
          purpose: 'forgot_password',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Invalid verification code');
        setIsLoading(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // OTP verified - redirect to set new password
      sessionStorage.setItem('reset_password_verified', 'true');
      router.push('/forgot-password/set-password');

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendCooldown(60);

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose: 'forgot_password',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.retryAfter) {
          setError(`Please wait ${data.retryAfter} seconds before requesting another code.`);
        } else {
          setError(data.error || 'Failed to send new code');
        }
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    }
  };

  // Step 1: Email Entry
  if (step === 'email') {
    return (
      <div className="space-y-6">
        <AuthHeader
          title="Reset your password"
          subtitle="Enter your email to receive a verification code"
        />

        {error && (
          <AuthAlert
            variant="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="
                w-full px-4 py-3
                bg-white dark:bg-gray-800
                border border-gray-300 dark:border-gray-600 rounded-lg
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                focus:border-[#2563eb] focus:ring-[#2563eb]/20
                hover:border-gray-400 dark:hover:border-gray-500
              "
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <AuthButton
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            loadingText="Sending code..."
          >
            Continue
          </AuthButton>
        </form>

        <AuthDivider />

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // Step 2: OTP Verification
  return (
    <div className="space-y-6">
      <AuthHeader
        title="Enter verification code"
        subtitle={`Enter the 6-digit code sent to ${email}`}
      />

      {error && (
        <AuthAlert
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="space-y-5">
        {/* OTP Input */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="
                w-10 h-12 sm:w-12 sm:h-14
                text-center text-xl font-semibold
                bg-white dark:bg-gray-800
                border border-gray-300 dark:border-gray-600 rounded-lg
                text-gray-900 dark:text-gray-100
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                focus:border-[#2563eb] focus:ring-[#2563eb]/20
              "
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Verify Button */}
        <AuthButton
          onClick={handleVerifyOtp}
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Verifying..."
          disabled={otp.join('').length !== 6}
        >
          Verify Code
        </AuthButton>
      </div>

      <AuthDivider />

      {/* Resend Code */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resend code in {resendCooldown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
            disabled={isLoading}
          >
            Resend verification code
          </button>
        )}
      </div>

      {/* Back to Email */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setOtp(['', '', '', '', '', '']);
          }}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}