# FINAL PRODUCT ARCHITECTURE

**Document Name:** FINAL_PRODUCT_ARCHITECTURE.md  
**Status:** AUTHORITATIVE - Active  
**Version:** 1.0  
**Last Updated:** 2026-06-01  
**Product:** SitesBD  

---

## 1. PURPOSE

This document is the **authoritative architecture reference** for all future development on the SitesBD platform. All PRs, implementation decisions, and technical specifications must align with this document.

**Previous Documents (Superseded):**
- `docs/PLATFORM_ARCHITECTURE_AUDIT.md` - Initial audit (reference only)
- `docs/ARCHITECTURE_REFACTOR_PLAN.md` - Refactor options (reference only)
- `docs/PRD_SUBDOMAIN_ARCHITECTURE.md` - Draft PRD (superseded by this document)

---

## 2. PRODUCT IDENTITY

### 2.1 Product Name

**SitesBD** - The primary product name for all user-facing elements.

### 2.2 Domain Strategy

| Domain | Status | Purpose |
|--------|--------|---------|
| `esite.top` | **TEMPORARY** | Testing/development only |
| `sitesbd.com` | **PRIMARY** | Production domain (future) |

**Note:** `esite.top` is a temporary testing domain. The authoritative domain will be `sitesbd.com`. All architecture decisions must support both the transition to and operation on `sitesbd.com`.

---

## 3. ARCHITECTURE OVERVIEW

### 3.1 Three-Subdomain Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SitesBD Platform                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│   │  MARKETING  │    │     DASHBOARD   │    │    ADMIN      │  │
│   │             │    │                 │    │               │  │
│   │  sitesbd    │    │   dashboard.    │    │   admin.      │  │
│   │  (.com)     │    │   sitesbd       │    │   sitesbd     │  │
│   │             │    │   (.com)        │    │   (.com)      │  │
│   │             │    │                 │    │               │  │
│   │  - Landing  │    │  - Login        │    │  - HIDDEN     │  │
│   │  - Features │    │  - Register     │    │  - Login Only │  │
│   │  - Pricing  │    │  - Dashboard    │    │  - Role Check │  │
│   │  - About    │    │  - Profile      │    │               │  │
│   │  - Contact  │    │  - Settings     │    │  - Dashboard  │  │
│   │  - Blog     │    │  - Onboarding   │    │  - Users      │  │
│   │             │    │  - Logout       │    │  - Settings   │  │
│   │             │    │                 │    │               │  │
│   └─────────────┘    └─────────────────┘    └───────────────┘  │
│                                                                 │
│   Public         User Application        Hidden Admin           │
│   Discovery      Authentication          Isolation              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Subdomain Definitions

| Subdomain | Discovery | Purpose | Auth Required |
|-----------|-----------|---------|---------------|
| `www.sitesbd.com` | Public | Marketing website | NO |
| `dashboard.sitesbd.com` | Public | User application | YES |
| `admin.sitesbd.com` | HIDDEN | Admin application | YES + Admin Role |

**Admin Discovery Rule:** The admin subdomain is NOT publicly discoverable. Direct URL access returns 404. Admin access is only reachable through authenticated admin account navigation.

---

## 4. SUBDOMAIN SPECIFICATIONS

### 4.1 Marketing Subdomain (www.sitesbd.com)

**Purpose:** Marketing website - attract and inform potential customers.

**Discovery:** Public - indexed by search engines, linked from external sources.

**Required Pages:**
- `/` - Homepage
- `/about` - About Us
- `/pricing` - Pricing Plans
- `/features` - Feature List
- `/contact` - Contact Form
- `/blog` - Blog (optional)
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

**Must NOT Contain:**
- `/login` - Do not expose user login
- `/register` - Do not expose registration
- `/forgot-password` - Do not expose password reset
- `/dashboard` - Do not expose user dashboard
- `/profile` - Do not expose user profile
- `/settings` - Do not expose settings
- `/onboarding` - Do not expose onboarding
- Any authentication-related pages

