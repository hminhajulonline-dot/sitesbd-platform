# ARCHITECTURE REFACTOR PLAN

**Date:** 2026-06-01  
**Status:** DRAFT  
**Reference:** PLATFORM_ARCHITECTURE_AUDIT.md  
**Goal:** Production-grade SaaS architecture

---

## EXECUTIVE SUMMARY

Based on the Platform Architecture Audit, this document outlines the refactoring plan to achieve a production-grade multi-subdomain SaaS architecture. **Two implementation paths are provided:** Quick Fix (Option A) for faster MVP, and Full Refactor (Option B) for production scale.

---

## PROBLEM STATEMENT

### Current Issues (from Audit)

| # | Issue | Severity | Blocking |
|---|-------|----------|----------|
| 1 | Dashboard app is empty stub | CRITICAL | Cannot deploy dashboard.esite.top |
| 2 | Admin app is empty stub | CRITICAL | Cannot deploy admin.esite.top |
| 3 | Cookies not shared across subdomains | CRITICAL | Session breaks on subdomain change |
| 4 | No subdomain routing configuration | HIGH | Cannot serve correct content |
| 5 | No middleware in dashboard/admin | HIGH | No auth protection |
| 6 | Supabase session not cross-subdomain | MEDIUM | User must re-login per subdomain |

---

## OPTION A: QUICK FIX (Single App with Subdirectory)

**Approach:** Keep single web app, configure subdomain routing, fix cookies.

**Timeline:** 1-2 sprints  
**Complexity:** Medium  
**Risk:** Low  

### Architecture

```
www.esite.top           → Web app root (marketing)
www.esite.top/login     → Auth pages
www.esite.top/register  → Registration
dashboard.esite.top     → Rewrites to /dashboard/*
dashboard.esite.top/onboarding → /onboarding/*
admin.esite.top         → Rewrites to /admin/*
```

### Implementation Steps

#### Step A-1: Fix Cross-Subdomain Cookies

**Files to modify:**

| File | Change |
|------|--------|
| `apps/web/src/app/api/auth/login/route.ts` | Add `domain: '.esite.top'` to cookie options |
| `apps/web/src/app/api/auth/register/create-account/route.ts` | Add `domain: '.esite.top'` to cookie options |
| `apps/web/src/app/api/auth/logout/route.ts` | Add `domain: '.esite.top'` to cookie options |

**Changes:**

```typescript
// Before
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

// After
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: '.esite.top',  // NEW: Share across all subdomains
  maxAge: 60 * 60 * 24 * 7,
};
```

#### Step A-2: Configure Vercel Subdomain Routing

**Create/Modify:** `vercel.json` at root

```json
{
  "version": 2,
  "routes": [
    { "src": "/", "dest": "/", "status": 200 },
    { "src": "/login", "dest": "/login", "status": 200 },
    { "src": "/register/(.*)", "dest": "/register/$1", "status": 200 }
  ],
  "rewrites": [
    { "source": "/dashboard/:path*", "destination": "/dashboard/:path*" },
    { "source": "/admin/:path*", "destination": "/admin/:path*" }
  ]
}
```

**Or use Next.js config:**

```javascript
// apps/web/next.config.mjs
const nextConfig = {
  transpilePackages: ['@sitesbd/shared', '@sitesbd/ui', '@sitesbd/auth'],
  async rewrites() {
    return [
      // subdomain-based routing can be added here
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};
```

#### Step A-3: Implement Dashboard Pages (Optional)

Since dashboard app is empty, implement pages in web app:

```
apps/web/src/app/
├── (auth)/
│   └── ... (existing)
├── dashboard/          # NEW: User dashboard pages
│   ├── page.tsx
│   ├── settings/
│   └── ...
├── admin/              # NEW: Admin dashboard
│   ├── page.tsx
│   ├── users/
│   └── ...
└── ... (existing)
```

#### Step A-4: Update Middleware for Subdomain Awareness

```typescript
// apps/web/src/middleware.ts

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Route based on subdomain
  if (subdomain === 'admin') {
    // Admin subdomain logic
    return handleAdminRoute(request);
  }
  
  if (subdomain === 'dashboard') {
    // Dashboard subdomain logic  
    return handleDashboardRoute(request);
  }
  
  // www subdomain - marketing and auth
  return handleMainRoute(request);
}
```

