# PRD: SUBDOMAIN AUTHENTICATION ARCHITECTURE REBUILD

**Date:** 2026-06-01  
**Status:** DRAFT - AWAITING APPROVAL  
**Version:** 1.0  
**Priority:** CRITICAL  

---

## 1. INTRODUCTION

### Problem Statement

The current authentication implementation does not follow the PRD requirements. Repeated hotfixes have not solved the fundamental architectural issues. The system currently has:

1. Auth pages mixed with marketing content in a single web app
2. Dashboard and admin apps as empty stubs with no functionality
3. Session not shared across subdomains due to missing cookie domain configuration
4. No proper subdomain-based routing

### Target Outcome

A production-ready multi-subdomain SaaS architecture with:
- Marketing site at esite.top (no auth)
- User app at dashboard.esite.top (full auth)
- Admin app at admin.esite.top (isolated, role-protected)

---

## 2. GOALS

| # | Goal | Measurable |
|---|------|------------|
| G1 | Isolate marketing from authentication | No login/register/dashboard pages on esite.top |
| G2 | Implement full auth in dashboard subdomain | Complete user flow: login, register, forgot password, logout |
| G3 | Implement isolated admin subdomain | Admin login with role check, 403 for non-admins |
| G4 | Cross-subdomain session | Single login works across all subdomains |
| G5 | Production-ready security | No data leakage, proper role enforcement |

---

## 3. TARGET ARCHITECTURE

### 3.1 Domain Mapping

| Domain | Purpose | App | Auth Required |
|--------|---------|-----|---------------|
| `esite.top` | Marketing Only | web | NO |
| `dashboard.esite.top` | User App | dashboard | YES |
| `admin.esite.top` | Admin App | admin | YES + Admin Role |

### 3.2 esite.top (Marketing Site)

**Pages:**
- Homepage `/`
- About `/about`
- Pricing `/pricing`
- Features `/features`
- Contact `/contact`
- Blog `/blog/*`

**Header Actions (Logged Out):**
- Login → `dashboard.esite.top/login`
- Create Account → `dashboard.esite.top/register`

**Header Actions (Logged In):**
- Profile → `dashboard.esite.top/profile`
- Dashboard → `dashboard.esite.top/dashboard`
- Logout → `POST dashboard.esite.top/api/auth/logout`

**Must NOT contain:**
- `/login`
- `/register`
- `/forgot-password`
- `/dashboard`
- `/admin`
- `/onboarding`
- Any auth-related API routes

### 3.3 dashboard.esite.top (User Application)

**Auth Pages:**
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password reset flow

**Protected Pages:**
- `/onboarding` - Profile completion (first-time users)
- `/dashboard` - Main user dashboard
- `/profile` - User profile management
- `/settings` - User settings

**API Routes:**
- `/api/auth/login` - Login handler
- `/api/auth/logout` - Logout handler
- `/api/auth/register/create-account` - Account creation
- `/api/otp/generate` - OTP generation
- `/api/otp/verify` - OTP verification
- `/api/auth/reset-password` - Password reset

**Middleware Rules:**
- Unauthenticated → Redirect to `/login`
- Authenticated + visiting `/login` or `/register` → Redirect to `/dashboard`
- Profile incomplete → Redirect to `/onboarding`

### 3.4 admin.esite.top (Admin Application)

**Auth Pages:**
- `/login` - Admin login only

**Protected Pages:**
- `/` → `/admin/dashboard`
- `/dashboard` - Admin dashboard
- `/users` - User management
- `/settings` - Admin settings

**API Routes:**
- `/api/auth/login` - Admin login (validates admin role)
- `/api/auth/logout` - Logout

**Middleware Rules:**
- Direct visit to any page except `/login` → Show 404 or "Private Workspace"
- `/login` → Allow authentication attempt
- Authenticated + wrong role → 403 Forbidden
- Authenticated + correct role → Allow access

**Allowed Roles:**
- `system_owner`
- `super_admin`
- `admin`

---

## 4. CURRENT STATE vs TARGET STATE

### 4.1 Gap Analysis

| Component | Current State | Target State | Gap |
|-----------|---------------|---------------|-----|
| **esite.top** | Has auth pages mixed in | Marketing only | Auth pages must be removed |
| **dashboard.esite.top** | Empty stub | Full user app | Must implement all pages |
| **admin.esite.top** | Empty stub | Admin app with login | Must implement with isolation |
| **Session Cookies** | Scoped to single domain | `.esite.top` | Must add domain config |
| **Middleware** | Only in web app | Per-app middleware | Must implement in all |
| **Auth APIs** | Only in web app | Shared or replicated | Must architect properly |