**Header Navigation (Unauthenticated):**
```
┌──────────────────────────────────────────────────────────────────┐
│  SitesBD     Features  Pricing  About  Blog     [Login] [Register] │
└──────────────────────────────────────────────────────────────────┘
```

**Header Navigation (Authenticated User):**
```
┌──────────────────────────────────────────────────────────────────┐
│  SitesBD     Features  Pricing  About  Blog     [Dashboard] [Profile] [Logout] │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Header must check authentication via cookies
- "Dashboard" links to `dashboard.sitesbd.com/dashboard`
- "Profile" links to `dashboard.sitesbd.com/profile`
- "Logout" calls `dashboard.sitesbd.com/api/auth/logout`

---

### 4.2 Dashboard Subdomain (dashboard.sitesbd.com)

**Purpose:** User application - authentication, dashboard, profile management.

**Discovery:** Public - login and register links on marketing site.

**Required Pages:**

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/login` | User login | NO (redirect if authenticated) |
| `/register` | User registration | NO (redirect if authenticated) |
| `/forgot-password` | Password reset | NO |
| `/verify-otp` | OTP verification | NO (session-based) |
| `/onboarding` | Profile completion | YES (first-time users) |
| `/dashboard` | User dashboard | YES |
| `/profile` | User profile | YES |
| `/settings` | User settings | YES |
| `/logout` | Logout action | NO |

**API Routes:**

| Route | Purpose |
|-------|---------|
| `/api/auth/login` | User authentication |
| `/api/auth/logout` | Session termination |
| `/api/auth/register/create-account` | Account creation |
| `/api/otp/generate` | OTP generation |
| `/api/otp/verify` | OTP verification |
| `/api/auth/reset-password` | Password reset |

**Header Navigation (Guest):**
```
┌──────────────────────────────────────────────────────────────────┐
│  SitesBD Dashboard                              [Login] [Register] │
└──────────────────────────────────────────────────────────────────┘
```

**Header Navigation (Authenticated User):**
```
┌──────────────────────────────────────────────────────────────────┐
│  SitesBD Dashboard                         [Dashboard] [Profile] [Logout] │
└──────────────────────────────────────────────────────────────────┘
```

**Middleware Rules:**
1. Unauthenticated user accessing protected route → Redirect to `/login`
2. Authenticated user accessing `/login` or `/register` → Redirect to `/dashboard`
3. Authenticated user with incomplete profile → Redirect to `/onboarding`
4. Profile complete + accessing `/onboarding` → Redirect to `/dashboard`

---

### 4.3 Admin Subdomain (admin.sitesbd.com)

**Purpose:** Admin application - user management, system administration.

**Discovery:** HIDDEN - NOT publicly indexed, no links from marketing or dashboard.

**Discovery Mechanism:**
1. Admin user logs in at `dashboard.sitesbd.com`
2. Admin navigates to admin panel via authenticated menu
3. Admin is redirected to `admin.sitesbd.com/dashboard`

**CRITICAL SECURITY REQUIREMENT:**
- Direct URL access to `admin.sitesbd.com` (any page except `/login`) must return **404 Not Found**
- The admin subdomain must not be discoverable through:
  - Search engine indexing
  - Marketing site links
  - Dashboard site links
  - External references
  - Direct URL guessing

**Required Pages:**

| Route | Purpose | Auth Required | Role Required |
|-------|---------|---------------|---------------|
| `/login` | Admin login | NO | NONE |
| `/dashboard` | Admin dashboard | YES | admin, super_admin, system_owner |
| `/users` | User management | YES | admin, super_admin, system_owner |
| `/settings` | Admin settings | YES | admin, super_admin, system_owner |

**Allowed Roles:**
- `admin`
- `super_admin`
- `system_owner`

**Rejected Roles (403 Forbidden):**
- `user` (regular users)
- Any other role

**Header Navigation (Admin - Authenticated):**
```
┌──────────────────────────────────────────────────────────────────────┐
│  SitesBD Admin Dashboard                    [Dashboard] [Admin Panel] [Profile] [Logout] │
└──────────────────────────────────────────────────────────────────────┘
```

