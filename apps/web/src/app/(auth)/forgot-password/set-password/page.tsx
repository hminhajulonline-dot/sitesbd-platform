'use client';

// ============================================
// Forgot Password: Set New Password Page
// ============================================
// User sets a new password after OTP verification

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { PasswordInput } from '@sitesbd/ui/components/auth/password-input';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

export default function ForgotPasswordSetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if OTP was verified
    const otpVerified = sessionStorage.getItem('reset_password_verified');
    const storedEmail = sessionStorage.getItem('reset_password_email');

    if (!otpVerified || !storedEmail) {
      // Not verified - redirect to step 1
      router.push('/forgot-password/verify-otp');
      return;
    }

    setEmail(storedEmail);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setIsLoading(true);

    try {
      // Update password using Supabase Auth
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // First, get the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userData) {
        setError('Account not found. Please try again.');
        setIsLoading(false);
        return;
      }

      // Use admin update for password (in production, use Edge Functions with service role)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      // Clear session storage
      sessionStorage.removeItem('reset_password_email');
      sessionStorage.removeItem('reset_password_verified');

      // Redirect to login with success message
      router.push('/login?password_reset=true');

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Set new password"
        subtitle="Create a strong password for your account"
      />

      {error && (
        <AuthAlert
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Display (read-only) */}
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
            readOnly
            disabled
            className="
              w-full px-4 py-3
              bg-gray-100 dark:bg-gray-700
              border border-gray-300 dark:border-gray-600 rounded-lg
              text-gray-500 dark:text-gray-400
              cursor-not-allowed
            "
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Verified email address
          </p>
        </div>

        {/* New Password Field */}
        <PasswordInput
          id="password"
          name="password"
          label="New password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />

        {/* Password Strength Indicator */}
        {password && (
          <PasswordStrengthIndicator password={password} />
        )}

        {/* Confirm Password Field */}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm new password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          value={confirmPassword}
          error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
        />

        {/* Submit Button */}
        <AuthButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Resetting password..."
          disabled={!password || !confirmPassword || password !== confirmPassword}
        >
          Reset password
        </AuthButton>
      </form>

      <AuthDivider />

      {/* Back to Login */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Remember your password?{' '}
        <a
          href="/login"
          className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

// Password Strength Indicator Component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { level: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { level: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Password strength: {strength.label}
      </p>
    </div>
  );
}