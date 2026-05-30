'use client';

// ============================================
// Auth Alert Component
// ============================================

import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AuthAlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
};

export function AuthAlert({
  variant = 'error',
  title,
  message,
  onDismiss,
  className = '',
}: AuthAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`
        relative flex gap-3 p-4 rounded-lg border
        ${config.bg} ${config.border}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h4>
        )}
        <p className={`text-sm mt-1 ${title ? '' : 'text-gray-700 dark:text-gray-300'}`}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}