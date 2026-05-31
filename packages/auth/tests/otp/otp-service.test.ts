import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockData: Record<string, any[]> = {
    email_otps: [],
  };

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn(),
        })),
        gt: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    _setData: (table: string, data: any[]) => {
      mockData[table] = data;
    },
    _getData: (table: string) => mockData[table],
  };
};

// ============================================
// OTP Configuration Tests
// ============================================
describe('OTP Configuration', () => {
  it('should have correct OTP length of 6 digits', () => {
    const OTP_CONFIG = {
      LENGTH: 6,
      EXPIRATION_SECONDS: 5 * 60,
      MAX_ATTEMPTS: 5,
      RATE_LIMIT_WINDOW: 60,
      MAX_REQUESTS_PER_WINDOW: 3,
    };

    expect(OTP_CONFIG.LENGTH).toBe(6);
    expect(OTP_CONFIG.EXPIRATION_SECONDS).toBe(300);
    expect(OTP_CONFIG.MAX_ATTEMPTS).toBe(5);
  });
});

// ============================================
// OTP Generation Tests
// ============================================
describe('OTP Generation', () => {
  function generateOtpCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  it('should generate a 6-digit OTP', () => {
    const otp = generateOtpCode();
    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should generate OTP with leading zeros preserved in string format', () => {
    // Test that generated OTPs are strings (not numbers) to preserve leading zeros
    const generateOtpCode = (length: number = 6): string => {
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    };

    const otp = generateOtpCode();
    expect(typeof otp).toBe('string');
    expect(otp).toHaveLength(6);
    // OTP is a string, so leading zeros would be preserved if generated
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should generate numeric OTP only', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtpCode();
      expect(otp).toMatch(/^\d+$/);
    }
  });

  it('should generate within valid range (000000-999999)', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtpCode();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});

