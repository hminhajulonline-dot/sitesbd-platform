# OTP Authentication Flow

This document describes the OTP-based authentication flow for SitesBD Platform, replacing Supabase email confirmation links with a secure OTP verification system.

## Overview

The platform uses one-time passwords (OTPs) for:
- User registration verification
- Forgot password reset
- Email change confirmation
- Admin login verification

## OTP Configuration

| Setting | Value |
|---------|-------|
| OTP Length | 6 digits |
| Expiration | 5 minutes |
| Max Attempts | 5 per OTP |
| Rate Limit | 3 requests per 60 seconds |

## Database Schema

### email_otps Table

```sql
CREATE TABLE email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose otp_purpose NOT NULL DEFAULT 'registration',
  status otp_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  verified_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_otps_email_purpose_unique UNIQUE (email, purpose)
);
```

### otp_rate_limits Table

```sql
CREATE TABLE otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  purpose otp_purpose NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 seconds'),
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT otp_rate_limits_email_purpose_unique UNIQUE (email, purpose)
);
```

### Enums

```sql
CREATE TYPE otp_purpose AS ENUM (
  'registration',
  'forgot_password',
  'email_change',
  'admin_login'
);

CREATE TYPE otp_status AS ENUM (
  'pending',
  'verified',
  'expired',
  'used'
);
```

## Registration Flow

### Step 1: Enter Email
```
User visits /register/email
↓
Fills email field
↓
Clicks "Continue"
↓
System checks rate limits
↓
System expires any existing pending OTPs
↓
System generates 6-digit OTP
↓
System stores OTP in database
↓
System sends OTP via email
↓
Redirect to /register/verify-otp
```

### Step 2: Verify OTP
```
User visits /register/verify-otp
↓
System retrieves email from sessionStorage
↓
User enters 6-digit OTP
↓
System validates:
  - OTP exists in database
  - OTP is not expired
  - Attempt count < 5
  - OTP code matches
↓
If valid:
  - Mark OTP as "verified"
  - Set verified_at timestamp
  - Store in sessionStorage: otp_verified=true
  - Redirect to /register/set-password
↓
If invalid:
  - Increment attempt count
  - Show error with remaining attempts
  - Allow retry (max 5 attempts)
```

### Step 3: Set Password
```
User visits /register/set-password
↓
System checks sessionStorage:
  - otp_verified === 'true'
  - registration_email exists
↓
If not verified: redirect to /register/email
↓
User fills:
  - Full name (optional)
  - Password
  - Confirm password
↓
System validates password strength:
  - Min 8 characters
  - At least 1 uppercase
  - At least 1 lowercase
  - At least 1 number
  - At least 1 special character
  - Passwords match
↓
System creates user:
  - Supabase Auth signUp
  - Create profile with status='pre_verified'
  - Assign default 'user' role
  - Mark OTP as "used"
↓
Redirect to /login?registered=true
```

## Forgot Password Flow

### Step 1: Enter Email
```
User visits /forgot-password/verify-otp
↓
Fills email field
↓
Clicks "Continue"
↓
System generates and sends OTP
↓
Redirect to OTP input
```

### Step 2: Verify OTP
```
User enters OTP
↓
System validates (same rules as registration)
↓
If valid: redirect to /forgot-password/set-password
```

### Step 3: Set New Password
```
User visits /forgot-password/set-password
↓
System verifies OTP was used
↓
User sets new password
↓
System updates user password
↓
Mark OTP as "used"
↓
Redirect to /login?password_reset=true
```

## API Endpoints

### POST /api/otp/generate

Generate and send OTP.

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "registration"
}
```

**Response (200):**
```json
{
  "success": true,
  "expiresAt": "2024-01-01T00:05:00.000Z",
  "remainingRequests": 2
}
```

**Response (429 - Rate Limited):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45,
  "remainingRequests": 0
}
```

### POST /api/otp/verify

Verify OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "purpose": "registration"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "user@example.com",
  "purpose": "registration"
}
```

**Response (400 - Invalid OTP):**
```json
{
  "success": false,
  "error": "invalid_otp",
  "message": "Invalid OTP code. 4 attempts remaining.",
  "remainingAttempts": 4
}
```

**Response (410 - Expired):**
```json
{
  "success": false,
  "error": "expired",
  "message": "OTP has expired. Please request a new one."
}
```

### POST /api/auth/register/create-account

Create account after OTP verification.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "otpVerified": true
}
```

### POST /api/auth/reset-password

Reset password after OTP verification.