**Admin Panel Dropdown:**
```
[Admin Panel] ▼
  ├── Admin Dashboard
  ├── User Management
  ├── System Settings
  └── (role-specific items)
```

**Middleware Rules:**
1. Direct visit to `/` → Redirect to `/dashboard` (if authenticated) or `/login` (if not)
2. Direct visit to any route except `/login` without auth → 404
3. `/login` without auth → Show login form
4. `/login` with authenticated session → Redirect to `/dashboard`
5. Authenticated + valid role → Allow access
6. Authenticated + invalid role → 403 Forbidden

**404 Response for Direct Access:**
```json
{
  "error": "Not Found",
  "message": "This page could not be found."
}
```

---

## 5. ROLE-AWARE NAVIGATION ARCHITECTURE

### 5.1 Role Definitions

| Role | Access Level | Admin Panel Access |
|------|--------------|-------------------|
| `user` | Dashboard app only | NO |
| `admin` | Dashboard app + Admin dashboard | YES (limited) |
| `super_admin` | Dashboard app + Admin dashboard | YES (full) |
| `system_owner` | Dashboard app + Admin dashboard | YES (full) |

### 5.2 Navigation Matrix

| Navigation Item | Guest | User | Admin | Super Admin | System Owner |
|-----------------|-------|------|-------|-------------|--------------|
| **Marketing Header** |
| Logo | ✓ | ✓ | ✓ | ✓ | ✓ |
| Features | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pricing | ✓ | ✓ | ✓ | ✓ | ✓ |
| About | ✓ | ✓ | ✓ | ✓ | ✓ |
| Login | ✓ (guest only) | ✗ | ✗ | ✗ | ✗ |
| Register | ✓ (guest only) | ✗ | ✗ | ✗ | ✗ |
| Dashboard | ✗ | ✓ | ✓ | ✓ | ✓ |
| Profile | ✗ | ✓ | ✓ | ✓ | ✓ |
| Admin Panel | ✗ | ✗ | ✓ | ✓ | ✓ |
| Logout | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Dashboard Header** |
| Logo | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboard | ✗ | ✓ | ✓ | ✓ | ✓ |
| Profile | ✗ | ✓ | ✓ | ✓ | ✓ |
| Settings | ✗ | ✓ | ✓ | ✓ | ✓ |
| Admin Panel | ✗ | ✗ | ✓ | ✓ | ✓ |
| Logout | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Admin Header** |
| Logo | ✗ | ✗ | ✓ | ✓ | ✓ |
| Dashboard | ✗ | ✗ | ✓ | ✓ | ✓ |
| User Management | ✗ | ✗ | ✓ | ✓ | ✓ |
| Settings | ✗ | ✗ | ✓ | ✓ | ✓ |
| Profile | ✗ | ✗ | ✓ | ✓ | ✓ |
| Logout | ✗ | ✗ | ✓ | ✓ | ✓ |

### 5.3 Role-Specific Views

**User View (role: user):**
- Marketing: Full access, header shows Dashboard/Profile/Logout
- Dashboard: Full user app access
- Admin: NO ACCESS (404 or redirect)

**Admin View (role: admin):**
- Marketing: Full access, header shows Dashboard/Profile/Admin Panel/Logout
- Dashboard: Full user app access
- Admin: Limited admin access (see permissions matrix)

**Super Admin / System Owner View:**
- Marketing: Full access, header shows Dashboard/Profile/Admin Panel/Logout
- Dashboard: Full user app access
- Admin: Full admin access

### 5.4 Admin Role Permissions

| Feature | Admin | Super Admin | System Owner |
|---------|-------|-------------|--------------|
| View Dashboard | ✓ | ✓ | ✓ |
| Manage Users | ✓ | ✓ | ✓ |
| Delete Users | ✗ | ✓ | ✓ |
| View Audit Logs | ✓ | ✓ | ✓ |
| Manage Admins | ✗ | ✓ | ✓ |
| System Settings | ✗ | ✓ | ✓ |
| Billing Access | ✗ | ✗ | ✓ |
| Delete Account | ✗ | ✗ | ✓ |

