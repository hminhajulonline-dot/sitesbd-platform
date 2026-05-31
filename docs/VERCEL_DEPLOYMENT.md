# Vercel Deployment Guide

This document describes how to deploy the SitesBD Platform to Vercel.

## Overview

The platform consists of three Next.js applications:

| App | Directory | Purpose | Deployment |
|-----|-----------|---------|------------|
| Web | `apps/web` | Main application (auth, onboarding, dashboard) | Required |
| Admin | `apps/admin` | Admin panel | Optional |
| Dashboard | `apps/dashboard` | User dashboard | Optional |

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository connected to Vercel
- Supabase project created and configured

## Environment Variables

Configure these in Vercel Project Settings → Environment Variables:

### Required Variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | All |

### Optional Variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_APP_NAME` | SitesBD Platform | All |
| `NEXT_PUBLIC_ENVIRONMENT` | production | Production |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | Production |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID | Production |

## Web App Deployment

### 1. Import Project

1. Log in to [Vercel](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure build settings

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

### 3. Environment Variables

Add all required environment variables for each environment:

**Development:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_ENVIRONMENT=development
```

**Production:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_ENVIRONMENT=production
```

### 4. Deploy

Click "Deploy" to trigger the first deployment.

## Admin App Deployment

### 1. Create New Project

1. In Vercel, create a new project
2. Import the same repository
3. Set Root Directory to `apps/admin`

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/admin` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

### 3. Environment Variables

Add Supabase variables (can be shared):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Domain Configuration

Configure a subdomain for admin (optional):
- Production: `admin.yourdomain.com`
- Preview: `admin-staging.vercel.app`

## Dashboard App Deployment

### 1. Create New Project

1. In Vercel, create a new project
2. Import the same repository
3. Set Root Directory to `apps/dashboard`

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/dashboard` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

### 3. Environment Variables

Add Supabase variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Domain Configuration

Configure a subdomain for dashboard (optional):
- Production: `dashboard.yourdomain.com`
- Preview: `dashboard-staging.vercel.app`

## monorepo Configuration

The repository uses Turborepo for monorepo management. Vercel automatically detects the structure when the root `package.json` has workspace configuration.

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**"]
    },
    "lint": {},
    "type-check": {}
  }
}
```

### Vercel Configuration

No special Vercel configuration is needed for the monorepo. Each app is deployed as a separate project with its own root directory.

## Custom Domains

### Web App
- Production: `yourdomain.com`
- Redirect: `www.yourdomain.com` → `yourdomain.com`

### Admin App
- Production: `admin.yourdomain.com`

### Dashboard App
- Production: `dashboard.yourdomain.com`

### DNS Configuration

Add the following DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |
| CNAME | admin | cname.vercel-dns.com |
| CNAME | dashboard | cname.vercel-dns.com |

## CI/CD Pipeline

### Automatic Deployments

Vercel automatically deploys on:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Pull request → Preview deployment with comments

### Environment Promotion

1. **Preview Environment**: Auto-deploys on PR creation
2. **Production Environment**: Auto-deploys on push to `main`

### Workflow Example

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: my feature"

# 3. Push and create PR
git push -u origin feature/my-feature

# 4. Vercel creates preview deployment
# Review in Vercel dashboard

# 5. Merge PR
# Vercel deploys to production
```

## Health Check Configuration

### Vercel Health Checks

1. Go to Project Settings → Health Checks
2. Enable health check for `/api/health`
3. Set interval (recommended: 60 seconds)

### Response Expectations

The `/api/health` endpoint returns:

```json
{
  "overall": "healthy",
  "database": { "status": "healthy", "latency": 12 },
  "auth": { "status": "healthy", "latency": 45 },
  "storage": { "status": "healthy", "latency": 28 },
  "environment": { "status": "healthy" },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Build Optimization

### Environment Variables in Build

For Next.js, some variables must be available at build time:

**Available at build time:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_ENVIRONMENT`

**Available at runtime only:**
- `SUPABASE_SERVICE_ROLE_KEY` (should be runtime-only in production)

### Edge Runtime

The middleware runs on Edge Runtime. Ensure:
- No Node.js-specific APIs in middleware
- Use Web API alternatives
- Keep middleware bundle size small (<1MB)

## Troubleshooting

### Build Fails

1. Check environment variables are set
2. Verify Node.js version (18+ required)
3. Check for TypeScript errors locally
4. Review build logs in Vercel dashboard

### Environment Variables Not Working

1. Redeploy after adding variables
2. Check for typos in variable names
3. Verify variable is set for correct environment

### Deployment Stuck

1. Cancel and retry deployment
2. Check for long-running processes in build
3. Review Vercel status page

### Custom Domain Not Working

1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Check domain verification in Vercel

## Related Documentation

- [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [STORAGE_SETUP.md](./STORAGE_SETUP.md)