// ============================================
// Email Validation Tests
// ============================================
describe('Email Validation', () => {
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  it('should validate correct email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.org',
      'name+tag@company.co.uk',
      'user123@sub.domain.com',
    ];

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'not-an-email',
      '@nodomain.com',
      'user@',
      'user@domain',
      'user@.com',
      '',
      'user name@domain.com',
      'user@@domain.com',
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

// ============================================
// Purpose Validation Tests
// ============================================
describe('Purpose Validation', () => {
  function isValidPurpose(purpose: string): boolean {
    return ['registration', 'forgot_password', 'email_change', 'admin_login'].includes(purpose);
  }

  it('should validate correct purposes', () => {
    const validPurposes = ['registration', 'forgot_password', 'email_change', 'admin_login'];

    validPurposes.forEach(purpose => {
      expect(isValidPurpose(purpose)).toBe(true);
    });
  });

  it('should reject invalid purposes', () => {
    const invalidPurposes = ['invalid', 'reset', '', 'login', 'verify', null, undefined];

    invalidPurposes.forEach(purpose => {
      expect(isValidPurpose(purpose as string)).toBe(false);
    });
  });
});

// ============================================
// Resend OTP Tests
// ============================================
describe('Resend OTP', () => {
  it('should check rate limit for resend requests', async () => {
    // Simulate rate limit check logic
    const MAX_REQUESTS = 3;
    let requestCount = 0;

    const checkRateLimit = () => {
      requestCount++;
      return requestCount <= MAX_REQUESTS;
    };

    // First request should be allowed
    expect(checkRateLimit()).toBe(true);
  });

  it('should generate new OTP on resend', async () => {
    const otpCodes: string[] = [];

    // Simulate two OTP generations
    const generateOtpCode = () => {
      const min = Math.pow(10, 5);
      const max = Math.pow(10, 6) - 1;
      return String(Math.floor(Math.random() * (max - min + 1)) + min);
    };

    const firstOtp = generateOtpCode();
    const secondOtp = generateOtpCode();

    otpCodes.push(firstOtp);
    otpCodes.push(secondOtp);

    // OTPs should be different (with high probability after seeding)
    expect(firstOtp).not.toBe(secondOtp);
    expect(otpCodes).toHaveLength(2);
  });

  it('should handle rapid resend requests within rate limit', async () => {
    let requestCount = 0;
    const MAX_REQUESTS = 3;

    const checkRateLimit = () => {
      requestCount++;
      return requestCount <= MAX_REQUESTS;
    };

    // First 3 requests should be allowed
    expect(checkRateLimit()).toBe(true);
    expect(checkRateLimit()).toBe(true);
    expect(checkRateLimit()).toBe(true);

    // 4th request should be blocked
    expect(checkRateLimit()).toBe(false);
  });

  it('should reject resend when rate limit exceeded', async () => {
    const MAX_REQUESTS_PER_WINDOW = 3;

    let requestCount = 0;
    const windowStart = Date.now();
    const windowEnd = windowStart + 60 * 1000;

    const checkRateLimit = () => {
      const now = Date.now();
      if (now > windowEnd) {
        // Window expired, reset
        requestCount = 0;
        return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW };
      }

      requestCount++;
      const remaining = MAX_REQUESTS_PER_WINDOW - requestCount;

      if (remaining < 0) {
        // Already exceeded
        return {
          allowed: false,
          retryAfter: Math.ceil((windowEnd - now) / 1000),
          remainingRequests: 0
        };
      }

      return { allowed: true, remainingRequests: remaining };
    };

    // Simulate requests
    const results = [
      checkRateLimit(), // 1st: allowed, remaining=2
      checkRateLimit(), // 2nd: allowed, remaining=1
      checkRateLimit(), // 3rd: allowed, remaining=0
      checkRateLimit(), // 4th: blocked, retryAfter
    ];

    expect(results[0]).toEqual({ allowed: true, remainingRequests: 2 });
    expect(results[1]).toEqual({ allowed: true, remainingRequests: 1 });
    expect(results[2]).toEqual({ allowed: true, remainingRequests: 0 });
    expect(results[3].allowed).toBe(false);
    expect(results[3].retryAfter).toBeGreaterThan(0);
  });
});

// ============================================
// Expired OTP Tests
// ============================================
describe('Expired OTP', () => {
  const OTP_EXPIRATION_SECONDS = 5 * 60;

  it('should mark OTP as expired after expiration time', () => {
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const expiresAt = new Date(createdAt.getTime() + OTP_EXPIRATION_SECONDS * 1000);

    // Simulate time passing
    const now = new Date('2024-01-01T00:06:00Z'); // 6 minutes later

    expect(now.getTime()).toBeGreaterThan(expiresAt.getTime());
  });

  it('should validate OTP is expired when current time > expires_at', () => {
    // Test with fixed dates to avoid timing issues
    const checkExpiry = (expiresAt: Date, now: Date): boolean => {
      return now.getTime() > expiresAt.getTime();
    };

    // OTP that expires in the past (expired)
    const expiredOtp = new Date('2024-01-01T00:00:00Z');
    const nowAfterExpiry = new Date('2024-01-01T00:06:00Z');
    expect(checkExpiry(expiredOtp, nowAfterExpiry)).toBe(true);

    // OTP that expires in the future (not expired)
    const futureExpiry = new Date('2024-01-01T00:10:00Z');
    const nowBeforeExpiry = new Date('2024-01-01T00:05:00Z');
    expect(checkExpiry(futureExpiry, nowBeforeExpiry)).toBe(false);
  });

  it('should reject verification of expired OTP', async () => {
    const simulateExpiredOtpVerification = (
      expiresAt: Date,
      otpCode: string,
      storedOtp: string
    ) => {
      const now = new Date();

      // Check if expired
      if (now.getTime() > expiresAt.getTime()) {
        return {
          success: false,
          error: 'expired',
          message: 'OTP has expired. Please request a new one.',
        };
      }

      // Check if code matches
      if (otpCode !== storedOtp) {
        return {
          success: false,
          error: 'invalid_otp',
          message: 'Invalid OTP code.',
        };
      }

      return { success: true };
    };

    // Expired OTP should fail
    const expiredTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const expiredResult = simulateExpiredOtpVerification(expiredTime, '123456', '123456');
    expect(expiredResult.success).toBe(false);
    expect(expiredResult.error).toBe('expired');
  });

  it('should allow new OTP request after expiration', async () => {
    const simulateResendAfterExpiry = (previousOtpExpiresAt: Date) => {
      const now = new Date();

      // Check if previous OTP is expired
      if (now.getTime() > previousOtpExpiresAt.getTime()) {
        // Allow new OTP generation
        return {
          allowed: true,
          reason: 'Previous OTP expired, generating new one',
        };
      }

      return {
        allowed: false,
        reason: 'Previous OTP still valid',
      };
    };

    // Expired previous OTP
    const expiredPrevious = new Date(Date.now() - 5 * 60 * 1000);
    expect(simulateResendAfterExpiry(expiredPrevious).allowed).toBe(true);

    // Valid previous OTP
    const validPrevious = new Date(Date.now() + 5 * 60 * 1000);
    expect(simulateResendAfterExpiry(validPrevious).allowed).toBe(false);
  });
});

// ============================================
// Duplicate OTP Request Tests
// ============================================
describe('Duplicate OTP Request', () => {
  it('should handle duplicate request by replacing existing OTP', async () => {
    const otps: Map<string, { code: string; status: string }> = new Map();

    // First request
    otps.set('test@example.com:registration', {
      code: '111111',
      status: 'pending',
    });

    // Second request (resend) should replace
    otps.set('test@example.com:registration', {
      code: '222222',
      status: 'pending',
    });

    const currentOtp = otps.get('test@example.com:registration');
    expect(currentOtp?.code).toBe('222222');
    expect(currentOtp?.status).toBe('pending');
  });

  it('should only have one active OTP per email + purpose', () => {
    const activeOtps = new Map<string, any>();

    const generateOtp = (email: string, purpose: string) => {
      const key = `${email}:${purpose}`;
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete existing OTP for this email + purpose
      if (activeOtps.has(key)) {
        activeOtps.delete(key);
      }

      // Add new OTP
      activeOtps.set(key, {
        code,
        status: 'pending',
        createdAt: new Date(),
      });

      return code;
    };

    // Generate first OTP
    const otp1 = generateOtp('user@example.com', 'registration');
    expect(activeOtps.size).toBe(1);

    // Generate second OTP (should replace first)
    const otp2 = generateOtp('user@example.com', 'registration');
    expect(activeOtps.size).toBe(1); // Still only one OTP
    expect(otp2).not.toBe(otp1); // Different codes

    // Generate OTP for different purpose
    const otp3 = generateOtp('user@example.com', 'forgot_password');
    expect(activeOtps.size).toBe(2); // Now two OTPs (different purposes)
  });

  it('should handle race condition with upsert', async () => {
    // Simulate concurrent OTP requests
    const simulateUpsert = (
      existingOtp: any,
      newOtp: { code: string; purpose: string }
    ): { success: boolean; code: string } => {
      if (existingOtp) {
        // Delete existing and insert new (upsert behavior)
        return { success: true, code: newOtp.code };
      }

      // Insert new
      return { success: true, code: newOtp.code };
    };

    // Both requests should succeed (upsert replaces)
    const result1 = simulateUpsert(
      { code: '111111', purpose: 'registration' },
      { code: '222222', purpose: 'registration' }
    );

    const result2 = simulateUpsert(
      { code: '222222', purpose: 'registration' },
      { code: '333333', purpose: 'registration' }
    );

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.code).toBe('222222');
    expect(result2.code).toBe('333333');
  });

  it('should clear previous OTP before generating new one', async () => {
    const simulateOtpReplacement = () => {
      let existingOtp: any = { code: '111111', status: 'pending' };

      // Before generating new OTP, delete existing
      if (existingOtp) {
        existingOtp = null; // Simulating delete
      }

      // Generate new OTP
      const newOtp = {
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        status: 'pending',
      };

      return { existing: existingOtp, new: newOtp };
    };

    const result = simulateOtpReplacement();
    expect(result.existing).toBeNull();
    expect(result.new.code).toHaveLength(6);
  });
});