---

## 6. SESSION ARCHITECTURE

### 6.1 Cookie Configuration

**Domain:** `.sitesbd.com` (with leading dot)

This enables session sharing across:
- `www.sitesbd.com`
- `dashboard.sitesbd.com`
- `admin.sitesbd.com`

**Cookie Settings:**
```typescript
const sessionCookieOptions = {
  httpOnly: true,
  secure: true,                    // HTTPS only in production
  sameSite: 'lax' as const,        // CSRF protection
  path: '/',
  domain: '.sitesbd.com',         // Cross-subdomain sharing
  maxAge: 60 * 60 * 24 * 7,       // 1 week
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  domain: '.sitesbd.com',
  maxAge: 60 * 60 * 24 * 30,     // 30 days
  // Note: httpOnly: true allows server-side refresh
};
```

### 6.2 Session Flow

```
User Action                          Session Behavior
─────────────────────────────────────────────────────────────────
1. Login at dashboard.sitesbd.com
   → Set cookies with domain: .sitesbd.com
   → User can access www.sitesbd.com (authenticated header)
   → User can access admin.sitesbd.com/login (role check)

2. Visit www.sitesbd.com
   → Read session cookie (domain: .sitesbd.com)
   → Show authenticated header with Dashboard/Profile/Logout

3. Visit admin.sitesbd.com/dashboard
   → Read session cookie
   → Verify role (admin/super_admin/system_owner only)
   → Allow or deny access

4. Logout from any subdomain
   → Clear session cookies
   → Redirect to appropriate page
   → All subdomains now show guest header
```

### 6.3 Session Verification

Each subdomain verifies session by:
1. Reading `sb-access-token` cookie
2. Calling Supabase `/auth/v1/user` endpoint
3. Returning user object or null

**Admin-specific verification:**
1. Reading `sb-access-token` cookie
2. Calling Supabase `/auth/v1/user` endpoint
3. Fetching profile for role
4. Checking role against allowed roles
5. Returning result or 403

---

## 7. USER JOURNEY DIAGRAMS

### 7.1 Guest User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     GUEST USER JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘

START: Guest visits marketing site
  │
  ▼
┌─────────────────────┐
│  www.sitesbd.com    │
│  (Marketing Site)   │
│                     │
│  Header: Login,     │
│  Register           │
└─────────────────────┘
  │
  ├──► EXPLORE CONTENT
  │     - View features
  │     - Read pricing
  │     - Learn about product
  │
  └──► DECIDE TO SIGN UP
        │
        ▼
┌─────────────────────────────┐
│  Click "Register"          │
│  → dashboard.sitesbd.com/  │
│    register                │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Registration Flow         │
│  1. Enter email            │
│  2. Verify OTP             │
│  3. Set password           │
│  4. Account created        │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Redirect to Onboarding     │
│  dashboard.sitesbd.com/    │
│  onboarding                │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Complete Profile          │
│  - Full name               │
│  - Phone                   │
│  - Address                 │
│  - Customer ID             │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Redirect to Dashboard     │
│  dashboard.sitesbd.com/    │
│  dashboard                 │
└─────────────────────────────┘
        │
        ▼
        ════════════════════
              USER STATE
        ════════════════════

END: Authenticated user with full profile
     Can access: Dashboard, Profile, Settings
     Header shows: Dashboard, Profile, Logout
