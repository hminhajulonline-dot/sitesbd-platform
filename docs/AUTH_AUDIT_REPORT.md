# Authentication System Audit Report

**Date:** 2026-05-31  
**Status:** IN PROGRESS  
**Scope:** Complete Authentication Flow Audit

---

## Executive Summary

This audit traces every step of the authentication system end-to-end. Multiple bugs were identified including missing logout functionality, incorrect middleware protection, and potential session handling issues.

### Bugs Identified (Summary)

| # | Bug | Severity | Flow |
|---|-----|----------|------|
| 1 | Logout route missing | HIGH | Logout |
| 2 | Middleware profile check incomplete | MEDIUM | All Protected |
| 3 | No admin subdomain protection | HIGH | Admin |
| 4 | Registration flow missing session creation | HIGH | Registration |
| 5 | Cooldown timer not working in email page | MEDIUM | Registration |

---

## Flow Diagrams

### Registration Flow (OTP-Based)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Email Entry                                                         │
│ Route: /register/email (apps/web/src/app/(auth)/register/email/page.tsx)   │
│ API: POST /api/otp/generate (apps/web/src/app/api/otp/generate/route.ts)    │
│                                                                             │
│ [User enters email]                                                         │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/auth/check-email] ──→ exists=true ──→ ERROR: "Email registered" │
│        │                                                                    │
│        ▼ (new email)                                                        │
│ [Call /api/otp/generate] ──→ OTP stored, email sent                        │
│        │                                                                    │
│        ▼                                                                    │
│ [sessionStorage.setItem('registration_email', email)]                       │
│        │                                                                    │
│        ▼                                                                    │
│ [Redirect to /register/verify-otp]                                         │
│                                                                             │
│ ✅ FLOW COMPLETE                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: OTP Verification                                                    │
│ Route: /register/verify-otp (apps/web/src/app/(auth)/register/verify-otp/) │
│ API: POST /api/otp/verify (apps/web/src/app/api/otp/verify/route.ts)       │
│                                                                             │
│ [Read email from sessionStorage]                                           │
│        │                                                                    │
│        ▼                                                                    │
│ [User enters 6-digit OTP]                                                   │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/otp/verify]                                                     │
│        │                                                                    │
│        ├─→ 404 ──→ ERROR: "OTP not found"                                  │
│        ├─→ 410 ──→ ERROR: "OTP expired"                                   │
│        ├─→ 400 ──→ ERROR: "Invalid OTP" (with attempts remaining)          │
│        ├─→ 429 ──→ ERROR: "Max attempts exceeded"                          │
│        └─→ 200 ──→ OTP status set to 'verified'                            │
│                                                                             │
│        │                                                                    │
│        ▼ (success)                                                          │
│ [sessionStorage.setItem('otp_verified', 'true')]                           │
│        │                                                                    │
│        ▼                                                                    │
│ [Redirect to /register/set-password]                                       │
│                                                                             │
│ ✅ FLOW COMPLETE                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Set Password                                                         │
│ Route: /register/set-password (apps/web/src/app/(auth)/register/set-password)│
│ API: POST /api/auth/register/create-account                                  │
│       (apps/web/src/app/api/auth/register/create-account/route.ts)          │
│                                                                             │
│ [Check sessionStorage: otp_verified]                                        │
│        │                                                                    │
│        ├─→ false ──→ Redirect to /register/email                           │
│        └─→ true                                                            │
│                                                                             │
│ [User enters password + confirmPassword]                                    │
│        │                                                                    │
│        ▼                                                                    │
│ [Client-side validation]                                                    │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/auth/register/create-account]                                    │
│        │                                                                    │
│        ├─→ Validates OTP status in database (must be 'verified')             │
│        ├─→ Calls supabaseAdmin.auth.admin.createUser()                      │
│        ├─→ Creates profile in profiles table                               │
│        ├─→ Assigns default 'user' role                                     │
│        └─→ Marks OTP as 'used'                                              │
│                                                                             │
│ ⚠️ BUG FOUND: No session cookie set after account creation                 │
│    File: apps/web/src/app/(auth)/register/set-password/page.tsx            │
│    Line: 124 - router.push('/setup')                                        │
│    Missing: response.cookies.set() for session                              │
│                                                                             │
│ [Redirect to /setup]                                                       │
│                                                                             │
│ ❌ FLOW INCOMPLETE - Session not created                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Profile Setup (Onboarding)                                          │
│ Route: /setup (apps/web/src/app/(profile)/setup/page.tsx)                   │
│                                                                             │
│ [User enters fullName, phone, address]                                     │
│        │                                                                    │
│        ▼                                                                    │
│ [Submit] ──→ Updates profile, generates customer_id                         │
│        │                                                                    │
│        ▼                                                                    │
│ [Redirect to /onboarding]                                                   │
│                                                                             │
│ ✅ FLOW COMPLETE (but no session from registration)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Onboarding (Preferences)                                           │
│ Route: /onboarding (apps/web/src/app/(onboarding)/onboarding/page.tsx)     │
│                                                                             │
│ [User selects language, theme, timezone, notifications]                     │
│        │                                                                    │
│        ▼                                                                    │
│ [Submit] ──→ Updates user_preferences                                       │
│        │                                                                    │
│        ▼                                                                    │
│ [Redirect to /dashboard]                                                   │
│                                                                             │
│ ✅ FLOW COMPLETE                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LOGIN FLOW                                                                  │
│ Route: /login (apps/web/src/app/(auth)/login/page.tsx)                      │
│ API: POST /api/auth/login (apps/web/src/app/api/auth/login/route.ts)         │
│                                                                             │
│ [User enters email + password]                                              │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/auth/login]                                                      │
│        │                                                                    │
│        ├─→ Validates input                                                  │
│        ├─→ Calls supabase.auth.signInWithPassword()                        │
│        ├─→ Gets user profile to check role                                 │
│        └─→ Determines redirectUrl based on role                            │
│                                                                             │
│        ▼                                                                    │
│ [Set session cookies]                                                       │
│    response.cookies.set('sb-access-token', access_token, {httpOnly: true}) │
│    response.cookies.set('sb-refresh-token', refresh_token, {httpOnly: false})│
│                                                                             │
│        ▼                                                                    │
│ [Return { success: true, user, redirectUrl }]                              │
│                                                                             │
│        ▼                                                                    │
│ [Client redirects based on role]                                            │
│    - admin/super_admin/system_owner ──→ /admin/dashboard                    │
│    - user ──→ /dashboard                                                   │
│                                                                             │
│ ✅ FLOW COMPLETE                                                            │
│ File: apps/web/src/app/api/auth/login/route.ts                              │
│ Lines: 81-96                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Forgot Password Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FORGOT PASSWORD FLOW                                                         │
│ Route: /forgot-password/verify-otp (combined email + otp in one page)       │
│ File: apps/web/src/app/(auth)/forgot-password/verify-otp/page.tsx           │
│                                                                             │
│ STEP 1: Email Entry                                                         │
│ [User enters email]                                                         │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/otp/generate with purpose='forgot_password']                   │
│        │                                                                    │
│        ▼                                                                    │
│ [sessionStorage.setItem('reset_password_email', email)]                     │
│        │                                                                    │
│        ▼                                                                    │
│ [Show OTP input]                                                            │
│                                                                             │
│ STEP 2: OTP Verification                                                   │
│ [User enters 6-digit OTP]                                                   │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/otp/verify with purpose='forgot_password']                      │
│        │                                                                    │
│        ├─→ success ──→ sessionStorage.setItem('reset_password_verified')  │
│        └─→ error ──→ Show error message                                     │
│                                                                             │
│        │                                                                    │
│        ▼                                                                    │
│ [Redirect to /forgot-password/set-password]                                 │
│                                                                             │
│ ✅ FLOW COMPLETE                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FORGOT PASSWORD: Set New Password                                           │
│ Route: /forgot-password/set-password (apps/web/src/app/(auth)/forgot-password/set-password/page.tsx)│
│ API: POST /api/auth/reset-password (apps/web/src/app/api/auth/reset-password/route.ts)│
│                                                                             │
│ [Check sessionStorage: reset_password_verified]                            │
│        │                                                                    │
│        ├─→ false ──→ Redirect to /forgot-password/verify-otp               │
│        └─→ true                                                            │
│                                                                             │
│ [User enters new password + confirmPassword]                               │
│        │                                                                    │
│        ▼                                                                    │
│ [Call /api/auth/reset-password]                                            │
│        │                                                                    │
│        ├─→ Checks OTP status is 'verified'                                  │
│        ├─→ Finds user by email                                             │
│        ├─→ Calls supabaseAdmin.auth.admin.updateUserById()                 │
│        └─→ Marks OTP as 'used'                                             │
│                                                                             │
│        │                                                                    │
│        ▼                                                                    │
│ [Clear sessionStorage]                                                      │
│        │                                                                    │
│        ▼                                                                    │
│ [Redirect to /login?password_reset=true]                                    │
│                                                                             │
│ ✅ FLOW COMPLETE                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Logout Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LOGOUT FLOW                                                                  │
│                                                                             │
│ ❌ BUG FOUND: No logout route exists                                        │
│                                                                             │
│ Expected Flow:                                                               │
│ Route: /logout or POST /api/auth/logout                                     │
│ Files: None exist                                                           │
│                                                                             │
│ Should:                                                                     │
│ 1. Clear session cookies (sb-access-token, sb-refresh-token)               │
│ 2. Call supabase.auth.signOut() (optional, clears server-side session)      │
│ 3. Redirect to /login                                                        │
│                                                                             │
│ Current State: No logout functionality implemented                          │
│                                                                             │
│ ❌ FLOW MISSING                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Middleware Analysis