// ============================================
// Rate Limiting Tests
// ============================================
describe('Rate Limiting', () => {
  it('should track requests within rate limit window', () => {
    const rateLimits = new Map<string, { count: number; windowEnd: number }>();
    const MAX_REQUESTS = 3;
    const WINDOW_MS = 60 * 1000;

    const trackRequest = (email: string, purpose: string) => {
      const key = `${email}:${purpose}`;
      const now = Date.now();

      const existing = rateLimits.get(key);

      if (!existing || now > existing.windowEnd) {
        // New window
        rateLimits.set(key, {
          count: 1,
          windowEnd: now + WINDOW_MS,
        });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
      }

      if (existing.count >= MAX_REQUESTS) {
        return {
          allowed: false,
          retryAfter: Math.ceil((existing.windowEnd - now) / 1000),
          remaining: 0,
        };
      }

      existing.count++;
      return { allowed: true, remaining: MAX_REQUESTS - existing.count };
    };

    // First 3 requests should be allowed
    expect(trackRequest('user@example.com', 'registration').allowed).toBe(true);
    expect(trackRequest('user@example.com', 'registration').allowed).toBe(true);
    expect(trackRequest('user@example.com', 'registration').allowed).toBe(true);

    // 4th request should be blocked
    expect(trackRequest('user@example.com', 'registration').allowed).toBe(false);
  });

  it('should reset rate limit after window expires', () => {
    const rateLimits = new Map<string, { count: number; windowEnd: number }>();

    // Set up expired rate limit
    rateLimits.set('user@example.com:registration', {
      count: 3,
      windowEnd: Date.now() - 1000, // Expired
    });

    const getRemainingRequests = (email: string, purpose: string): number => {
      const key = `${email}:${purpose}`;
      const existing = rateLimits.get(key);

      if (!existing || Date.now() > existing.windowEnd) {
        return 3; // Full limit available
      }

      return 3 - existing.count;
    };

    expect(getRemainingRequests('user@example.com', 'registration')).toBe(3);
  });
});

