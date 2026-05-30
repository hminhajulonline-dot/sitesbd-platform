'use client';

// ============================================
// Progress Indicator Component
// Shows step progress in the onboarding wizard
// ============================================

import { cn } from '../../lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number[];
  labels?: string[];
  className?: string;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  completedSteps = [],
  labels,
  className = '',
}: ProgressIndicatorProps) {
  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep && !isCompleted;

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  isCompleted && 'bg-[#2563eb] text-white',
                  isCurrent && 'bg-[#2563eb] text-white ring-4 ring-[#2563eb]/20',
                  isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step label */}
              {labels && labels[index] && (
                <span
                  className={cn(
                    'mt-2 text-xs text-center max-w-[80px]',
                    isCurrent && 'text-[#2563eb] font-medium',
                    isCompleted && 'text-gray-600 dark:text-gray-300',
                    isPending && 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {labels[index]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar (mobile) */}
      <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden md:hidden">
        <div
          className="h-full bg-[#2563eb] transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Connector lines */}
      <div className="hidden md:flex absolute top-5 left-0 right-0 px-16">
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 relative -mt-20">
          <div
            className="absolute left-0 top-0 h-full bg-[#2563eb] transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
