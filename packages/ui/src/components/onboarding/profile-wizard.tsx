'use client';

// ============================================
// Profile Wizard Component
// Multi-step onboarding wizard
// ============================================

import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ProgressIndicator } from './progress-indicator';
import { WizardStep } from './wizard-step';
import { AuthButton } from '../auth/auth-button';
 
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export interface WizardFormData {
  // Step 1: Basic Information
  fullName: string;
  phone: string;
  
  // Step 2: Location
  country: string;
  timezone: string;
  
  // Step 3: Preferences
  language: string;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  theme: string;
  
  // Step 4: Avatar
  avatar: File | null;
  avatarUrl: string | null;
}

interface ProfileWizardProps {
  initialData?: Partial<WizardFormData>;
  onComplete: (data: WizardFormData) => Promise<void>;
  onSkip?: () => void;
  isLoading?: boolean;
  className?: string;
}

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Basic Info', 'Location', 'Preferences', 'Avatar', 'Review'];

const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
];

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ProfileWizard({
  initialData,
  onComplete,
  onSkip,
  isLoading = false,
  className = '',
}: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<WizardFormData>({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    country: initialData?.country || '',
    timezone: initialData?.timezone || '',
    language: initialData?.language || 'en',
    emailNotifications: initialData?.emailNotifications ?? true,
    whatsappNotifications: initialData?.whatsappNotifications ?? true,
    theme: initialData?.theme || 'system',
    avatar: initialData?.avatar || null,
    avatarUrl: initialData?.avatarUrl || null,
  });

  const updateFormData = (field: keyof WizardFormData, value: WizardFormData[keyof WizardFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    await onComplete(formData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0;
      case 2:
        return formData.country && formData.timezone;
      case 3:
        return formData.language;
      case 4:
        return true; // Avatar is optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className={cn('w-full max-w-lg mx-auto', className)}>
      {/* Progress indicator */}
      <div className="mb-8 relative">
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          completedSteps={completedSteps}
          labels={STEP_LABELS}
        />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <WizardStep
            title="Basic Information"
            description="Let's start with your basic information"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
                  placeholder="+880 1XXX XXXXXX"
                />
              </div>
            </div>
          </WizardStep>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <WizardStep
            title="Location"
            description="Where are you located?"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
                  required
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => updateFormData('timezone', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
                  required
                >
                  <option value="">Select your timezone</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="Australia/Sydney">Australia/Sydney (UTC+10)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
            </div>
          </WizardStep>
        )}

        {/* Step 3: Preferences */}
        {currentStep === 3 && (
          <WizardStep
            title="Preferences"
            description="Customize your experience"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language <span className="text-red-500">*</span>
                </label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => updateFormData('language', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
                  required
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme Preference
                </label>
                <select
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => updateFormData('theme', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-colors"
                >
                  {THEMES.map((theme) => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notification Preferences
                </p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => updateFormData('emailNotifications', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]/20"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Email Notifications
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.whatsappNotifications}
                    onChange={(e) => updateFormData('whatsappNotifications', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]/20"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    WhatsApp Notifications
                  </span>
                </label>
              </div>
            </div>
          </WizardStep>
        )}

        {/* Step 4: Avatar */}
        {currentStep === 4 && (
          <WizardStep
            title="Profile Picture"
            description="Add a photo to your profile (optional)"
          >
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-600 mb-4"
              >
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-400">
                    {formData.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Avatar upload is optional. You can skip this step.
              </p>
              
              <div className="flex gap-3">
                <label className="px-4 py-2 bg-[#2563eb] text-white rounded-lg cursor-pointer hover:bg-[#1d4ed8] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          updateFormData('avatarUrl', ev.target?.result as string);
                          updateFormData('avatar', file);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  Upload Photo
                </label>
                
                {onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="px-4 py-2 text-gray-500 hover:text-gray-600 transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          </WizardStep>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <WizardStep
            title="Review & Complete"
            description="Please review your information"
          >
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Full Name</span>
                <span className="text-sm font-medium">{formData.fullName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium">{formData.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Country</span>
                <span className="text-sm font-medium">
                  {COUNTRIES.find(c => c.code === formData.country)?.name || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Timezone</span>
                <span className="text-sm font-medium">{formData.timezone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Language</span>
                <span className="text-sm font-medium">
                  {LANGUAGES.find(l => l.code === formData.language)?.name || 'Not provided'}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              By completing setup, you agree to our Terms of Service and Privacy Policy.
            </p>
          </WizardStep>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors',
            currentStep === 1 && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < TOTAL_STEPS ? (
          <AuthButton
            onClick={handleNext}
            disabled={!canProceed()}
            isLoading={isLoading}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </AuthButton>
        ) : (
          <AuthButton
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Completing..."
          >
            Complete Setup
            <Check className="w-4 h-4 ml-2" />
          </AuthButton>
        )}
      </div>
    </div>
  );
}
