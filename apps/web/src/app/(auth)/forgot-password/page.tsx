'use client';

// ============================================
// Forgot Password Page (OTP Flow)
// ============================================
// Redirects to OTP-based password reset

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately on mount
    router.replace('/forgot-password/verify-otp');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
    </div>
  );
}