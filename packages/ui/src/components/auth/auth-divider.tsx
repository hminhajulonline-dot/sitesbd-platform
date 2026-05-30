'use client';

// ============================================
// Auth Divider Component
// ============================================

interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      {text && (
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            {text}
          </span>
        </div>
      )}
    </div>
  );
}