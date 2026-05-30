'use client';

// ============================================
// Forgot Password Page
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthHeader } from '@sitesbd/ui/auth-header';
import { AuthButton } from '@sitesbd/ui/auth-button';
import { AuthDivider } from '@sitesbd/ui/auth-divider';
import { AuthAlert } from '@sitesbd/ui/auth-alert';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <AuthHeader
          title="Check your email"
          subtitle="We've sent a password reset link to your email address"
        />

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-400">
            If an account exists with that email, we've sent instructions to reset your password.
            Please check your inbox and spam folder.
          </p>
        </div>

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

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset link"
      />

      {error && (
        <AuthAlert
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`
              w-full px-4 py-3
              bg-white dark:bg-gray-800
              border rounded-lg
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-[#2563eb] focus:ring-[#2563eb]/20'
              }
            `}
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Sending..."
        >
          Send reset link
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