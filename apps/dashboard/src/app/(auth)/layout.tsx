'use client';

// ============================================
// Auth Layout
// ============================================

import { AuthLayout } from '@sitesbd/ui';

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}