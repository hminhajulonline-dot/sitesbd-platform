'use client';

// ============================================
// Wizard Step Component
// Wrapper for each step in the onboarding wizard
// ============================================

import { cn } from '../../lib/utils';

interface WizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export function WizardStep({
  title,
  description,
  children,
  isActive = true,
  className = '',
}: WizardStepProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn('space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300', className)}
      role="region"
      aria-label={title}
    >
      {/* Step header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
