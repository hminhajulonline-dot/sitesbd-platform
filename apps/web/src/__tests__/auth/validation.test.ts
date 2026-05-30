// ============================================
// Authentication Validation Tests
// ============================================

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Register validation schema
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

describe('Login Validation', () => {
  it('should validate correct email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      rememberMe: false,
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('email');
      expect(result.error.errors[0].message).toBe('Please enter a valid email address');
    }
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('password');
      expect(result.error.errors[0].message).toBe('Password is required');
    }
  });

  it('should accept rememberMe checkbox state', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      rememberMe: true,
    });

    expect(result.success).toBe(true);
  });
});

describe('Register Validation', () => {
  it('should validate correct registration data', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      phone: '+8801234567890',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(true);
  });

  it('should reject short name', () => {
    const result = registerSchema.safeParse({
      fullName: 'J',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'password123!',
      confirmPassword: 'password123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'PASSWORD123!',
      confirmPassword: 'PASSWORD123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'PasswordABC!',
      confirmPassword: 'PasswordABC!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'Pass1!',
      confirmPassword: 'Pass1!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject mismatched passwords', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.errors.find((e) => e.path.includes('confirmPassword'));
      expect(confirmError).toBeDefined();
      expect(confirmError?.message).toBe('Passwords do not match');
    }
  });

  it('should reject if terms not accepted', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: false,
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid phone number', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      phone: '+8801712345678',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid phone number', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'user@example.com',
      phone: '123',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('Forgot Password Validation', () => {
  it('should validate correct email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('Password Strength', () => {
  const getPasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    return score;
  };

  it('should return 0 for empty password', () => {
    expect(getPasswordStrength('')).toBe(0);
  });

  it('should return low score for weak password', () => {
    expect(getPasswordStrength('password')).toBeLessThanOrEqual(2);
  });

  it('should return high score for strong password', () => {
    expect(getPasswordStrength('Password123!')).toBeGreaterThanOrEqual(4);
  });

  it('should return max score for very strong password', () => {
    expect(getPasswordStrength('VeryStrongP@ssw0rd!')).toBe(6);
  });
});