### 4.2 Current File Structure

```
apps/
├── web/           # Port 3000 - Mixed marketing + auth ❌
│   ├── src/app/
│   │   ├── (auth)/          # Auth pages ❌ SHOULD MOVE
│   │   ├── (onboarding)/     # Onboarding ❌ SHOULD MOVE
│   │   ├── (profile)/        # Profile ❌ SHOULD MOVE
│   │   ├── api/auth/         # Auth APIs ❌ SHOULD MOVE
│   │   ├── api/otp/          # OTP APIs ❌ SHOULD MOVE
│   │   ├── dashboard/        # Dashboard pages ❌ SHOULD MOVE
│   │   └── page.tsx          # Landing (keep)
│   └── middleware.ts         # Auth middleware (keep)
│
├── dashboard/     # Port 3001 - EMPTY STUB ❌
│   └── src/app/
│       └── page.tsx          # Placeholder only ❌
│
└── admin/         # Port 3002 - EMPTY STUB ❌
    └── src/app/
        └── page.tsx          # Placeholder only ❌
```

### 4.3 Target File Structure

```
apps/
├── web/           # esite.top - Marketing only
│   ├── src/app/
│   │   ├── page.tsx          # Landing page (keep)
│   │   ├── about/             # About page
│   │   ├── pricing/           # Pricing page
│   │   ├── features/          # Features page
│   │   ├── blog/              # Blog pages
│   │   └── layout.tsx         # Marketing layout
│   └── middleware.ts          # Optional: redirect to dashboard for auth
│
├── dashboard/     # dashboard.esite.top - User app
│   ├── src/app/
│   │   ├── (auth)/            # Auth pages (login, register, forgot-password)
│   │   ├── (onboarding)/      # Onboarding flow
│   │   ├── (protected)/       # Protected user pages
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── api/auth/          # Auth APIs
│   │   ├── api/otp/           # OTP APIs
│   │   └── middleware.ts      # User auth middleware
│   └── package.json
│
└── admin/         # admin.esite.top - Admin app
    ├── src/app/
    │   ├── login/
    │   │   └── page.tsx       # Admin login only
    │   ├── api/auth/          # Admin auth APIs
    │   ├── dashboard/         # Admin dashboard
    │   ├── users/             # User management
    │   ├── settings/          # Admin settings
    │   └── middleware.ts      # Admin role middleware
    └── package.json
```

---

## 5. USER STORIES

### US-001: Marketing Site with Dynamic Auth Header
**Description:** As a visitor, I want to see the marketing site at esite.top with a header that changes based on authentication status.

**Acceptance Criteria:**
- [ ] Header shows Login/Register when not authenticated
- [ ] Header shows Profile/Dashboard/Logout when authenticated
- [ ] Login link points to dashboard.esite.top/login
- [ ] Register link points to dashboard.esite.top/register
- [ ] No auth pages exist on esite.top

### US-002: User Registration Flow
**Description:** As a new user, I want to register at dashboard.esite.top/register, verify my email with OTP, and be redirected to onboarding.

**Acceptance Criteria:**
- [ ] User enters email at /register
- [ ] OTP is sent to email
- [ ] User verifies OTP at /register/verify-otp
- [ ] User creates password at /register/set-password
- [ ] Account is created with session cookies
- [ ] User is redirected to /onboarding (authenticated)

### US-003: User Login Flow
**Description:** As a returning user, I want to log in at dashboard.esite.top/login and access my dashboard.

**Acceptance Criteria:**
- [ ] User enters email/password at /login
- [ ] Session cookies are set (domain: .esite.top)
- [ ] User is redirected to /dashboard
- [ ] User can access other protected pages without re-login

### US-004: User Logout
**Description:** As a logged-in user, I want to log out and be redirected to the login page.

**Acceptance Criteria:**
- [ ] User clicks Logout in header
- [ ] POST /api/auth/logout is called
- [ ] Session cookies are cleared
- [ ] User is redirected to /login (or homepage)

### US-005: Admin Login Isolation
**Description:** As an admin, I want to log in at admin.esite.top/login and access the admin dashboard.

**Acceptance Criteria:**
- [ ] Only admin.esite.top/login accepts admin credentials
- [ ] Visiting admin.esite.top without auth shows 404 or "Private Workspace"
- [ ] Admin login validates role (system_owner, super_admin, admin)
- [ ] Session cookies are set (domain: .esite.top)
- [ ] Admin can access admin dashboard pages

