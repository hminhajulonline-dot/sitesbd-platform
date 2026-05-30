'use client';

// ============================================
// Auth Button Component
// ============================================

import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-[#2563eb] hover:bg-[#1d4ed8]
    text-white
    shadow-sm hover:shadow
    ring-[#2563eb]/50
  `,
  secondary: `
    bg-gray-100 hover:bg-gray-200
    dark:bg-gray-700 dark:hover:bg-gray-600
    text-gray-900 dark:text-gray-100
    ring-gray-500/20
  `,
  outline: `
    bg-transparent
    border-2 border-[#2563eb] hover:bg-[#2563eb]/10
    text-[#2563eb]
    ring-[#2563eb]/30
  `,
  ghost: `
    bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
    text-gray-700 dark:text-gray-300
    ring-gray-500/20
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  }
);

AuthButton.displayName = 'AuthButton';