**Request:**
```json
{
  "email": "user@example.com",
  "newPassword": "NewSecurePassword123!"
}
```

### POST /api/otp/send-email

Send email via SMTP (internal API).

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Verify your SitesBD account",
  "html": "<h1>Your OTP: 123456</h1>"
}
```

## Email Templates

### Registration OTP
```
Subject: Verify your SitesBD account

Hi {fullName},

Your verification code is: 123456

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.
```

### Forgot Password OTP
```
Subject: Reset your SitesBD password

You requested a password reset for your SitesBD account.

Your verification code is: 123456

This code will expire in 5 minutes.

If you didn't request this reset, please ignore this email and your password will remain unchanged.
```

### Email Change OTP
```
Subject: Confirm your new email address

You requested to change your email address to this one.

Your verification code is: 123456

This code will expire in 5 minutes.
```

### Admin Login OTP
```
Subject: SitesBD Admin Login Verification

Your admin login verification code is: 123456

This code will expire in 5 minutes.
```

## Security Rules

### OTP Generation Rules
1. One active OTP per email + purpose combination
2. New OTP automatically expires previous pending OTP
3. Maximum 3 OTP requests per 60 seconds per email
4. Rate limit tracked in `otp_rate_limits` table

### OTP Verification Rules
1. OTP expires after 5 minutes
2. Maximum 5 failed verification attempts
3. After max attempts, OTP is marked as expired
4. Verified OTP can only be used once for account creation

### Session Storage
- `registration_email` - Stores email during registration
- `otp_verified` - Boolean flag for verified OTP
- `registration_name` - Stores full name (optional)
- `reset_password_email` - Stores email during password reset
- `reset_password_verified` - Boolean flag for verified OTP

### Data Cleanup
- Expired OTPs are marked with status='expired'
- Used OTPs are marked with status='used'
- Old rate limits are cleaned up on check
- Automatic cleanup function available: `cleanup_expired_otps()`

## Rate Limiting

### Configuration
```typescript
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRATION_SECONDS: 5 * 60,  // 5 minutes
  MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 60,        // 60 seconds
  MAX_REQUESTS_PER_WINDOW: 3,   // 3 requests per 60 seconds
};
```

### Rate Limit Flow
```
1. Check existing rate limit for email+purpose
2. If window has expired: allow request, create new record
3. If window active and count >= MAX_REQUESTS_PER_WINDOW: reject
4. If window active and count < MAX_REQUESTS_PER_WINDOW: allow, increment count
5. Return remaining requests count
```

## SMTP Configuration

### Environment Variables
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

### Fallback
If SMTP is not configured, OTP codes are logged to console for development:
```
[OTP] Email: user@example.com, Code: 123456, Purpose: registration
```

## Testing

### OTP Generation Test
```typescript
// Generate OTP
const result = await fetch('/api/otp/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    purpose: 'registration'
  })
});

// Verify success
expect(result.status).toBe(200);
const data = await result.json();
expect(data.success).toBe(true);
```

### OTP Expiry Test
```typescript
// Wait for OTP to expire (5 minutes)
// Try to verify expired OTP
const result = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    otpCode: '123456',
    purpose: 'registration'
  })
});

expect(result.status).toBe(410);
const data = await result.json();
expect(data.error).toBe('expired');
```

### Max Attempts Test
```typescript
// Try to verify wrong OTP 6 times
for (let i = 0; i < 6; i++) {
  await fetch('/api/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      otpCode: '000000', // Wrong code
      purpose: 'registration'
    })
  });
}

// Next attempt should fail due to max attempts
const result = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    otpCode: '123456', // Correct code
    purpose: 'registration'
  })
});

expect(result.status).toBe(429);
const data = await result.json();
expect(data.error).toBe('max_attempts');
```

### Rate Limiting Test
```typescript
// Request OTP 4 times in quick succession
for (let i = 0; i < 4; i++) {
  await fetch('/api/otp/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      purpose: 'registration'
    })
  });
}

// 4th request should be rate limited
const result = await fetch('/api/otp/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    purpose: 'registration'
  })
});

expect(result.status).toBe(429);
```

## UI Pages

| Page | URL | Description |
|------|-----|-------------|
| Email Entry | `/register/email` | Step 1: Enter email for registration |
| Verify OTP | `/register/verify-otp` | Step 2: Enter OTP code |
| Set Password | `/register/set-password` | Step 3: Set password after verification |
| Forgot Password | `/forgot-password/verify-otp` | Step 1-2: Enter email + verify OTP |
| Set New Password | `/forgot-password/set-password` | Step 3: Set new password |

## Related Documentation

- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)