### US-006: Non-Admin Access Denied
**Description:** As a non-admin user, I should not be able to access admin.esite.top.

**Acceptance Criteria:**
- [ ] Regular user visiting admin.esite.top receives 403
- [ ] User must have role: system_owner, super_admin, or admin
- [ ] Error message: "Forbidden. Admin access required."

### US-007: Cross-Subdomain Session
**Description:** As a logged-in user, my session should work across all subdomains.

**Acceptance Criteria:**
- [ ] Login at dashboard.esite.top sets cookies with domain: .esite.top
- [ ] Visiting esite.top shows authenticated header
- [ ] Visiting admin.esite.top checks role (denied if not admin)
- [ ] Logout clears cookies across all subdomains

### US-008: Profile Incomplete Redirect
**Description:** As a newly registered user with incomplete profile, I should be redirected to onboarding.

**Acceptance Criteria:**
- [ ] After registration, profile is incomplete
- [ ] Visiting /dashboard redirects to /onboarding
- [ ] Completing onboarding allows access to /dashboard

---

## 6. FUNCTIONAL REQUIREMENTS

### FR-1: Cookie Domain Configuration
All authentication cookies must be set with `domain: '.esite.top'` to enable cross-subdomain session sharing.

**Files to modify:**
- `apps/dashboard/src/app/api/auth/login/route.ts`
- `apps/dashboard/src/app/api/auth/register/create-account/route.ts`
- `apps/dashboard/src/app/api/auth/logout/route.ts`
- `apps/admin/src/app/api/auth/login/route.ts`
- `apps/admin/src/app/api/auth/logout/route.ts`

### FR-2: User Middleware (Dashboard App)
Middleware must handle:
- Authenticated route protection
- Guest route redirects (login/register → dashboard if already auth)
- Profile completion check

### FR-3: Admin Middleware (Admin App)
Middleware must handle:
- All routes except /login require authentication
- /login page only: allows unauthenticated access
- Role check: only system_owner, super_admin, admin allowed
- Direct access to non-login pages shows 404

### FR-4: Marketing Header Dynamic
Marketing site header must:
- Check authentication status via cookies
- Show appropriate links based on auth state
- Links to dashboard subdomain for auth actions

### FR-5: Vercel Subdomain Routing
Configure Vercel to route:
- `esite.top` → web app (marketing)
- `dashboard.esite.top` → dashboard app (user)
- `admin.esite.top` → admin app (admin)

### FR-6: DNS Configuration
DNS must be configured for:
- A record for esite.top → Vercel
- CNAME for dashboard.esite.top → Vercel
- CNAME for admin.esite.top → Vercel

---

## 7. NON-GOALS

This implementation will NOT include:
- Changing the database schema (profiles, roles already exist)
- Modifying Supabase configuration
- Implementing new payment or billing features
- CMS content changes
- DNS changes (documentation only)
- Vercel deployment (documentation only)

---

## 8. TECHNICAL APPROACH

### 8.1 Cookie Configuration

```typescript
// All auth cookies must include domain
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: '.esite.top',  // KEY: enables cross-subdomain sharing
  maxAge: 60 * 60 * 24 * 7,  // 1 week
};
```

### 8.2 Middleware Pattern

```typescript
// apps/dashboard/src/middleware.ts
export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const isAuthenticated = !!accessToken;
  const pathname = request.nextUrl.pathname;

  // Auth routes - redirect if already logged in
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check profile completion
  const profileIncomplete = await checkProfileIncomplete(accessToken);
  if (profileIncomplete && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}
```

### 8.3 Admin Middleware Pattern

```typescript
// apps/admin/src/middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /login is the only public route
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // All other routes require auth
  const accessToken = request.cookies.get('sb-access-token')?.value;
  if (!accessToken) {
    // Redirect to admin login, not dashboard login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check admin role
  const isAdmin = await checkAdminRole(accessToken);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}
```

### 8.4 Shared Components

Shared packages should be used:
- `@sitesbd/ui` - Auth UI components (already exist)
- `@sitesbd/auth` - Auth utilities (already exist)
- `@sitesbd/shared` - Shared types

### 8.5 Database Schema (Existing - No Changes)

```sql
-- profiles table (existing)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,  -- Auth user ID
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  customer_id VARCHAR(50),
  status user_status DEFAULT 'pending',
  role VARCHAR(50),  -- 'user', 'admin', 'super_admin', 'system_owner'
  profile_verified BOOLEAN DEFAULT false
);

-- roles table (existing)
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE  -- 'user', 'admin', 'super_admin', 'system_owner'
);
```