```

### 7.2 Registered User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                   REGISTERED USER JOURNEY                        │
└─────────────────────────────────────────────────────────────────┘

START: Registered user (returning visitor)
  │
  ▼
┌─────────────────────┐
│  www.sitesbd.com    │
│  (Marketing Site)   │
│                     │
│  Header: Dashboard, │
│  Profile, Logout    │
│  (Authenticated)    │
└─────────────────────┘
  │
  ├──► ACCESS DASHBOARD
  │     │
  │     ▼
  │  ┌─────────────────────────────┐
  │  │  dashboard.sitesbd.com/     │
  │  │  dashboard                  │
  │  │                             │
  │  │  Dashboard showing:         │
  │  │  - Recent activity          │
  │  │  - Quick actions            │
  │  │  - Account status           │
  │  └─────────────────────────────┘
  │     │
  │     ├──► MANAGE PROFILE
  │     │     └─ dashboard.sitesbd.com/profile
  │     │
  │     └──► UPDATE SETTINGS
  │           └─ dashboard.sitesbd.com/settings
  │
  ├──► LOGOUT
  │     │
  │     ▼
  │  ┌─────────────────────────────┐
  │  │  POST /api/auth/logout      │
  │  │  Clear session cookies      │
  │  │  Redirect to marketing site │
  │  │  Header now: Login, Register│
  │  └─────────────────────────────┘
  │
  └──► TRY ADMIN ACCESS
        │
        ▼
      ┌─────────────────────────────┐
      │  admin.sitesbd.com/dashboard │
      │                             │
      │  Result: 403 FORBIDDEN       │
      │  "Admin access required"    │
      └─────────────────────────────┘

END: User has full access to dashboard app
     Admin subdomain returns 403
```

### 7.3 Admin User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

START: Admin user (system_owner/super_admin/admin)
  │
  ▼
┌─────────────────────┐
│  www.sitesbd.com    │
│  (Marketing Site)   │
│                     │
│  Header: Dashboard, │
│  Profile, Admin     │
│  Panel, Logout      │
└─────────────────────┘
  │
  ├──► ACCESS DASHBOARD
  │     │
  │     ▼
  │  dashboard.sitesbd.com/dashboard
  │  (Standard user dashboard)
  │
  ├──► ACCESS ADMIN PANEL
  │     │
  │     ▼
  │  ┌─────────────────────────────┐
  │  │  Click "Admin Panel"        │
  │  │  Header dropdown            │
  │  │  Select "Admin Dashboard"   │
  │  └─────────────────────────────┘
  │     │
  │     ▼
  │  ┌─────────────────────────────┐
  │  │  Verify: Authenticated       │
  │  │  Verify: Has admin role      │
  │  │  Redirect to:               │
  │  │  admin.sitesbd.com/dashboard │
  │  └─────────────────────────────┘
  │     │
  │     ▼
  │  ┌─────────────────────────────┐
  │  │  admin.sitesbd.com/dashboard│
  │  │                             │
  │  │  Admin Dashboard showing:   │
  │  │  - System overview          │
  │  │  - User statistics         │
  │  │  - Recent admin actions     │
  │  │  - Quick admin links        │
  │  └─────────────────────────────┘
  │     │
  │     ├──► USER MANAGEMENT
  │     │     └─ admin.sitesbd.com/users
  │     │
  │     ├──► ADMIN SETTINGS
  │     │     └─ admin.sitesbd.com/settings
  │     │
  │     └──► BACK TO DASHBOARD
  │           └─ dashboard.sitesbd.com/dashboard
  │
  └──► DIRECT ADMIN URL ACCESS
        │
        ▼
      ┌─────────────────────────────┐
      │  admin.sitesbd.com/         │
      │  (no session)               │
      │                             │
      │  Result: 404 NOT FOUND       │
      │  "This page could not be     │
      │   found."                   │
      └─────────────────────────────┘

END: Admin has full access to:
     - User dashboard (dashboard.sitesbd.com)
     - Admin dashboard (admin.sitesbd.com)
     - All admin features based on role
```

### 7.4 Failed Authentication Journey

```
┌─────────────────────────────────────────────────────────────────┐
│              FAILED AUTHENTICATION JOURNEY                       │
└─────────────────────────────────────────────────────────────────┘

SCENARIO: Regular user tries to access admin subdomain
  │
  ▼
