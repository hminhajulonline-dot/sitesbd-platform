'use client';

// ============================================
// Step 1: Email Registration Page
// ============================================
// User enters their email to receive OTP

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

export default function RegisterEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists first
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok && checkData.exists) {
        setError('This email is already registered. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // Generate OTP
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
          // Rate limited - set cooldown
          const cooldownEndTime = Date.now() + (data.retryAfter * 1000);
          setCooldownEnd(cooldownEndTime);
          setError(`Please wait ${data.retryAfter} seconds before requesting another code.`);
        } else {
          setError(data.error || 'Failed to send verification code');
        }
        setIsLoading(false);
        return;
      }

      // Store email in sessionStorage for next step
      sessionStorage.setItem('registration_email', email);

      // Redirect to verify OTP page
      router.push('/register/verify-otp');

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Cooldown timer
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check cooldown timer
  useState(() => {
    if (cooldownEnd) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
        setCooldownRemaining(remaining);
        if (remaining === 0) {
          setCooldownEnd(null);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  });

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Create your account"
        subtitle="Enter your email to get started"
      />

      {error && (
        <AuthAlert
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
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
            disabled={isLoading || cooldownRemaining > 0}
          />
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Sending code..."
          disabled={cooldownRemaining > 0}
        >
          {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Continue'}
        </AuthButton>
      </form>

      <AuthDivider />

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
        >
          Sign in
        </Link>
      </p>

      {/* Terms */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}