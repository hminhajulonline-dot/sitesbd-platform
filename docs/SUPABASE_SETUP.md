# Supabase Setup Guide

This document describes the Supabase setup for the SitesBD Platform.

## Prerequisites

- Supabase account ([supabase.com](https://supabase.com))
- Supabase CLI (optional, for local development)
- Node.js 18+

## Connection Configuration

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Credentials

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy the URL, anon key, and service role key

## Database Setup

### Running Migrations

The platform includes 16 migration files in `supabase/migrations/`. Run them in order:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via SQL editor
```

### Migration Files

| Migration | Description |
|-----------|-------------|
| `00001_create_enums.sql` | Core enum types (user_role, subscription_status, etc.) |
| `00002_create_profiles.sql` | User profiles table |
| `00003_create_roles.sql` | Role definitions |
| `00004_create_domains.sql` | Domain management |
| `00005_create_dns.sql` | DNS records |
| `00006_create_billing.sql` | Billing/invoices |
| `00007_create_support.sql` | Support tickets |
| `00008_create_cms.sql` | CMS tables |
| `00009_create_settings.sql` | System settings |
| `00010_create_cloudflare.sql` | Cloudflare integration |
| `00011_create_security.sql` | Security audit logs |
| `00012_create_platform_enums.sql` | Platform enums |
| `00013_create_quick_connect.sql` | Quick connect platforms |
| `00014_create_notifications.sql` | Notifications |
| `00015_create_announcements.sql` | Announcements |
| `00016_create_auth_tables.sql` | Auth tables (sessions, devices) |

### Running Seeds

Seed files populate initial data:

```bash
# Run seeds
psql -h <host> -U <user> -d <database> -f supabase/seed/00001_seed_roles.sql
psql -h <host> -U <user> -d <database> -f supabase/seed/00002_seed_role_permissions.sql
psql -h <host> -U <user> -d <database> -f supabase/seed/00003_seed_quick_connect_platforms.sql
psql -h <host> -U <user> -d <database> -f supabase/seed/00004_seed_notification_templates.sql
```

### Seed Files

| Seed | Description | Tables Affected |
|------|-------------|-----------------|
| `00001_seed_roles.sql` | Default roles | `roles` |
| `00002_seed_role_permissions.sql` | Role permissions | `role_permissions` |
| `00003_seed_quick_connect_platforms.sql` | Quick connect platforms | `quick_connect_platforms` |
| `00004_seed_notification_templates.sql` | Notification templates | `notification_templates` |

## Authentication

### Supabase Auth Features

The platform uses Supabase Auth for:

- **Sign Up**: Email/password registration
- **Sign In**: Email/password login
- **Sign Out**: Session termination
- **Password Reset**: Email-based reset flow
- **Email Verification**: Confirmation emails

### Auth Configuration

1. Go to **Authentication** → **Settings**
2. Configure:
   - Site URL: Your production URL
   - Redirect URLs: Add development and staging URLs
   - Enable email templates as needed

### Auth Tables

| Table | Description |
|-------|-------------|
| `user_sessions` | Active user sessions |
| `user_devices` | User device information |
| `profiles` | User profile data (linked to auth.users) |

## Row Level Security (RLS)

### Authenticated Access

All tables use Supabase Auth with RLS policies:

```sql
-- Example: Enable RLS on a table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);
```

### Policy Files

RLS policies are defined in `supabase/policies/`:

- `profiles_rls.sql`
- `domains_rls.sql`
- `dns_records_rls.sql`
- `billing_rls.sql`
- etc.

## Storage

### Required Buckets

| Bucket | Public | Purpose | File Size Limit |
|--------|--------|---------|-----------------|
| `avatars` | Yes | User profile avatars | 2MB |
| `cms-assets` | Yes | CMS media assets | 10MB |
| `documents` | No | User documents | 50MB |

### Creating Buckets

```sql
-- Via Supabase Dashboard
# Go to Storage → New Bucket

-- Via SQL
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);
```

### Storage RLS Policies

See `docs/STORAGE_SETUP.md` for detailed RLS policies.

## Type Generation

### Generate Database Types

```bash
# Using Supabase CLI
supabase gen types typescript --project-id <project-id> > supabase/types/database.types.ts
```

### Custom Types

Additional types are defined in `packages/shared/src/types/`:

- `auth.types.ts` - Auth-related types
- `profile.types.ts` - Profile types
- `common.types.ts` - Shared types

## Health Checks

### Database Health

```typescript
// Using InfrastructureHealthService
import { checkDatabaseHealth } from '@sitesbd/shared/services/health';

const health = await checkDatabaseHealth();
// Returns: { status: 'healthy' | 'unhealthy', latency: number, error?: string }
```

### Auth Health

```typescript
import { checkAuthHealth } from '@sitesbd/shared/services/health';

const health = await checkAuthHealth();
```

### Storage Health

```typescript
import { checkStorageHealth } from '@sitesbd/shared/services/health';

const health = await checkStorageHealth();
```

### Full Infrastructure Check

```typescript
import { getInfrastructureHealth } from '@sitesbd/shared/services/health';

const health = await getInfrastructureHealth();
// Returns comprehensive health status of all services
```

## Troubleshooting

### Connection Issues

1. Verify environment variables are set correctly
2. Check Supabase project status at [status.supabase.com](https://status.supabase.com)
3. Verify API keys are valid

### Migration Failures

1. Check for conflicting constraints
2. Verify table doesn't already exist
3. Run migrations in order (check timestamps)

### Auth Issues

1. Verify email templates are configured
2. Check redirect URLs in Supabase settings
3. Ensure site URL is correct

### RLS Policy Errors

1. Test policies with `auth.uid()` in SQL editor
2. Check role permissions are correct
3. Verify service role key is used for admin operations

## API Reference

### Supabase Client Usage

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Query example
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId);
```

### Server-side Operations

```typescript
// Use service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

## Environment-Specific Setup

### Development

1. Create local Supabase project or use existing
2. Run all migrations
3. Run seed files
4. Set environment variables

### Production

1. Create production Supabase project
2. Run migrations (consider using migration files)
3. Run seed files
4. Configure environment variables in Vercel
5. Enable all auth providers
6. Set up storage buckets

## Related Documentation

- [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)
- [STORAGE_SETUP.md](./STORAGE_SETUP.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)