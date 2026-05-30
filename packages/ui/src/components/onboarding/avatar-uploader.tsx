'use client';

// ============================================
// Avatar Uploader Component
// Upload and preview profile avatar
// ============================================

import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Upload, X, User } from 'lucide-react';

interface AvatarUploaderProps {
  currentAvatar?: string | null;
  onAvatarChange: (file: File | null) => void;
  onSkip?: () => void;
  className?: string;
}

export function AvatarUploader({
  currentAvatar,
  onAvatarChange,
  onSkip,
  className = '',
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onAvatarChange(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Avatar preview */}
      <div className="flex justify-center">
        <div
          className={cn(
            'w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-dashed transition-all',
            isDragging
              ? 'border-[#2563eb] bg-[#2563eb]/5'
              : 'border-gray-300 dark:border-gray-600'
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-gray-400" />
          )}
        </div>
      </div>

      {/* Upload area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-[#2563eb] bg-[#2563eb]/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-[#2563eb] hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload avatar"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />
        
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="text-[#2563eb] font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          PNG, JPG or GIF (max. 2MB)
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
        
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
