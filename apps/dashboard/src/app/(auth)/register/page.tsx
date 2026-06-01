'use client';

// ============================================
// Register Page (Redirect to OTP Flow)
// ============================================
// This page redirects to the new multi-step OTP registration

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Redirect to new registration flow
      router.replace('/register/email');
    }
  }, [mounted, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
    </div>
  );
}