### Option A Deliverables

| Deliverable | Status |
|-------------|--------|
| Cross-subdomain cookies configured | Pending |
| Subdomain routing in Vercel | Pending |
| Dashboard pages implemented | Pending |
| Admin pages implemented | Pending |
| Middleware subdomain-aware | Pending |

---

## OPTION B: FULL REFACTOR (Multiple Apps)

**Approach:** Deploy separate apps per subdomain, shared session via Supabase SSR.

**Timeline:** 3-4 sprints  
**Complexity:** High  
**Risk:** Medium  

### Architecture

```
www.esite.top       → web app (marketing only)
dashboard.esite.top → dashboard app (user)
admin.esite.top    → admin app (admin)
```

### Implementation Steps

#### Step B-1: Implement Supabase Server-Side Rendering (SSR)

**Why:** Browser localStorage is origin-scoped. Supabase SSR uses HTTP-only cookies that can be shared.

**Implementation:**

```typescript
// Create Supabase client for Server Components
import { createServerClient } from '@supabase/ssr';

export function createClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );
}
```

**Resources:**
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js App Router Auth Pattern](https://supabase.com/docs/guides/auth/auth-helpers/nextjs-app-router)

#### Step B-2: Implement Auth in Each App

**apps/web/ (www.esite.top):**
- Marketing pages
- Auth pages (login, register, forgot-password)
- Onboarding flow

**apps/dashboard/ (dashboard.esite.top):**
- User dashboard pages
- Profile settings
- Protected routes with middleware

**apps/admin/ (admin.esite.top):**
- Admin dashboard
- User management
- Admin-only routes with role check

#### Step B-3: Configure Cookie Domain

```typescript
// In each app's auth routes
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  domain: '.esite.top',  // Shared across all subdomains
  maxAge: 60 * 60 * 24 * 7,
};
```

#### Step B-4: Add Middleware to Dashboard and Admin Apps

**apps/dashboard/src/middleware.ts:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value;
  
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify session with Supabase
  // ...
  
  return NextResponse.next();
}
```

**apps/admin/src/middleware.ts:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value;
  
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check admin role
  const isAdmin = await checkAdminRole(accessToken);
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.next();
}
```

#### Step B-5: Configure Vercel Deployment

**vercel.json:**
```json
{
  "projects": [
    { "name": "web", "src": "apps/web" },
    { "name": "dashboard", "src": "apps/dashboard" },
    { "name": "admin", "src": "apps/admin" }
  ]
}
```

**Or use Vercel CLI with monorepo support:**

```bash
vercel --prod --token $VERCEL_TOKEN
# Configure domains in Vercel dashboard:
# - web.esite.top → web app
# - dashboard.esite.top → dashboard app
# - admin.esite.top → admin app
```

### Option B Deliverables

| Deliverable | Status |
|-------------|--------|
| Supabase SSR implemented | Pending |
| Web app: marketing + auth | Pending |
| Dashboard app: user dashboard | Pending |
| Admin app: admin dashboard | Pending |
| Shared session cookies | Pending |
| Per-app middleware | Pending |

---

## DECISION MATRIX

| Factor | Option A (Quick Fix) | Option B (Full Refactor) |
|--------|---------------------|-------------------------|
| Timeline | 1-2 sprints | 3-4 sprints |
| Complexity | Medium | High |
| Risk | Low | Medium |
| Scalability | Limited | Production-grade |
| User Experience | Slight SEO issues (subdirectories) | Clean subdomain separation |
| Maintainability | Single codebase | Multiple codebases |
| Cost | 1 Vercel deployment | 3 Vercel deployments |

---

## RECOMMENDED APPROACH

**For MVP:** Use Option A (Quick Fix)
- Faster to deploy
- Lower risk
- Can iterate to Option B later

**For Production:** Use Option B (Full Refactor)
- Clean separation of concerns
- Better security isolation
- Scalable architecture

---

## IMPLEMENTATION PRIORITY

### Phase 1: Critical (Must Fix)

