'use client';

// ============================================
// Profile Setup Page
// Basic profile information setup
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@sitesbd/ui/components/layout/auth-layout';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';
import { ArrowLeft } from 'lucide-react';

// Validation schema
const setupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          if (profile.full_name) {
            setValue('fullName', profile.full_name);
          }
          if (profile.phone) {
            setValue('phone', profile.phone);
          }
        }
      } catch {
        console.error('Error loading profile data');
      }
    };

    loadProfileData();
  }, [router, setValue]);

  const onSubmit = async (data: SetupFormData) => {
    if (!supabase) {
      setError('Supabase is not configured. Please set environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: data.fullName,
          phone: data.phone || null,
        });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Redirect to preferences
      router.push('/profile/preferences');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to onboarding
        </Link>

        <AuthHeader
          title="Profile Setup"
          subtitle="Update your basic profile information"
        />

        {error && (
          <AuthAlert
            variant="error"
            message={error}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              {...register('fullName')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
              placeholder="+880 1XXX XXXXXX"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <AuthButton
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Continue
          </AuthButton>
        </form>
      </div>
    </AuthLayout>
  );
}
