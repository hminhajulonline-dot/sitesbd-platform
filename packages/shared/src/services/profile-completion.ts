// ============================================
// Profile Completion Service
// Handles profile completion tracking and calculation
// ============================================

import type { Profile, UserPreferences } from '@sitesbd/database/types';

// Profile completion fields
export interface ProfileCompletionFields {
  fullName: boolean;
  phone: boolean;
  country: boolean;
  timezone: boolean;
  language: boolean;
}

// Profile completion result
export interface ProfileCompletionResult {
  isComplete: boolean;
  completionPercentage: number;
  completedFields: ProfileCompletionFields;
  missingFields: (keyof ProfileCompletionFields)[];
  totalFields: number;
  completedCount: number;
}

// Onboarding step status
export interface OnboardingStepStatus {
  step: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  fields: string[];
}

// Profile data for completion check
export interface ProfileCompletionData {
  profile: Profile | null;
  preferences: UserPreferences | null;
}

// Field weights for completion calculation
const FIELD_WEIGHTS: Record<keyof ProfileCompletionFields, number> = {
  fullName: 20,
  phone: 15,
  country: 20,
  timezone: 20,
  language: 25,
};

// Total weight (should sum to 100)
const TOTAL_WEIGHT = Object.values(FIELD_WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * Check if a field is completed (non-empty)
 */
function isFieldCompleted(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

/**
 * Calculate profile completion based on profile and preferences data
 */
export function calculateProfileCompletion(data: ProfileCompletionData): ProfileCompletionResult {
  const { profile, preferences } = data;

  // Check each field
  const completedFields: ProfileCompletionFields = {
    fullName: isFieldCompleted(profile?.full_name),
    phone: isFieldCompleted(profile?.phone),
    country: isFieldCompleted(preferences?.timezone), // Country derived from timezone
    timezone: isFieldCompleted(preferences?.timezone),
    language: isFieldCompleted(preferences?.language),
  };

  // Calculate percentage
  let totalWeight = 0;
  for (const [field, completed] of Object.entries(completedFields)) {
    if (completed) {
      totalWeight += FIELD_WEIGHTS[field as keyof ProfileCompletionFields];
    }
  }

  const completionPercentage = Math.round((totalWeight / TOTAL_WEIGHT) * 100);

  // Find missing fields
  const missingFields = (Object.keys(completedFields) as (keyof ProfileCompletionFields)[])
    .filter(field => !completedFields[field]);

  // Count completed
  const completedCount = Object.values(completedFields).filter(Boolean).length;

  return {
    isComplete: missingFields.length === 0,
    completionPercentage,
    completedFields,
    missingFields,
    totalFields: Object.keys(completedFields).length,
    completedCount,
  };
}

/**
 * Get onboarding step status based on completion
 */
export function getOnboardingSteps(completion: ProfileCompletionResult): OnboardingStepStatus[] {
  const steps: OnboardingStepStatus[] = [
    {
      step: 1,
      title: 'Basic Information',
      description: 'Enter your name and phone number',
      isCompleted: completion.completedFields.fullName && completion.completedFields.phone,
      isCurrent: !completion.completedFields.fullName || !completion.completedFields.phone,
      fields: ['fullName', 'phone'],
    },
    {
      step: 2,
      title: 'Location',
      description: 'Select your country and timezone',
      isCompleted: completion.completedFields.country && completion.completedFields.timezone,
      isCurrent: completion.completedFields.fullName && 
                 completion.completedFields.phone && 
                 (!completion.completedFields.country || !completion.completedFields.timezone),
      fields: ['country', 'timezone'],
    },
    {
      step: 3,
      title: 'Preferences',
      description: 'Set your language and notification preferences',
      isCompleted: completion.completedFields.language,
      isCurrent: completion.completedFields.fullName && 
                 completion.completedFields.phone && 
                 completion.completedFields.country && 
                 completion.completedFields.timezone && 
                 !completion.completedFields.language,
      fields: ['language'],
    },
    {
      step: 4,
      title: 'Avatar',
      description: 'Upload a profile picture (optional)',
      isCompleted: false, // Avatar is optional
      isCurrent: false,
      fields: ['avatar'],
    },
    {
      step: 5,
      title: 'Review',
      description: 'Review and confirm your information',
      isCompleted: false,
      isCurrent: false,
      fields: [],
    },
  ];

  return steps;
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding(profile: Profile | null, preferences: UserPreferences | null): boolean {
  if (!profile) return true;
  
  const completion = calculateProfileCompletion({ profile, preferences });
  return !completion.isComplete;
}

/**
 * Get the first incomplete step
 */
export function getFirstIncompleteStep(completion: ProfileCompletionResult): number {
  if (!completion.completedFields.fullName || !completion.completedFields.phone) {
    return 1;
  }
  if (!completion.completedFields.country || !completion.completedFields.timezone) {
    return 2;
  }
  if (!completion.completedFields.language) {
    return 3;
  }
  return 4; // Avatar step (optional)
}

// Export field weights for reference
export { FIELD_WEIGHTS, TOTAL_WEIGHT };
