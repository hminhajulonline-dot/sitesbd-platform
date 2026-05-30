'use client';

// ============================================
// Register Page
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthHeader } from '@sitesbd/ui/auth-header';
import { PasswordInput } from '@sitesbd/ui/password-input';
import { AuthButton } from '@sitesbd/ui/auth-button';
import { AuthDivider } from '@sitesbd/ui/auth-divider';
import { AuthAlert } from '@sitesbd/ui/auth-alert';

// Password strength validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Validation schema
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number')
      .optional()
      .or(z.literal('')),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = watch('password', '');

  // Password strength calculator
  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { level: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { level: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || undefined,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Create profile if user was created
      if (authData.user) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: data.fullName,
          phone: data.phone || null,
          email: data.email,
        });

        // Assign default user role
        const { data: userRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'user')
          .single();

        if (userRole) {
          await supabase.from('user_roles').insert({
            user_id: authData.user.id,
            role_id: userRole.id,
          });
        }
      }

      // Redirect to verification
      router.push('/verify-email');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AuthHeader
        title="Create account"
        subtitle="Get started with SitesBD today"
      />

      {error && (
        <AuthAlert
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            className={`
              w-full px-4 py-3
              bg-white dark:bg-gray-800
              border rounded-lg
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${errors.fullName
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-[#2563eb] focus:ring-[#2563eb]/20'
              }
            `}
            placeholder="John Doe"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-red-500" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address <span className="text-red-500">*</span>
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

        {/* Phone Field */}
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone number
          </label>
          <input
            type="tel"
            id="phone"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={`
              w-full px-4 py-3
              bg-white dark:bg-gray-800
              border rounded-lg
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${errors.phone
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-[#2563eb] focus:ring-[#2563eb]/20'
              }
            `}
            placeholder="+8801234567890"
            {...register('phone')}
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm text-red-500" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            autoComplete="new-password"
            {...register('password')}
          />
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2 space-y-1">
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
              {strength.label && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Password strength: {strength.label}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        {/* Terms Checkbox */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('acceptTerms')}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]/20"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <Link href="/terms" className="text-[#2563eb] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#2563eb] hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-red-500" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText="Creating account..."
        >
          Create account
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
    </div>
  );
}