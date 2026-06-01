# PLATFORM ARCHITECTURE AUDIT

**Date:** 2026-06-01  
**Status:** COMPLETED  
**Branch:** feat/pr-06d-auth-architecture-stabilization  
**Commit:** f7b47d0

---

## EXECUTIVE SUMMARY

This audit examines the multi-subdomain architecture for production-grade SaaS deployment. **Critical finding:** The architecture is NOT production-ready. Only one app (web) is functional, and cross-subdomain session sharing is not implemented.

| Component | Status | Evidence |
|-----------|--------|----------|
| Web App (www.esite.top) | ✅ Operational | Full auth, OTP, middleware |
| Dashboard App | ❌ EMPTY STUB | No auth, no pages |
| Admin App | ❌ EMPTY STUB | No auth, no pages |
| Cross-subdomain cookies | ❌ NOT CONFIGURED | No domain setting |
| Subdomain routing | ❌ NOT CONFIGURED | No vercel.json |
| Shared session | ❌ NOT WORKING | Cookies scoped to single domain |

---

## CURRENT ARCHITECTURE

### Project Structure

```
sitesbd-platform/
├── apps/
│   ├── web/           # Port 3000 - Landing + Auth
│   ├── dashboard/     # Port 3001 - User Dashboard (EMPTY)
│   └── admin/         # Port 3002 - Admin Dashboard (EMPTY)
├── packages/
│   ├── ui/
│   ├── auth/
│   ├── shared/
│   └── database/
└── supabase/
    └── migrations/
```

### App Inventory

| App | Port | Pages | Auth Routes | Middleware | Status |
|-----|------|-------|-------------|------------|--------|
| web | 3000 | 15+ | 6 APIs | ✅ YES | Operational |
| dashboard | 3001 | 1 | 0 | ❌ NO | Empty Stub |
| admin | 3002 | 1 | 0 | ❌ NO | Empty Stub |

### Apps Web Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/ (email, verify-otp, set-password)
│   │   └── forgot-password/ (verify-otp, set-password)
│   ├── (onboarding)/
│   │   └── onboarding/
│   ├── (profile)/
│   │   └── setup/
│   ├── api/
│   │   ├── auth/ (login, logout, check-email, register, reset-password)
│   │   └── otp/ (generate, verify)
│   ├── page.tsx (Landing)
│   └── layout.tsx
└── middleware.ts
```

---

## SUBDOMAIN ANALYSIS

### Desired Architecture (per PRD)

| Subdomain | Purpose | App |
|-----------|---------|-----|
| www.esite.top | Marketing only, no auth | web |
| dashboard.esite.top | User auth, dashboard, onboarding | web |
| admin.esite.top | Admin auth, admin dashboard | web |

### Actual Architecture

| Subdomain | Status | Notes |
|-----------|--------|-------|
| www.esite.top | ⚠️ Partial | Points to web, but contains auth pages |
| dashboard.esite.top | ❌ Not Configured | No subdomain routing |
| admin.esite.top | ❌ Not Configured | No subdomain routing |

---

## CRITICAL FINDINGS

### FINDING #1: Dashboard and Admin Apps Are Empty Stubs

**Evidence:**
```bash
# apps/dashboard/src/app/page.tsx
export default function HomePage() {
  return <h1>SitesBD Dashboard</h1>;  // Placeholder
}

# apps/admin/src/app/page.tsx
export default function HomePage() {
  return <h1>SitesBD Admin</h1>;  // Placeholder
}
```

**No middleware in dashboard or admin:**
```bash
$ ls apps/dashboard/src/middleware.ts  # No such file
$ ls apps/admin/src/middleware.ts      # No such file
```

**Impact:** Cannot use dashboard.esite.top or admin.esite.top for their intended purposes.

---

### FINDING #2: Cross-Subdomain Cookie Sharing Not Configured

**Current Cookie Configuration:**

| File | Cookie Settings |
|------|-----------------|
| login/route.ts:85-91 | `path: '/'`, NO `domain` setting |
| create-account/route.ts:348-357 | `path: '/'`, NO `domain` setting |
| logout/route.ts:17-34 | `path: '/'`, NO `domain` setting |

**What's Missing:**
```typescript
// CURRENT (WRONG for cross-subdomain):
cookieOptions = {
  path: '/',
  // No domain setting = cookies only work on current subdomain
};

