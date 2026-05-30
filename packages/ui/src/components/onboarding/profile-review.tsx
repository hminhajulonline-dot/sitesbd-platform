'use client';

// ============================================
// Profile Review Component
// Shows entered information for review before submission
// ============================================

import { cn } from '../../lib/utils';
import { Check, Edit2 } from 'lucide-react';

interface ProfileReviewData {
  fullName?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string | null;
}

interface ProfileReviewProps {
  data: ProfileReviewData;
  onEdit?: (step: number) => void;
  className?: string;
}

interface ReviewItemProps {
  label: string;
  value: string | undefined;
  onEdit?: () => void;
}

function ReviewItem({ label, value, onEdit }: ReviewItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1">
        <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </dd>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-[#2563eb] transition-colors"
          aria-label={`Edit ${label}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ProfileReview({ data, onEdit, className = '' }: ProfileReviewProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Review Your Information
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Please review your information before completing setup
        </p>
      </div>

      {/* Profile summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        {/* Avatar */}
        {data.avatarUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={data.avatarUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
        )}

        <dl className="space-y-0">
          <ReviewItem
            label="Full Name"
            value={data.fullName}
            onEdit={onEdit ? () => onEdit(1) : undefined}
          />
          <ReviewItem
            label="Phone Number"
            value={data.phone}
            onEdit={onEdit ? () => onEdit(1) : undefined}
          />
          <ReviewItem
            label="Country"
            value={data.country}
            onEdit={onEdit ? () => onEdit(2) : undefined}
          />
          <ReviewItem
            label="Timezone"
            value={data.timezone}
            onEdit={onEdit ? () => onEdit(2) : undefined}
          />
          <ReviewItem
            label="Language"
            value={data.language}
            onEdit={onEdit ? () => onEdit(3) : undefined}
          />
        </dl>
      </div>

      {/* Terms notice */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        By clicking "Complete Setup", you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