┌─────────────────────────────────────┐
│  User is logged in as "user" role   │
│  Session cookies set                │
│  (domain: .sitesbd.com)             │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  User navigates to:                 │
│  admin.sitesbd.com/dashboard        │
│  (Direct URL access)                │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  Middleware check:                  │
│  1. Is authenticated? → YES         │
│  2. Has admin role? → NO           │
│     (role: "user")                  │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  Response: 403 FORBIDDEN            │
│                                     │
│  {                                  │
│    "error": "Forbidden",            │
│    "message": "Admin access         │
│     required."                      │
│  }                                  │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  User remains on dashboard          │
│  dashboard.sitesbd.com/dashboard   │
│                                     │
│  Admin subdomain: UNAUTHORIZED     │
└─────────────────────────────────────┘

ALTERNATIVE SCENARIO: No session, accessing admin directly
  │
  ▼
┌─────────────────────────────────────┐
│  Guest visits:                      │
│  admin.sitesbd.com/dashboard        │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  Middleware check:                  │
│  1. Is authenticated? → NO          │
│  2. Route is /login? → NO           │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  Response: 404 NOT FOUND            │
│                                     │
│  {                                  │
│    "error": "Not Found",            │
│    "message": "This page could      │
│     not be found."                  │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 8. SESSION SHARING ARCHITECTURE

### 8.1 Cookie Domain Strategy

```
Cookie: sb-access-token
Domain: .sitesbd.com

Scope:
┌────────────────────────────────────────────────────────────┐
│  .sitesbd.com (parent domain - invisible to users)         │
├─────────────┬─────────────────────┬────────────────────────┤
│             │                     │                        │
│  www.       │  dashboard.         │  admin.                │
│  sitesbd    │  sitesbd           │  sitesbd               │
│  .com       │  .com              │  .com                  │
│             │                     │                        │
│  ✓ READS    │  ✓ READS           │  ✓ READS               │
│  ✓ WRITES   │  ✓ WRITES          │  ✓ WRITES              │
│             │                     │                        │
│  Marketing  │  User App          │  Admin App             │
└─────────────┴─────────────────────┴────────────────────────┘
```

### 8.2 Session State Across Subdomains

| Action | www.sitesbd.com | dashboard.sitesbd.com | admin.sitesbd.com |
|--------|-----------------|----------------------|-------------------|
| Login at dashboard | ✓ Authenticated | ✓ Authenticated | Awaiting role check |
| Visit marketing | ✓ Auth header | - | - |
| Access dashboard | - | ✓ Access granted | - |
| Access admin (admin) | - | - | ✓ Access granted |
| Access admin (user) | - | - | ✗ 403 Forbidden |
| Logout from any | ✗ Guest | ✗ Guest | ✗ Guest |

---

## 9. IMPLEMENTATION REQUIREMENTS

### 9.1 Cookie Configuration (All Auth Routes)

Every authentication API route must set cookies with the correct domain:

```typescript
// apps/dashboard/src/app/api/auth/login/route.ts
// apps/dashboard/src/app/api/auth/register/create-account/route.ts
// apps/dashboard/src/app/api/auth/logout/route.ts
// apps/admin/src/app/api/auth/login/route.ts
// apps/admin/src/app/api/auth/logout/route.ts

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: '.sitesbd.com',  // CRITICAL: cross-subdomain sharing
  maxAge: 60 * 60 * 24 * 7,
};
```

### 9.2 Middleware Requirements

**Dashboard Middleware (apps/dashboard/src/middleware.ts):**
```typescript
// Rules:
// 1. Unauthenticated → /login
// 2. Authenticated + /login or /register → /dashboard
// 3. Authenticated + incomplete profile → /onboarding
// 4. Authenticated + complete profile → Continue
```

**Admin Middleware (apps/admin/src/middleware.ts):**
```typescript
// Rules:
// 1. /login route → Continue (public)
// 2. No session + not /login → 404
// 3. Session + no admin role → 403
// 4. Session + admin role → Continue
// 5. Any direct access to non-login → 404 (if no session)
```

### 9.3 Header Component Requirements

**Marketing Header:**
- Check `sb-access-token` cookie
- If present: Show Dashboard, Profile, Admin Panel (if admin), Logout
- If absent: Show Login, Register

**Dashboard Header:**
- Check `sb-access-token` cookie
- If present: Show Dashboard, Profile, Admin Panel (if admin), Logout
- If absent: Show Login, Register

**Admin Header:**
- Check `sb-access-token` cookie
- Profile must have admin role
- Show Dashboard, User Management, Settings, Profile, Logout

### 9.4 Vercel Configuration

Each app must be configured as a separate Vercel project:

| Project | Domain | App Directory |
|---------|--------|---------------|
| sitesbd-web | www.sitesbd.com | apps/web |
| sitesbd-dashboard | dashboard.sitesbd.com | apps/dashboard |
| sitesbd-admin | admin.sitesbd.com | apps/admin |

### 9.5 DNS Configuration

```
Type    Name    Value
─────────────────────────────────
A       @       [Vercel IP]
CNAME   www     [Vercel CDN]
CNAME   dashboard [Vercel CDN]
CNAME   admin   [Vercel CDN]
```

---

## 10. FILE STRUCTURE (TARGET STATE)

### 10.1 Web App (Marketing)

```
apps/web/src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── about/page.tsx              # About page
│   ├── pricing/page.tsx            # Pricing page
│   ├── features/page.tsx           # Features page
│   ├── contact/page.tsx            # Contact page
│   ├── blog/page.tsx               # Blog (optional)
│   ├── terms/page.tsx              # Terms of service
│   ├── privacy/page.tsx            # Privacy policy
│   └── layout.tsx                  # Marketing layout with header
├── components/
│   ├── marketing-header.tsx        # Dynamic header (auth-aware)
│   └── marketing-footer.tsx
└── middleware.ts                   # Optional: Redirect auth pages
```

**Note:** All auth-related folders must be REMOVED from web app:
- `(auth)` - DELETE
- `(onboarding)` - DELETE
- `(profile)` - DELETE
- `api/auth` - DELETE
- `api/otp` - DELETE

### 10.2 Dashboard App (User Application)

```
apps/dashboard/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   ├── register/
│   │   │   ├── page.tsx            # Registration step 1
│   │   │   ├── verify-otp/page.tsx # Registration step 2
│   │   │   └── set-password/page.tsx # Registration step 3
│   │   └── forgot-password/
│   │       ├── page.tsx            # Forgot password
│   │       ├── verify-otp/page.tsx # Verify OTP
│   │       └── set-password/page.tsx # Reset password
│   ├── (protected)/
│   │   ├── dashboard/page.tsx      # User dashboard
│   │   ├── profile/page.tsx       # User profile
│   │   └── settings/page.tsx      # User settings
│   ├── onboarding/page.tsx         # Profile completion
│   ├── api/auth/
│   │   ├── login/route.ts          # Login handler
│   │   ├── logout/route.ts         # Logout handler
│   │   └── register/
│   │       └── create-account/route.ts # Account creation
│   ├── api/otp/
│   │   ├── generate/route.ts       # OTP generation
│   │   └── verify/route.ts         # OTP verification
│   └── layout.tsx                  # Dashboard layout with header
├── middleware.ts                    # User auth middleware
└── package.json
```

### 10.3 Admin App (Admin Application)

```
apps/admin/src/
├── app/
│   ├── login/page.tsx              # Admin login (ONLY public page)
│   ├── dashboard/page.tsx          # Admin dashboard
│   ├── users/page.tsx             # User management
│   ├── settings/page.tsx           # Admin settings
│   ├── api/auth/
│   │   ├── login/route.ts          # Admin login handler
│   │   └── logout/route.ts         # Admin logout handler
│   └── layout.tsx                  # Admin layout with header
├── middleware.ts                   # Admin auth + role middleware
└── package.json
```

**Critical:** The admin app has NO auth pages except `/login`. All other routes require authentication and admin role.

---

## 11. MIGRATION CHECKLIST

### Phase 1: Dashboard App (Priority: HIGH)

- [ ] Move auth pages from web to dashboard
- [ ] Move onboarding pages from web to dashboard
- [ ] Move profile pages from web to dashboard
- [ ] Move auth API routes from web to dashboard
- [ ] Move OTP API routes from web to dashboard
- [ ] Add cookie domain: .sitesbd.com to all auth routes
- [ ] Create dashboard middleware
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test session persistence

### Phase 2: Admin App (Priority: HIGH)

- [ ] Create admin login page
- [ ] Create admin API routes
- [ ] Create admin middleware (404 for direct access)
- [ ] Create admin dashboard pages
- [ ] Add cookie domain: .sitesbd.com
- [ ] Test admin isolation
- [ ] Test role-based access

### Phase 3: Marketing Cleanup (Priority: MEDIUM)

- [ ] Remove auth folders from web app
- [ ] Update marketing header to dynamic
- [ ] Add links to dashboard subdomain
- [ ] Test authenticated header state
- [ ] Remove auth API routes from web app

### Phase 4: Vercel Configuration (Priority: HIGH)

- [ ] Configure www.sitesbd.com → web app
- [ ] Configure dashboard.sitesbd.com → dashboard app
- [ ] Configure admin.sitesbd.com → admin app
- [ ] Update environment variables per app
- [ ] Configure DNS records
- [ ] Verify SSL certificates

---

## 12. SUCCESS CRITERIA

### SC-1: Marketing Isolation
- [ ] No login/register/forgot-password pages on www.sitesbd.com
- [ ] Header dynamically shows auth state
- [ ] "Login" link points to dashboard.sitesbd.com/login
- [ ] "Register" link points to dashboard.sitesbd.com/register

### SC-2: User Authentication Flow
- [ ] Registration at dashboard.sitesbd.com/register works
- [ ] OTP verification works
- [ ] Password creation works
- [ ] Session cookies set with domain: .sitesbd.com
- [ ] Onboarding redirect works
- [ ] Dashboard access works after onboarding

### SC-3: Session Sharing
- [ ] Login at dashboard.sitesbd.com creates session valid at www.sitesbd.com
- [ ] Marketing header shows authenticated state
- [ ] Logout clears session across all subdomains

### SC-4: Admin Isolation
- [ ] Direct access to admin.sitesbd.com returns 404
- [ ] admin.sitesbd.com/login is the only public route
- [ ] Admin login works for admin role users
- [ ] Non-admin role users receive 403

### SC-5: Role-Aware Navigation
- [ ] Regular user sees: Dashboard, Profile, Logout
- [ ] Admin user sees: Dashboard, Profile, Admin Panel, Logout
- [ ] Admin Panel shows correct items based on role

### SC-6: Production Readiness
- [ ] All subdomains serve correct content
- [ ] Session works across all subdomains
- [ ] 404/403 responses are correct
- [ ] No security vulnerabilities identified
- [ ] Performance acceptable

---

## 13. REFERENCE DOCUMENTS

| Document | Status | Purpose |
|----------|--------|---------|
| FINAL_PRODUCT_ARCHITECTURE.md | **ACTIVE** | This document - authoritative |
| PLATFORM_ARCHITECTURE_AUDIT.md | Reference | Initial audit findings |
| ARCHITECTURE_REFACTOR_PLAN.md | Reference | Refactor options |
| PRD_SUBDOMAIN_ARCHITECTURE.md | Superseded | Draft PRD (see this doc instead) |
| AUTH_AUDIT_REPORT.md | Reference | Authentication flow audit |
| REAL_QA_REPORT.md | Reference | QA validation report |

---

## 14. APPROVAL SIGNATURES

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | _________________ | _______ | _________ |
| Technical Lead | _________________ | _______ | _________ |
| Architect | _________________ | _______ | _________ |

---

**DOCUMENT STATUS: AUTHORITATIVE**

This document is the single source of truth for all architecture decisions. All implementation must reference this document. Any deviation requires documented approval and this document must be updated accordingly.

**Version History:**
- 1.0 (2026-06-01): Initial authoritative version

---

*End of Document*