// REQUIRED for cross-subdomain:
cookieOptions = {
  path: '/',
  domain: '.esite.top',  // Cookie shared across all subdomains
  sameSite: 'lax',
};
```

**Impact:** 
- User logs in at dashboard.esite.top
- Cookie is set for dashboard.esite.top only
- Cannot access www.esite.top or admin.esite.top with same session

---

### FINDING #3: No Subdomain Routing Configuration

**Missing:**
- No `vercel.json` for routing
- No next.config.js with rewrites for subdomain routing
- No environment variable for current subdomain

**What Should Exist:**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/", "destination": "/dashboard" },
    { "source": "/admin(/.*)", "destination": "/admin$1" }
  ]
}
```

---

### FINDING #4: Supabase Session Not Available Across Subdomains

**Current Supabase Configuration:**

| Component | Setting | Impact |
|-----------|---------|--------|
| Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` | Same across all apps |
| Anon Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same across all apps |
| Session Storage | Browser localStorage | NOT shared across subdomains |

**Problem:**
- Supabase client stores session in localStorage keyed by URL
- Each subdomain has different origin = different localStorage
- User must re-authenticate for each subdomain

**Solution Required:**
1. Use Supabase's built-in cookie-based auth (SSR)
2. OR share session via custom cookie with domain setting
3. OR implement SSO across subdomains

---

### FINDING #5: Middleware Only Executes on Web App

**Evidence:**
```bash
$ cat apps/web/src/middleware.ts | head -20
# ✅ Exists with auth protection, admin check, profile check

$ cat apps/dashboard/src/middleware.ts 2>/dev/null
# ❌ No such file