---

## 9. MIGRATION PLAN

### Phase 1: Dashboard App Implementation
**Timeline:** 1-2 weeks

1. **Copy auth pages from web to dashboard**
   - Move `(auth)/` folder to dashboard app
   - Move `(onboarding)/` folder to dashboard app
   - Move `(profile)/` folder to dashboard app

2. **Copy auth APIs to dashboard**
   - Move API routes from web to dashboard
   - Update cookie domain configuration

3. **Implement dashboard middleware**
   - Create `apps/dashboard/src/middleware.ts`
   - Add auth protection
   - Add profile completion check

4. **Update marketing header**
   - Modify web app header to use dashboard subdomain links

### Phase 2: Admin App Implementation
**Timeline:** 1 week

1. **Create admin login page**
   - `apps/admin/src/app/login/page.tsx`

2. **Implement admin APIs**
   - `apps/admin/src/app/api/auth/login/route.ts`
   - `apps/admin/src/app/api/auth/logout/route.ts`

3. **Implement admin middleware**
   - Create `apps/admin/src/middleware.ts`
   - Block all routes except /login
   - Check admin role

4. **Create admin dashboard pages**
   - Basic admin dashboard structure

### Phase 3: Cookie Configuration
**Timeline:** 1 day

1. **Update all auth routes**
   - Add `domain: '.esite.top'` to all cookie settings
   - Test cross-subdomain session

### Phase 4: Vercel Configuration
**Timeline:** 1-2 days

1. **Configure subdomain routing**
   - Set up domain mappings in Vercel
   - Configure environment variables per app

---

## 10. FILE CHANGES REQUIRED

### 10.1 New Files

| File | Purpose |
|------|---------|
| `apps/dashboard/src/middleware.ts` | User auth middleware |
| `apps/admin/src/middleware.ts` | Admin auth middleware |
| `apps/admin/src/app/login/page.tsx` | Admin login page |
| `apps/admin/src/app/api/auth/login/route.ts` | Admin login API |
| `apps/admin/src/app/api/auth/logout/route.ts` | Admin logout API |
| `apps/admin/src/app/dashboard/page.tsx` | Admin dashboard |
| `apps/admin/src/app/users/page.tsx` | User management |

### 10.2 Files to Move

| From | To | Notes |
|------|-----|-------|
| `apps/web/src/app/(auth)` | `apps/dashboard/src/app/(auth)` | Auth pages |
| `apps/web/src/app/(onboarding)` | `apps/dashboard/src/app/(onboarding)` | Onboarding |
| `apps/web/src/app/(profile)` | `apps/dashboard/src/app/(profile)` | Profile |
| `apps/web/src/app/api/auth` | `apps/dashboard/src/app/api/auth` | Auth APIs |
| `apps/web/src/app/api/otp` | `apps/dashboard/src/app/api/otp` | OTP APIs |

### 10.3 Files to Modify

| File | Change |
|------|--------|
| `apps/web/src/app/(auth)/*` | DELETE - remove from web |
| `apps/web/src/app/(onboarding)/*` | DELETE - remove from web |
| `apps/web/src/app/(profile)/*` | DELETE - remove from web |
| `apps/web/src/app/api/auth/*` | DELETE - remove from web |
| `apps/web/src/app/api/otp/*` | DELETE - remove from web |
| `apps/web/src/app/page.tsx` | UPDATE - dynamic header |
| `apps/web/src/app/layout.tsx` | UPDATE - marketing layout |

### 10.4 Cookie Updates

All files in `apps/dashboard/src/app/api/auth/*`:
```typescript
// Add domain to cookie options
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  domain: '.esite.top',  // ADD THIS
  maxAge: 60 * 60 * 24 * 7,
};
```

---

## 11. VERCEL ROUTING

### 11.1 Vercel Project Configuration

```json
// vercel.json or Vercel Dashboard
{
  "projects": [
    {
      "name": "sitesbd-web",
      "gitUrl": "github.com/hminhajulonline-dot/sitesbd-platform",
      "dir": "apps/web"
    },
    {
      "name": "sitesbd-dashboard",
      "gitUrl": "github.com/hminhajulonline-dot/sitesbd-platform",
      "dir": "apps/dashboard"
    },
    {
      "name": "sitesbd-admin",
      "gitUrl": "github.com/hminhajulonline-dot/sitesbd-platform",
      "dir": "apps/admin"
    }
  ]
}
```

### 11.2 Domain Configuration

