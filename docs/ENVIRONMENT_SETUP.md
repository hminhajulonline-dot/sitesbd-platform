# Environment Setup Guide

This document describes the environment variables required for the SitesBD Platform infrastructure.

## Required Variables

### Supabase Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | ✅ Yes | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | ✅ Yes | `eyJhbGciOiJIUzI1...` |

**Pattern Validation**: `NEXT_PUBLIC_SUPABASE_URL` must match `^https:\/\/.*\.supabase\.co$`

**Minimum Length**: Both keys must be at least 100 characters.

### Application Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_NAME` | Application name | No | `SitesBD Platform` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment (development/staging/production) | No | `production` |

## Optional Variables

### Cloudflare (DNS Management)

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | No |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID | No |

### SMTP (Email)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SMTP_HOST` | SMTP server hostname | No | - |
| `SMTP_PORT` | SMTP server port | No | `587` |
| `SMTP_USER` | SMTP username | No | - |
| `SMTP_PASSWORD` | SMTP password | No | - |

### Secrets

| Variable | Description | Required |
|----------|-------------|----------|
| `CRON_SECRET` | Secret for cron job authentication | No |
| `API_SECRET` | Secret for API authentication | No |

## Environment Files

### .env.example

The base environment template:

```bash
# Application
NEXT_PUBLIC_APP_NAME=SitesBD Platform
NEXT_PUBLIC_ENVIRONMENT=development

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

### .env.local.example

Local development environment with additional secrets:

```bash
# Application
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_NAME=SitesBD Platform

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Secrets
CRON_SECRET=
API_SECRET=
```

## Setup Instructions

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Supabase Variables

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to Project Settings → API
3. Copy the URL, anon key, and service role key
4. Update your `.env.local` file

### 3. Validate Configuration

The application includes automatic environment validation. Access `/api/health` to see the environment status.

Expected healthy response:
```json
{
  "overall": "healthy",
  "environment": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Security Notes

⚠️ **Never commit `.env.local` or any file containing real credentials to version control.**

- The `.env.example` and `.env.local.example` files contain only placeholders
- Use environment variables or secret management in production
- Rotate keys periodically for security

## Vercel Deployment

When deploying to Vercel, configure environment variables in:

1. Project Settings → Environment Variables
2. Add each variable for each environment (Development, Preview, Production)

## Troubleshooting

### "Missing required variables" Error

Check that all required variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Invalid URL Pattern

The Supabase URL must be in the format: `https://xxxxx.supabase.co`

### Key Length Error

Both Supabase keys must be at least 100 characters. This ensures the key is valid and complete.

## Health Check Endpoint

The `/api/health` endpoint returns environment validation status:

```typescript
interface EnvironmentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  error?: string; // Only present if unhealthy
}
```

Access this endpoint to verify your environment configuration is correct.