### Current Middleware
**File:** `apps/web/src/middleware.ts`

```typescript
// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Routes to redirect authenticated users away from
const guestRoutes = ['/login', '/register'];
```

**Issues Found:**

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | Admin routes not protected | HIGH | middleware.ts:10 |
| 2 | Profile completion check uses language/timezone, not fullName/phone/address | MEDIUM | middleware.ts:54-58 |
| 3 | No /admin/* protection | HIGH | middleware.ts |
| 4 | Onboarding not protected from unauthenticated users | MEDIUM | middleware.ts |

---

## Detailed Bug Reports

### BUG #1: Logout Route Missing

**Severity:** HIGH  
**Flow:** Logout  
**File:** N/A (missing)

**Description:**
No logout route exists. Users cannot log out.

**Current Behavior:**
Users must close browser to end session.

**Expected Behavior:**
1. POST /api/auth/logout should exist
2. Should clear sb-access-token and sb-refresh-token cookies
3. Should optionally call supabase.auth.signOut()
4. Should redirect to /login

**Files Affected:**
- `apps/web/src/app/api/auth/logout/route.ts` (MISSING)
- `apps/web/src/app/(auth)/login/page.tsx` (needs logout button)

**Recommended Fix:**
1. Create `/api/auth/logout/route.ts`
2. Set cookie maxAge to 0 to clear
3. Add logout button to login page or create logout page

---

### BUG #2: Registration Flow Missing Session Creation

**Severity:** HIGH  
**Flow:** Registration  
**File:** `apps/web/src/app/(auth)/register/set-password/page.tsx`

**Line:** 99-116

**Description:**
After creating account via `/api/auth/register/create-account`, the response does not contain session data. The client then tries to sign in again (lines 99-116) but this is not properly handled.

**Current Behavior:**
1. Account created successfully
2. Code tries to call /api/auth/login again (lines 100-107)
3. If that fails, redirects to /login
4. User must sign in after registration

**Expected Behavior:**
After account creation, automatically create session:
1. Server-side: Return session data in create-account response OR set cookies directly
2. Client-side: No need to call login again

**Code Location:**
```typescript
// Line 99-116 in set-password/page.tsx
// This is the problem - it tries to log in again after registration
const signInResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
  }),
});
```

**Recommended Fix:**
Option A (Server-side): Modify create-account route to return session cookies
Option B (Client-side): Use supabase.auth.signInWithPassword() client-side after create-account

---

### BUG #3: Middleware Profile Check Incomplete

**Severity:** MEDIUM  
**Flow:** All Protected Routes  
**File:** `apps/web/src/middleware.ts`

**Line:** 54-58

**Description:**
The middleware checks profile completion using language and timezone instead of the actual required fields (fullName, phone, address).

**Current Logic:**
```typescript
const hasFullName = profile?.full_name && profile.full_name.trim().length > 0;
const hasLanguage = preferences?.language && preferences.language.trim().length > 0;
const hasTimezone = preferences?.timezone && preferences.timezone.trim().length > 0;
return !hasFullName || !hasLanguage || !hasTimezone;
```

**Expected Logic (per PRD):**
Profile is incomplete if any of:
- full_name is missing
- phone is missing (PRD requires mobile number)
- address is missing

**Recommended Fix:**
Update middleware to check actual required fields for PRD compliance.

---

### BUG #4: No Admin Subdomain Protection

**Severity:** HIGH  
**Flow:** Admin  
**File:** `apps/web/src/middleware.ts`

**Description:**
No protection for admin routes. Any authenticated user can access admin pages.

**Expected Behavior:**
1. Admin routes (/admin/*) require admin role
2. Middleware should check profile.role for 'admin', 'super_admin', or 'system_owner'
3. If not admin, redirect to /dashboard or return 403

**Current Behavior:**
No role checking in middleware.

**Recommended Fix:**
Add admin role check in middleware:
```typescript
if (pathname.startsWith('/admin')) {
  // Check if user has admin role
  const profile = await getProfile(accessToken);
  if (!['admin', 'super_admin', 'system_owner'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

---

### BUG #5: Cooldown Timer Not Working

**Severity:** MEDIUM  
**Flow:** Registration  
**File:** `apps/web/src/app/(auth)/register/email/page.tsx`

**Line:** 92-104

**Description:**
The cooldown timer uses `useState` setter in useEffect, which doesn't trigger re-render properly.

**Code:**
```typescript
// Line 92-104 - BUG: useState doesn't work for interval
useState(() => {
  if (cooldownEnd) {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setCooldownEnd(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }
});
```

**Issue:**
`useState` returns a function, not a state setter. The interval is never started.

**Recommended Fix:**
Use `useEffect` with proper dependency:
```typescript
useEffect(() => {
  if (cooldownEnd) {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setCooldownEnd(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }
}, [cooldownEnd]);
```

---

## Database Operations

### Email OTPs Table (email_otps)

| Column | Type | Purpose |
|--------|------|---------|
| email | TEXT | User email (lowercase) |
| otp_code | TEXT | 6-digit code |
| purpose | TEXT | 'registration', 'forgot_password', etc. |
| status | TEXT | 'pending', 'verified', 'expired', 'used' |
| expires_at | TIMESTAMPTZ | Expiration timestamp |
| attempt_count | INTEGER | Failed attempts |
| verified_at | TIMESTAMPTZ | When OTP was verified |
| created_at | TIMESTAMPTZ | Creation timestamp |

### Profiles Table (profiles)

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Auth user ID |
| email | TEXT | User email (lowercase) |
| full_name | TEXT | User's full name |
| phone | TEXT | Mobile number |
| address | TEXT | Address |
| customer_id | TEXT | SB-XXXXX format |
| status | TEXT | 'pending', 'active', 'suspended' |
| role | TEXT | 'user', 'admin', etc. |
| profile_verified | BOOLEAN | Profile completion flag |

---

## File Index

### Pages

| Route | File |
|-------|------|
| /register | apps/web/src/app/(auth)/register/page.tsx |
| /register/email | apps/web/src/app/(auth)/register/email/page.tsx |
| /register/verify-otp | apps/web/src/app/(auth)/register/verify-otp/page.tsx |
| /register/set-password | apps/web/src/app/(auth)/register/set-password/page.tsx |
| /login | apps/web/src/app/(auth)/login/page.tsx |
| /forgot-password | apps/web/src/app/(auth)/forgot-password/page.tsx |
| /forgot-password/verify-otp | apps/web/src/app/(auth)/forgot-password/verify-otp/page.tsx |
| /forgot-password/set-password | apps/web/src/app/(auth)/forgot-password/set-password/page.tsx |
| /onboarding | apps/web/src/app/(onboarding)/onboarding/page.tsx |
| /setup | apps/web/src/app/(profile)/setup/page.tsx |

### APIs

| Endpoint | File |
|----------|------|
| POST /api/auth/login | apps/web/src/app/api/auth/login/route.ts |
| POST /api/auth/check-email | apps/web/src/app/api/auth/check-email/route.ts |
| POST /api/auth/register/create-account | apps/web/src/app/api/auth/register/create-account/route.ts |
| POST /api/auth/reset-password | apps/web/src/app/api/auth/reset-password/route.ts |
| POST /api/otp/generate | apps/web/src/app/api/otp/generate/route.ts |
| POST /api/otp/verify | apps/web/src/app/api/otp/verify/route.ts |

### Middleware

| File | Purpose |
|------|---------|
| apps/web/src/middleware.ts | Auth and profile completion redirects |

---

## Recommended Fix Order

### Priority 1 (Critical - Auth Flow Broken)

1. **BUG #1: Create Logout Route**
   - Create `/api/auth/logout/route.ts`
   - Clear session cookies
   - Add logout button to login page

2. **BUG #2: Fix Session Creation After Registration**
   - Modify create-account route to return session
   - OR modify set-password page to properly create session

### Priority 2 (High - Security Issues)

3. **BUG #4: Add Admin Role Protection**
   - Update middleware to check admin role for /admin/* routes

4. **BUG #5: Fix Cooldown Timer**
   - Use useEffect instead of useState for interval

### Priority 3 (Medium - PRD Compliance)

5. **BUG #3: Update Middleware Profile Check**
   - Check fullName, phone, address instead of language, timezone

---

## Test Scenarios

### 1. New Registration
```
1. Go to /register
2. Enter new email
3. Verify OTP sent
4. Enter OTP
5. Set password
6. Verify account created
7. Verify session created
8. Verify redirected to /setup
```

### 2. Existing Email Registration
```
1. Go to /register
2. Enter existing email
3. Verify error: "Email already registered"
4. Verify OTP NOT sent
```

### 3. OTP Expiry
```
1. Generate OTP
2. Wait 5+ minutes (or manipulate DB)
3. Enter OTP
4. Verify error: "OTP expired"
```

### 4. Forgot Password
```
1. Go to /forgot-password
2. Enter email
3. Verify OTP sent
4. Enter OTP
5. Set new password
6. Verify redirected to /login
7. Sign in with new password
8. Verify access granted
```

### 5. Login
```
1. Go to /login
2. Enter credentials
3. Verify session cookies set
4. Verify redirect to /dashboard
```

### 6. Logout
```
1. Sign in
2. Click logout
3. Verify cookies cleared
4. Verify redirected to /login
5. Verify cannot access /dashboard without login
```

### 7. Dashboard Access
```
1. Sign in
2. Go to /dashboard
3. Verify access granted
```

### 8. Admin Access
```
1. Sign in as non-admin
2. Try to access /admin/*
3. Verify 403 or redirect
4. Sign in as admin
5. Verify access granted
```

### 9. Session Persistence
```
1. Sign in
2. Refresh page
3. Verify still authenticated
4. Close and reopen browser
5. Verify session persists
```

### 10. Onboarding
```
1. Sign up (creates account)
2. Verify redirected to /onboarding
3. Complete profile
4. Verify redirected to /dashboard
5. Sign out
6. Sign back in
7. Verify NOT redirected to /onboarding
```

---

## Summary

### Current State: PARTIALLY WORKING

**Working:**
- ✅ OTP Email Delivery
- ✅ OTP Verification
- ✅ Account Creation
- ✅ SMTP Integration
- ✅ Supabase Integration
- ✅ Login Session Creation

**Not Working:**
- ❌ Registration Session Creation (BUG #2)
- ❌ Logout (BUG #1)
- ❌ Admin Protection (BUG #4)
- ❌ Cooldown Timer (BUG #5)
- ⚠️ Middleware Profile Check (BUG #3)

### Next Steps

1. Create this audit report
2. Fix bugs in recommended order
3. Create integration tests
4. Verify all 10 test scenarios pass
5. Update documentation

---

*Report generated: 2026-05-31*