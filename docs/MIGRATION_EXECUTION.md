# Migration Execution Guide

This document describes how to run database migrations for the SitesBD Platform.

## Migration Files

The platform includes 16 migration files in `supabase/migrations/`:

| # | File | Description |
|---|------|-------------|
| 1 | `00001_create_enums.sql` | Core enum types |
| 2 | `00002_create_profiles.sql` | User profiles table |
| 3 | `00003_create_roles.sql` | Role definitions |
| 4 | `00004_create_domains.sql` | Domain management |
| 5 | `00005_create_dns.sql` | DNS records |
| 6 | `00006_create_billing.sql` | Billing/invoices |
| 7 | `00007_create_support.sql` | Support tickets |
| 8 | `00008_create_cms.sql` | CMS tables |
| 9 | `00009_create_settings.sql` | System settings |
| 10 | `00010_create_cloudflare.sql` | Cloudflare integration |
| 11 | `00011_create_security.sql` | Security audit logs |
| 12 | `00012_create_platform_enums.sql` | Platform enums |
| 13 | `00013_create_quick_connect.sql` | Quick connect platforms |
| 14 | `00014_create_notifications.sql` | Notifications |
| 15 | `00015_create_announcements.sql` | Announcements |
| 16 | `00016_create_auth_tables.sql` | Auth tables (sessions, devices) |

## Seed Files

| # | File | Description |
|---|------|-------------|
| 1 | `00001_seed_roles.sql` | Default roles |
| 2 | `00002_seed_role_permissions.sql` | Role permissions |
| 3 | `00003_seed_quick_connect_platforms.sql` | Quick connect platforms |
| 4 | `00004_seed_notification_templates.sql` | Notification templates |
| 5 | `00005_seed_storage_buckets.sql` | Storage bucket setup |

## Execution Methods

### Method 1: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations to remote
supabase db push

# Apply seeds
supabase db seed
```

### Method 2: Using psql (Direct PostgreSQL)

```bash
# Run all migrations in order
for f in supabase/migrations/*.sql; do
  psql -h <host> -U <user> -d <database> -f "$f"
done

# Run all seeds in order
for f in supabase/seed/*.sql; do
  psql -h <host> -U <user> -d <database> -f "$f"
done
```

### Method 3: Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste each migration file in order
4. Click **Run** for each migration

## Execution Order

Migrations and seeds must be executed in order:

```
migrations/00001_create_enums.sql
migrations/00002_create_profiles.sql
migrations/00003_create_roles.sql
...
migrations/00016_create_auth_tables.sql

seed/00001_seed_roles.sql
seed/00002_seed_role_permissions.sql
seed/00003_seed_quick_connect_platforms.sql
seed/00004_seed_notification_templates.sql
seed/00005_seed_storage_buckets.sql
```

## Verification

### Check Migration Status

```sql
-- Check if all migrations have been applied
SELECT * FROM schema_migrations ORDER BY version;
```

### Check Tables Created

```sql
-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `profiles`
- `roles`
- `role_permissions`
- `domains`
- `dns_records`
- `invoices`
- `support_tickets`
- `cms_posts`
- `cms_media`
- `system_settings`
- `cloudflare_configs`
- `security_audit_logs`
- `quick_connect_platforms`
- `notifications`
- `announcements`
- `user_sessions`
- `user_devices`
- `user_preferences`

### Check Storage Buckets

```sql
-- List storage buckets
SELECT * FROM storage.buckets;
```

Expected buckets:
- `avatars` (public)
- `cms-assets` (public)
- `documents` (private)

### Check RLS Policies

```sql
-- List RLS policies on storage.objects
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects';
```

## Troubleshooting

### Migration Fails with "already exists"

Some objects may already exist. Check the error message:
- Tables: Use `CREATE TABLE IF NOT EXISTS`
- Indexes: Use `CREATE INDEX IF NOT EXISTS`
- Policies: Use `DROP POLICY IF EXISTS` before creating

### Migration Fails with "relation does not exist"

Dependencies not met. Ensure earlier migrations ran successfully.

### Seed Fails with "duplicate key"

Data already exists. Use `ON CONFLICT DO NOTHING` or similar.

## Rollback

⚠️ **Not recommended in production. Back up your data first.**

```sql
-- Drop all tables (in reverse order)
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
-- ... continue in reverse order
```

## Production Checklist

Before deploying to production:

- [ ] All migrations have been applied
- [ ] All seeds have been applied
- [ ] Storage buckets are created
- [ ] RLS policies are enabled
- [ ] Database connection tested
- [ ] Health check returns healthy