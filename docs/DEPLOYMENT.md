# Deployment Documentation

## Overview

SitesBD Platform uses Vercel for deployment with preview environments for each pull request.

## Environments

| Environment | URL | Trigger |
|-------------|-----|---------|
| Development | localhost:3000-3002 | `npm run dev` |
| Preview | *.vercel.app | PR opened |
| Production | sites.bd, app.sites.bd, admin.sites.bd | Merge to main |

## Deployment Process

1. Developer creates a feature branch
2. Push changes to create PR
3. Vercel creates preview deployment
4. Review changes in preview
5. Merge to main for production deployment

## Environment Variables

Configure in Vercel Dashboard:
1. Go to project settings
2. Navigate to Environment Variables
3. Add each variable from `.env.example`

## Domains

Production domains configured in Vercel:
- sites.bd → web app
- app.sites.bd → dashboard app
- admin.sites.bd → admin app

## Build Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

## Monitoring

- Vercel Analytics
- Error tracking (future)
- Performance monitoring (future)
