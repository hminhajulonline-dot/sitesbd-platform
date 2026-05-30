'use client';

// ============================================
// Login Page
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { PasswordInput } from '@sitesbd/ui/components/auth/password-input';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Supabase client - only create if env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!supabase) {
      setError('Supabase is not configured. Please set environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Check if email is verified
      if (authData.user && !authData.user.email_confirmed_at) {
        router.push('/verify-email');
        return;
      }

      // Get user role from profiles table to determine redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      // Redirect based on role
      if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'system_owner') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to your account to continue"
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

        {/* Password Field */}
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          registration={register('password')}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]/20"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Signing in..."
        >
          Sign in
        </AuthButton>
      </form>

      <AuthDivider />

      {/* Register Link */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}