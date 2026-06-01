'use client';

// ============================================
// Onboarding Page
// Multi-step profile completion wizard
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ProfileWizard, type WizardFormData } from '@sitesbd/ui/components/onboarding/profile-wizard';
import { AuthLayout } from '@sitesbd/ui/components/layout/auth-layout';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

// Supabase client - only create if env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<WizardFormData>>({});

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

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Fetch preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile || preferences) {
          setInitialData({
            fullName: profile?.full_name || '',
            phone: profile?.phone || '',
            language: preferences?.language || 'en',
            theme: preferences?.theme || 'system',
            avatarUrl: profile?.avatar_url || null,
          });
        }
      } catch {
        console.error('Error loading profile data');
      }
    };

    loadProfileData();
  }, [router]);

  const handleComplete = async (data: WizardFormData) => {
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

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: data.fullName,
          phone: data.phone || null,
          avatar_url: data.avatarUrl,
          status: 'active',
        });

      if (profileError) {
        setError(profileError.message);
        setIsLoading(false);
        return;
      }

      // Update or create preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          language: data.language,
          theme: data.theme,
          timezone: data.timezone,
          notification_email: data.emailNotifications,
          notification_whatsapp: data.whatsappNotifications,
        });

      if (prefsError) {
        setError(prefsError.message);
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip avatar and go to review
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {error && (
          <AuthAlert
            variant="error"
            message={error}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

        <ProfileWizard
          initialData={initialData}
          onComplete={handleComplete}
          onSkip={handleSkip}
          isLoading={isLoading}
        />
      </div>
    </AuthLayout>
  );
}
