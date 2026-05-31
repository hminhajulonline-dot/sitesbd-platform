# Infrastructure Setup Guide

This document provides a comprehensive overview of the SitesBD Platform infrastructure and how to set it up.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Web App    │  │   Admin     │  │  Dashboard   │       │
│  │   (Next.js)  │  │   (Next.js) │  │   (Next.js)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                   ┌────────▼────────┐
                   │     Vercel     │
                   │   (Hosting)    │
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐   ┌──────▼─────┐   ┌──────▼─────┐
    │  Supabase │   │  Cloudflare │   │    SMTP    │
    │   (DB)    │   │    (DNS)     │   │  (Email)   │
    └───────────┘   └─────────────┘   └────────────┘
```

## Infrastructure Components

### 1. Supabase (Database & Auth)

**Purpose:** PostgreSQL database with built-in authentication and storage.

**Components:**
- Database: PostgreSQL with RLS policies
- Auth: Email/password authentication
- Storage: File storage for avatars, documents, CMS assets
- Realtime: WebSocket support for live updates

**Documentation:**
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [STORAGE_SETUP.md](./STORAGE_SETUP.md)

### 2. Vercel (Hosting)

**Purpose:** Deployment platform for Next.js applications.

**Apps:**
- `apps/web` - Main application
- `apps/admin` - Admin panel
- `apps/dashboard` - User dashboard

**Documentation:**
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

### 3. Cloudflare (DNS Management)

**Purpose:** Domain management and DNS configuration.

**Configuration:**
- DNS records for subdomains
- CDN and caching
- SSL/TLS certificates

**Documentation:**
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

### 4. SMTP (Email)

**Purpose:** Transactional emails (password reset, email verification).

**Providers:**
- Supabase built-in email
- Custom SMTP server (optional)

## Setup Checklist

### Phase 1: Supabase Setup

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Get API credentials
- [ ] Run database migrations
- [ ] Run seed files
- [ ] Create storage buckets
- [ ] Configure RLS policies
- [ ] Configure auth settings

### Phase 2: Environment Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Add Supabase credentials
- [ ] Add Cloudflare credentials (optional)
- [ ] Add SMTP credentials (optional)
- [ ] Validate environment variables

### Phase 3: Application Development

- [ ] Install dependencies: `npm install`
- [ ] Build application: `npm run build`
- [ ] Test locally: `npm run dev`
- [ ] Verify health checks

### Phase 4: Deployment

- [ ] Connect repository to Vercel
- [ ] Configure environment variables
- [ ] Deploy each app
- [ ] Configure custom domains
- [ ] Verify deployments

### Phase 5: Post-Deployment

- [ ] Test authentication flow
- [ ] Test storage uploads
- [ ] Verify health check endpoint
- [ ] Set up monitoring

## Infrastructure Health Service

The platform includes a comprehensive health check service:

```typescript
import { getInfrastructureHealth } from '@sitesbd/shared/services/health';

// Get full health status
const health = await getInfrastructureHealth();
// Returns: { overall, database, auth, storage, environment, timestamp, version }
```

### Health Endpoint

Access `/api/health` to get infrastructure status:

```json
{
  "overall": "healthy",
  "database": { "status": "healthy", "latency": 12, "timestamp": "..." },
  "auth": { "status": "healthy", "latency": 45, "timestamp": "..." },
  "storage": { "status": "healthy", "latency": 28, "timestamp": "..." },
  "environment": { "status": "healthy", "timestamp": "..." },
  "timestamp": "...",
  "version": "1.0.0"
}
```

### Response Codes

| Status | HTTP Code | Description |
|--------|-----------|-------------|
| healthy | 200 | All services operational |
| degraded | 200 | Some services have issues |
| unhealthy | 503 | Critical services unavailable |

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Optional

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID |
| `SMTP_HOST` | SMTP server |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |

**Full documentation:** [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

## Database Schema

The platform uses 16 migration files:

| Migration | Tables |
|-----------|--------|
| 00001-00005 | Core tables (profiles, roles, domains, dns, billing) |
| 00006-00010 | Feature tables (support, cms, settings, cloudflare, security) |
| 00011-00016 | Extended tables (platform, quick_connect, notifications, announcements, auth) |

**Full documentation:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `avatars` | User profile pictures | Yes |
| `cms-assets` | CMS media files | Yes |
| `documents` | User documents | No |

**Full documentation:** [STORAGE_SETUP.md](./STORAGE_SETUP.md)

## Deployment URLs

After deployment, configure these URLs:

| Environment | URL |
|------------|-----|
| Production Web | `https://yourdomain.com` |
| Production Admin | `https://admin.yourdomain.com` |
| Production Dashboard | `https://dashboard.yourdomain.com` |
| Health Check | `https://yourdomain.com/api/health` |

## Monitoring

### Health Check Monitoring

Set up monitoring for `/api/health` endpoint:

1. **Vercel**: Use built-in health check feature
2. **Uptime Robot**: Monitor health endpoint
3. **Datadog**: Create synthetic monitor

### Alerts

Configure alerts for:
- Health endpoint returning non-200
- Database connection failures
- Auth service downtime
- Storage bucket issues

## Troubleshooting

### Common Issues

#### Database Connection Failed

1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Check Supabase project is not paused
4. Verify IP allowlist (if configured)

#### Auth Not Working

1. Verify email templates are configured in Supabase
2. Check redirect URLs in Supabase settings
3. Ensure site URL matches deployment URL

#### Storage Upload Fails

1. Check bucket RLS policies
2. Verify file size limits
3. Check allowed MIME types
4. Ensure user is authenticated

#### Environment Variables Not Working

1. Redeploy after adding variables
2. Check for typos in variable names
3. Verify variable is set for correct environment

### Debug Mode

Enable debug logging:

```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG=true
```

Check server logs in Vercel dashboard for detailed error messages.

## Security Considerations

### Environment Variables

- Never commit real credentials to version control
- Use Vercel environment variables for production
- Rotate keys periodically

### Database Security

- Enable RLS on all tables
- Use appropriate policies for each table
- Regularly audit access patterns

### API Security

- Use rate limiting
- Implement CSRF protection
- Enable CORS appropriately

## Related Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [STORAGE_SETUP.md](./STORAGE_SETUP.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)