1. **Add domain to cookies** - Single line change per file
   - `apps/web/src/app/api/auth/login/route.ts`
   - `apps/web/src/app/api/auth/register/create-account/route.ts`
   - `apps/web/src/app/api/auth/logout/route.ts`

2. **Test subdomain cookie sharing** - Manual verification

### Phase 2: Important (Should Fix)

3. **Implement dashboard pages** in web app OR implement dashboard app
4. **Implement admin pages** in web app OR implement admin app
5. **Configure Vercel subdomain routing**

### Phase 3: Enhancement (Nice to Have)

6. **Implement Supabase SSR** for better security
7. **Add subdomain-aware middleware**
8. **Implement separate apps for scaling**

---

## FILE CHECKLIST

### For Cookie Fix (Option A & B)

| File | Line | Change |
|------|------|--------|
| `apps/web/src/app/api/auth/login/route.ts` | ~85 | Add `domain: '.esite.top'` |
| `apps/web/src/app/api/auth/register/create-account/route.ts` | ~348 | Add `domain: '.esite.top'` |
| `apps/web/src/app/api/auth/logout/route.ts` | ~17 | Add `domain: '.esite.top'` |

### For Dashboard App Implementation (Option B)

| File | Action |
|------|--------|
| `apps/dashboard/src/app/page.tsx` | Replace with dashboard UI |
| `apps/dashboard/src/middleware.ts` | Create with auth check |
| `apps/dashboard/src/app/api/auth/login/route.ts` | Create OR share from web |
| `apps/dashboard/src/app/api/auth/logout/route.ts` | Create OR share from web |

### For Admin App Implementation (Option B)

| File | Action |
|------|--------|
| `apps/admin/src/app/page.tsx` | Replace with admin UI |
| `apps/admin/src/middleware.ts` | Create with admin role check |
| `apps/admin/src/app/api/auth/login/route.ts` | Create OR share from web |

---

## RISK ASSESSMENT

### Option A Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cookie domain not working | Medium | High | Test in staging first |
| SEO issues with subdomain | Low | Medium | Use canonical URLs |
| Single point of failure | High | Medium | Implement caching |

### Option B Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase SSR complexity | Medium | Medium | Follow official docs |
| Session sync issues | Low | High | Use refresh token |
| Multiple deployments complexity | Medium | Medium | Use Vercel monorepo |

---

## SUCCESS CRITERIA

### Phase 1 (Cookie Fix)

| Test | Expected Result |
|------|-----------------|
| Login at dashboard.esite.top | Cookie set for .esite.top |
| Navigate to admin.esite.top | Session valid, no re-login |
| Navigate to www.esite.top | Session valid, no re-login |
| Logout from any subdomain | Session cleared across all |

### Phase 2 (App Implementation)

| Test | Expected Result |
|------|-----------------|
| dashboard.esite.top/dashboard | Shows user dashboard |
| admin.esite.top/admin | Shows admin dashboard (admin only) |
| Non-admin at admin.esite.top | Returns 403 |
| Unauthenticated at dashboard | Redirects to login |

---

## NEXT STEPS

1. **Decision:** Choose Option A or Option B
2. **Approval:** Review with stakeholders
3. **Implementation:** Start with Phase 1
4. **Testing:** Verify in staging environment
5. **Deployment:** Deploy to production

---

## APPENDIX: COOKIE DOMAIN EXPLANATION

### How Cookie Domain Works

```
Cookie domain: .esite.top (with leading dot)
  ↓
Cookie available to:
  - www.esite.top ✓
  - dashboard.esite.top ✓
  - admin.esite.top ✓
  - any.esite.top ✓

Cookie domain: dashboard.esite.top (no leading dot)
  ↓
Cookie available to:
  - dashboard.esite.top ✓
  - subdomain.dashboard.esite.top ✓
  - www.dashboard.esite.top ✓
  - admin.esite.top ✗ (different subdomain)
```

### Supabase Session Cookie Requirements

```typescript
// For cross-subdomain session:
{
  name: 'sb-access-token',
  value: '<token>',
  domain: '.esite.top',  // Required for sharing
  path: '/',
  httpOnly: true,        // Security
  secure: true,          // HTTPS only
  sameSite: 'lax',       // CSRF protection
}
```

---

*Plan created based on PLATFORM_ARCHITECTURE_AUDIT.md findings.*