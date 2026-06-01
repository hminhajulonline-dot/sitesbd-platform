'use client';

// ============================================
// Verify Email Page
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { AuthHeader } from '@sitesbd/ui/components/auth/auth-header';
import { AuthButton } from '@sitesbd/ui/components/auth/auth-button';
import { AuthDivider } from '@sitesbd/ui/components/auth/auth-divider';
import { AuthAlert } from '@sitesbd/ui/components/auth/auth-alert';

// Supabase client - only create if env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get current user email on mount
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        
        // Check if already verified
        if (user.email_confirmed_at) {
          setIsVerified(true);
        }
      }
    };

    getUser();
  }, []);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0 || !supabase) return;

    setIsResending(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        setError(resendError.message);
        setIsResending(false);
        return;
      }

      setIsResending(false);
      setResendCooldown(60); // 60 second cooldown
    } catch {
      setError('Failed to resend verification email. Please try again.');
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email_confirmed_at) {
      setIsVerified(true);
      
      // Check role and redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'system_owner') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  // Verified state
  if (isVerified) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <AuthHeader
          title="Email verified!"
          subtitle="Your account has been successfully activated"
        />

        <AuthButton
          fullWidth
          size="lg"
          onClick={() => router.push('/dashboard')}
        >
          Go to Dashboard
        </AuthButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Mail className="w-8 h-8 text-[#2563eb]" />
        </div>
      </div>

      <AuthHeader
        title="Verify your email"
        subtitle={
          email
            ? `We've sent a verification link to ${email}`
            : 'Please check your email for a verification link'
        }
      />

      {error && (
        <AuthAlert
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Click the link in your email to verify your account. If you don't see the email, check your spam folder.
        </p>
      </div>

      <div className="space-y-3">
        <AuthButton
          fullWidth
          variant="outline"
          onClick={handleCheckVerification}
        >
          I've verified my email
        </AuthButton>

        <AuthButton
          fullWidth
          variant="ghost"
          isLoading={isResending}
          disabled={resendCooldown > 0}
          onClick={handleResendVerification}
        >
          {resendCooldown > 0 ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Resend in {resendCooldown}s
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Resend verification email
            </span>
          )}
        </AuthButton>
      </div>

      <AuthDivider />

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already verified?{' '}
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