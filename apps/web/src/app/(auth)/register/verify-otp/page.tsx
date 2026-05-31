'use client';

// ============================================
// Step 2: Verify OTP Page
// ============================================
// User enters the 6-digit OTP code sent to their email

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem('registration_email');
    if (!storedEmail) {
      // No email - redirect to step 1
      router.push('/register/email');
      return;
    }
    setEmail(storedEmail);

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

    return () => clearInterval(interval);
  }, [router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus last input
      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    // Single digit
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-advance to next input
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

  const handleVerify = async () => {
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
          purpose: 'registration',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Invalid verification code');
        setIsLoading(false);
        
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // OTP verified successfully
      sessionStorage.setItem('otp_verified', 'true');
      sessionStorage.setItem('registration_email', email);

      // Redirect to set password page
      router.push('/register/set-password');

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
          purpose: 'registration',
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

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Verify your email"
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
          onClick={handleVerify}
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
        <Link
          href="/register/email"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Use a different email
        </Link>
      </div>
    </div>
  );
}