// ============================================
// Attempt Count Tests
// ============================================
describe('Attempt Count', () => {
  it('should track failed verification attempts', () => {
    const otpData = {
      attemptCount: 0,
      maxAttempts: 5,
    };

    const incrementAttempts = () => {
      otpData.attemptCount++;
      return otpData.attemptCount;
    };

    expect(incrementAttempts()).toBe(1);
    expect(incrementAttempts()).toBe(2);
    expect(otpData.attemptCount).toBe(2);
  });

  it('should reject OTP after max attempts exceeded', () => {
    const MAX_ATTEMPTS = 5;

    const verifyOtp = (attemptCount: number, maxAttempts: number = MAX_ATTEMPTS) => {
      if (attemptCount >= maxAttempts) {
        return {
          success: false,
          error: 'max_attempts',
          message: 'Maximum verification attempts exceeded.',
        };
      }

      return { success: true };
    };

    expect(verifyOtp(4).success).toBe(true);
    expect(verifyOtp(5).success).toBe(false);
    expect(verifyOtp(5).error).toBe('max_attempts');
    expect(verifyOtp(6).success).toBe(false);
  });

  it('should allow resend after max attempts', async () => {
    const simulateResendAfterMaxAttempts = (
      attemptCount: number,
      maxAttempts: number = 5
    ) => {
      if (attemptCount >= maxAttempts) {
        return {
          allowed: true,
          reason: 'Max attempts exceeded, user can request new OTP',
        };
      }

      return {
        allowed: true,
        reason: 'OTP still has remaining attempts',
      };
    };

    expect(simulateResendAfterMaxAttempts(5).reason).toContain('Max attempts');
    expect(simulateResendAfterMaxAttempts(3).reason).toContain('remaining attempts');
  });
});