In Vercel Dashboard, configure domains:

| Project | Domain | Type |
|---------|--------|------|
| sitesbd-web | esite.top | Primary |
| sitesbd-dashboard | dashboard.esite.top | Custom |
| sitesbd-admin | admin.esite.top | Custom |

### 11.3 Environment Variables

Each app needs:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SITE_URL=https://esite.top
```

---

## 12. DNS REQUIREMENTS

### 12.1 Required DNS Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | Vercel IP | Main site |
| CNAME | www | cname.vercel-dns.com | WWW redirect |
| CNAME | dashboard | cname.vercel-dns.com | User app |
| CNAME | admin | cname.vercel-dns.com | Admin app |

### 12.2 Vercel Verification

After DNS configuration, verify in Vercel:
1. Add custom domain to each project
2. Vercel will provide verification records
3. Update DNS with Vercel records
4. Wait for SSL certificate provisioning

---

## 13. SUCCESS CRITERIA

### SC-1: Marketing Site Isolation
- [ ] No auth pages (login, register, forgot-password) exist on esite.top
- [ ] Header changes based on auth state
- [ ] Auth links point to dashboard.esite.top

### SC-2: User Dashboard Functionality
- [ ] User can register at dashboard.esite.top/register
- [ ] OTP flow works correctly
- [ ] Session cookies are set with domain: .esite.top
- [ ] User can access dashboard, profile, settings
- [ ] Logout clears session across all subdomains

### SC-3: Admin Isolation
- [ ] admin.esite.top/login is the only accessible route without auth
- [ ] Other admin routes return 404 or require auth
- [ ] Admin login requires admin role
- [ ] Non-admin users receive 403

### SC-4: Cross-Subdomain Session
- [ ] Login at dashboard.esite.top works at admin.esite.top
- [ ] Profile link in marketing header works
- [ ] Logout from marketing site clears all sessions

### SC-5: Profile Completion
- [ ] New users redirected to onboarding
- [ ] Completing onboarding allows dashboard access
- [ ] Profile check uses correct database columns

---

## 14. TESTING CHECKLIST

### T-1: Marketing Site Tests
- [ ] Visit esite.top - shows marketing content
- [ ] Header shows Login/Register (unauthenticated)
- [ ] Click Login - redirects to dashboard.esite.top/login
- [ ] Login as user - header shows Profile/Dashboard/Logout

### T-2: User Registration Tests
- [ ] Visit dashboard.esite.top/register
- [ ] Enter email - OTP sent
- [ ] Enter OTP - verified
- [ ] Set password - account created
- [ ] Redirected to onboarding (authenticated)
- [ ] Complete onboarding - redirected to dashboard

### T-3: User Login Tests
- [ ] Visit dashboard.esite.top/login
- [ ] Enter credentials - logged in
- [ ] Access /dashboard - allowed
- [ ] Access /profile - allowed
- [ ] Logout - session cleared

### T-4: Admin Access Tests
- [ ] Visit admin.esite.top - 404 or Private Workspace
- [ ] Visit admin.esite.top/login - shows login form
- [ ] Login as admin - redirected to admin dashboard
- [ ] Login as regular user - 403 Forbidden
- [ ] Logout - session cleared

### T-5: Cross-Subdomain Tests
- [ ] Login at dashboard.esite.top
- [ ] Visit esite.top - shows authenticated header
- [ ] Visit admin.esite.top/login - shows login (already authenticated but admin only)
- [ ] Logout from anywhere - all sessions cleared

---

## 15. OPEN QUESTIONS

1. **Q: Should the marketing site header show the user's name when logged in?**
   - A: Yes, enhance UX by showing "Welcome, [Name]" in header

2. **Q: Should there be a link from marketing site to user dashboard?**
   - A: Yes, "Dashboard" link in header when authenticated

3. **Q: Should admin login use the same Supabase project?**
   - A: Yes, for shared user/role data

4. **Q: How to handle forgot password in admin?**
   - A: Admin should contact system owner, no self-service forgot password

5. **Q: Should there be SSO between subdomains?**
   - A: Cookie domain: .esite.top handles this automatically

---

## 16. APPROVAL REQUIRED

Before implementation begins, the following must be approved:

- [ ] Target architecture (esite.top, dashboard.esite.top, admin.esite.top)
- [ ] File migration plan (which files move where)
- [ ] Cookie configuration (domain: .esite.top)
- [ ] Admin isolation approach (404 for direct access)
- [ ] Migration timeline (phased approach)

---

*Document version 1.0 - awaiting stakeholder approval*