'use client';

// ============================================
// Step 3: Set Password Page
// ============================================
// User sets their password after OTP verification

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { PasswordInput } from '@sitesbd/ui/components/auth/password-input';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

export default function SetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if OTP was verified
    const otpVerified = sessionStorage.getItem('otp_verified');
    const storedEmail = sessionStorage.getItem('registration_email');
    const storedName = sessionStorage.getItem('registration_name');

    if (!otpVerified || !storedEmail) {
      // Not verified - redirect to step 1
      router.push('/register/email');
      return;
    }

    setEmail(storedEmail);
    setFullName(storedName || '');
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
      const response = await fetch('/api/auth/register/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName || undefined,
          otpVerified: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Sign in the user immediately after account creation
      const signInResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!signInResponse.ok) {
        // Account created but sign in failed - redirect to login
        sessionStorage.removeItem('registration_email');
        sessionStorage.removeItem('registration_name');
        sessionStorage.removeItem('otp_verified');
        router.push('/login?registered=true');
        return;
      }

      // Clear session storage
      sessionStorage.removeItem('registration_email');
      sessionStorage.removeItem('registration_name');
      sessionStorage.removeItem('otp_verified');

      // Redirect to setup/profile completion
      router.push('/setup');

    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Create your password"
        subtitle="Set a strong password for your account"
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

        {/* Full Name (optional) */}
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full name (optional)
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="John Doe"
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
          />
        </div>

        {/* Password Field */}
        <PasswordInput
          id="password"
          name="password"
          label="Password"
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
          label="Confirm password"
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
          loadingText="Creating account..."
          disabled={!password || !confirmPassword || password !== confirmPassword}
        >
          Create account
        </AuthButton>
      </form>

      <AuthDivider />

      {/* Security Note */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Your password is encrypted and stored securely. We never store plain-text passwords.
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