$ cat apps/admin/src/middleware.ts 2>/dev/null
# ❌ No such file
```

**Impact:** 
- `/admin/*` route protection only works if requests route through web app
- Dashboard and admin have no authentication layer
- Session cannot be verified on those subdomains

---

## COOKIE ANALYSIS

### Current Cookie Flow

```
User at dashboard.esite.top
    ↓
POST /api/auth/login (handled by web app)
    ↓
Response sets cookie: sb-access-token
    ↓
Cookie is scoped to: dashboard.esite.top (not .esite.top)
    ↓
User cannot access admin.esite.top with same cookie
```

### Cookie Settings Per File

| File | Line | Settings |
|------|------|----------|
| login/route.ts | 85-91 | `path: '/'`, `sameSite: 'lax'`, `maxAge: 1 week` |
| create-account/route.ts | 348-357 | `path: '/'`, `sameSite: 'lax'`, `maxAge: 1 week` |
| logout/route.ts | 17-34 | `path: '/'`, `sameSite: 'lax'`, `maxAge: 0` |

**Missing:** `domain: '.esite.top'` on all cookie settings

---

## ROUTING ANALYSIS

### Current Routes in Web App

| Route | File | Auth Required | Admin Required |
|-------|------|---------------|----------------|
| `/` | page.tsx | ❌ No | ❌ No |
| `/login` | (auth)/login | ❌ No (guest only) | ❌ No |
| `/register/*` | (auth)/register/* | ❌ No (guest only) | ❌ No |
| `/forgot-password/*` | (auth)/forgot-password/* | ❌ No | ❌ No |
| `/onboarding` | (onboarding) | ✅ Yes | ❌ No |
| `/setup` | (profile) | ✅ Yes | ❌ No |
| `/dashboard` | (protected) | ✅ Yes | ❌ No |
| `/admin/*` | (admin) | ✅ Yes | ✅ Yes |

### Middleware Protection Logic

```typescript
// apps/web/src/middleware.ts

protectedRoutes = ['/dashboard', '/profile', '/settings'];
guestRoutes = ['/login', '/register'];
ADMIN_ROLES = ['admin', 'super_admin', 'system_owner'];

if (isAdminRoute) {
  if (!isAuthenticated) return redirect(/login);
  if (!hasAdminRole) return 403;
}
```

**Issue:** Only protects routes within web app. Does not handle subdomain routing.

---

## SESSION PERSISTENCE ANALYSIS

### Current Session Flow

```
1. User POSTs to /api/auth/login
2. Supabase validates credentials
3. Supabase returns session (access_token, refresh_token)
4. API route sets cookies (scoped to current domain)
5. Middleware reads cookies on subsequent requests
```

### Session Data Flow

```typescript
// login/route.ts
const { data: authData } = await supabase.auth.signInWithPassword({...});

// Set cookie
response.cookies.set('sb-access-token', authData.session.access_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  // MISSING: domain: '.esite.top'
});
```

### Session Verification Flow

```typescript
// middleware.ts
const accessToken = request.cookies.get('sb-access-token')?.value;

// Fetch user from Supabase
const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

**Issue:** Each subdomain runs separate Next.js instance. Cookies not shared.

---

## ROLE PROTECTION ANALYSIS

### Admin Role Check (Fixed in PR-06F)

```typescript
// middleware.ts:78-87 - CORRECT NOW
const profileResponse = await fetch(
  `${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}&select=role`,
  //                    ^ FIXED: was 'id', now 'user_id'
```

**Status:** ✅ Works within web app

**Issue:** Does not apply to admin.esite.top because admin app has no middleware.

---

## SUMMARY OF PROBLEMS

| # | Problem | Severity | Impact |
|---|---------|----------|--------|
| 1 | Dashboard app is empty stub | CRITICAL | Cannot use dashboard.esite.top |
| 2 | Admin app is empty stub | CRITICAL | Cannot use admin.esite.top |
| 3 | Cross-subdomain cookies not configured | CRITICAL | Session not shared across subdomains |
| 4 | No subdomain routing | HIGH | Cannot route to correct apps |
| 5 | No middleware in dashboard/admin | HIGH | No auth protection |
| 6 | Supabase localStorage not shared | MEDIUM | Session isolated per subdomain |

---

## CURRENT FLOW DIAGRAMS

### Authentication Flow (Single App Only)

```
dashboard.esite.top/login
    ↓
POST /api/auth/login (web app)
    ↓
Set cookie: sb-access-token (domain: dashboard.esite.top)
    ↓
Redirect to /dashboard
    ↓
Cookie available for dashboard.esite.top only ❌
```

### Admin Access Flow (Broken)

```
admin.esite.top/admin/dashboard
    ↓
No middleware (admin app empty) ❌
    ↓
Admin app doesn't have auth logic
    ↓
Cannot verify session or role ❌
```

---

## RECOMMENDED ARCHITECTURE (TARGET STATE)

### Option A: Single App with Subdirectory Routing (Recommended for MVP)

```
www.esite.top/          → / (marketing)
www.esite.top/login     → /login (auth)
www.esite.top/register   → /register (auth)
dashboard.esite.top/     → /dashboard (user app)
dashboard.esite.top/onboarding → /onboarding
admin.esite.top/         → /admin/* (admin app)
```

**Implementation:**
1. Keep single web app
2. Configure cookie domain: `.esite.top`
3. Use Next.js rewrites or Vercel routing
4. Middleware handles subdomain-based access control

### Option B: Multiple Apps with Shared Session (Production)

```
www.esite.top       → web app (marketing only)
dashboard.esite.top → dashboard app (user)
admin.esite.top     → admin app (admin)
```

**Implementation:**
1. Use Supabase SSR for cookie-based auth
2. Cookie domain: `.esite.top`
3. Each app has its own middleware
4. Shared Supabase client configuration

---

## FILES TO MODIFY FOR PRODUCTION

| File | Change Required |
|------|-----------------|
| `apps/web/src/app/api/auth/login/route.ts` | Add `domain: '.esite.top'` to cookies |
| `apps/web/src/app/api/auth/register/create-account/route.ts` | Add `domain: '.esite.top'` to cookies |
| `apps/web/src/app/api/auth/logout/route.ts` | Add `domain: '.esite.top'` to cookies |
| `apps/web/next.config.mjs` | Add subdomain routing |
| `apps/dashboard/src/` | Implement auth pages and middleware |
| `apps/admin/src/` | Implement admin pages and middleware |
| `vercel.json` | Configure subdomain routing |

---

## CONCLUSION

**Current State:** NOT PRODUCTION READY

**Minimum Viable Fixes Required:**

1. Add `domain: '.esite.top'` to all auth cookies
2. Configure subdomain routing
3. Implement dashboard and admin apps OR consolidate into single app

**Recommended Path:** Option A (Single App) for faster MVP, Option B for production scale.

---

*Audit completed by code inspection. No runtime testing performed.*