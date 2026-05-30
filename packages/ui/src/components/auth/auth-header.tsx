'use client';

// ============================================
// Auth Header Component
// ============================================

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  logo?: React.ReactNode;
}

export function AuthHeader({
  title,
  subtitle,
  showBackButton = false,
  backHref = '/',
  logo,
}: AuthHeaderProps) {
  return (
    <div className="space-y-6">
      {showBackButton && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      )}

      <div className="flex flex-col items-center text-center">
        {logo && <div className="mb-4">{logo}</div>}

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-sm">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}