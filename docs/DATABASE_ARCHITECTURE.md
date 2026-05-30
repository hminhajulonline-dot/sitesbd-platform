# SitesBD Platform Database Architecture

## Overview

This document describes the database architecture for the SitesBD Platform, a domain management and DNS service built on PostgreSQL with Supabase.

## Technology Stack

- **Database**: PostgreSQL 15+
- **Backend-as-a-Service**: Supabase
- **ORM/Client**: Supabase JS Client
- **Migrations**: Supabase CLI migration files
- **Row Level Security**: PostgreSQL RLS policies

## Architecture Principles

1. **PostgreSQL First**: All database operations use PostgreSQL native features
2. **Supabase Compatible**: Works with Supabase auth, realtime, and edge functions
3. **Production Ready**: Proper indexes, constraints, and timestamps
4. **Future Proof**: Extensible schema design with JSONB for flexibility
5. **RLS Ready**: Row Level Security policies for multi-tenant isolation
6. **Migration Based**: All schema changes tracked via SQL migrations

## Directory Structure

```
supabase/
├── migrations/          # SQL migration files
│   ├── 00001_create_enums.sql
│   ├── 00002_create_profiles.sql
│   ├── 00003_create_roles.sql
│   ├── 00004_create_domains.sql
│   ├── 00005_create_dns.sql
│   ├── 00006_create_billing.sql
│   ├── 00007_create_support.sql
│   ├── 00008_create_cms.sql
│   ├── 00009_create_settings.sql
│   ├── 00010_create_cloudflare.sql
│   └── 00011_create_security.sql
├── seed/                # Seed data
│   ├── 00001_seed_roles.sql
│   └── 00002_seed_role_permissions.sql
├── policies/            # RLS policy documentation
│   ├── 00001_profiles_policies.md
│   ├── 00002_domains_policies.md
│   ├── 00003_billing_policies.md
│   └── 00004_support_policies.md
└── types/               # TypeScript types
    └── database.types.ts
```

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│   profiles      │
├─────────────────┤
│ id (PK)         │
│ user_id (UK)    │◄──────────────┐
│ email           │               │
│ full_name      │               │
│ phone          │               │
│ avatar_url     │               │
│ status         │               │
│ created_at     │               │
│ updated_at     │               │
└─────────────────┘               │
         │                        │
         │ 1:1                    │
         ▼                        │
┌─────────────────┐               │
│   user_roles    │               │
├─────────────────┤               │
│ id (PK)         │               │
│ user_id         │◄──────────────┘
│ role_id (FK)    │◄──────┐       │
│ assigned_by     │       │       │
│ expires_at     │       │       │
│ created_at     │       │       │
└─────────────────┘       │       │
         │               │       │
         │ N:1           │       │
         ▼               │       │
┌─────────────────┐      │       │
│     roles       │      │       │
├─────────────────┤      │       │
│ id (PK)         │◄─────┘       │
│ name (UK)       │               │
│ description     │               │
│ role_type (UK)  │               │
│ is_system       │               │
│ created_at     │               │
│ updated_at     │               │
└─────────────────┘               │
                                  │
┌─────────────────┐               │
│ role_permissions│               │
├─────────────────┤               │
│ id (PK)         │               │
│ role_id (FK)    │◄──────┐       │
│ permission_id   │       │       │
│ created_at     │       │       │
└─────────────────┘       │       │
         │               │       │
         │ N:1           │       │
         ▼               │       │
┌─────────────────┐      │       │
│  permissions   │      │       │
├─────────────────┤      │       │
│ id (PK)         │◄─────┘       │
│ name (UK)       │               │
│ description     │               │
│ resource       │               │
│ action         │               │
│ created_at     │               │
└─────────────────┘               │
                                  │
┌─────────────────┐               │
│    domains      │               │
├─────────────────┤               │
│ id (PK)         │               │
│ user_id         │◄──────────────┘
│ domain_name     │               │
│ registrar      │               │
│ registration_  │               │
│   date         │               │
│ expiration_    │               │
│   date         │               │
│ auto_renew     │               │
│ status         │               │
│ is_primary     │               │
│ cloudflare_    │               │
│   zone_id      │               │
│ notes          │               │
│ created_at     │               │
│ updated_at     │               │
└─────────────────┘               │
         │                        │
         │ 1:N                    │
         ▼                        │
┌─────────────────┐               │
│  dns_records    │               │
├─────────────────┤               │
│ id (PK)         │               │
│ domain_id (FK)  │               │
│ record_type    │               │
│ name           │               │
│ value          │               │
│ priority       │               │
│ ttl            │               │
│ proxied        │               │
│ is_active      │               │
│ created_at     │               │
│ updated_at     │               │
└─────────────────┘               │
                                  │
┌─────────────────┐               │
│ cloudflare_zones│               │
├─────────────────┤               │
│ id (PK)         │               │
│ domain_id (FK)  │               │
│ zone_id (UK)    │               │
│ zone_name      │               │
│ status         │               │
│ plan           │               │
│ name_servers   │               │
│ verification_  │               │
│   status       │               │
│ activated_at  │               │
│ created_at     │               │
│ updated_at     │               │
└─────────────────┘               │
         │                        │
         │ 1:N                    │
         ▼                        │
┌─────────────────┐               │
│  dns_sync_jobs  │               │
├─────────────────┤               │
│ id (PK)         │               │
│ zone_id (FK)    │               │
│ status         │               │
│ records_synced │               │
│ records_failed │               │
│ error_message │               │
│ started_at    │               │
│ completed_at  │               │
│ created_at    │               │
└─────────────────┘               │
```

## Table Groups

### 1. Users (`profiles`)

User profile information linked to Supabase Auth.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| user_id | UUID | NOT NULL, UNIQUE |
| email | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | NULL |
| phone | VARCHAR(50) | NULL |
| avatar_url | TEXT | NULL |
| status | user_status | NOT NULL, DEFAULT 'pending' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Indexes**: email, status, user_id

### 2. Roles & Permissions

Role-based access control system.

**roles**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NULL |
| role_type | role_type | NOT NULL, UNIQUE |
| is_system | BOOLEAN | DEFAULT FALSE |

**permissions**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NULL |
| resource | VARCHAR(100) | NOT NULL |
| action | VARCHAR(50) | NOT NULL |

**user_roles**: Links users to roles with optional expiration

### 3. Domains

Domain registration and management.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | NOT NULL |
| domain_name | VARCHAR(255) | NOT NULL |
| registrar | VARCHAR(255) | NULL |
| registration_date | DATE | NULL |
| expiration_date | DATE | NULL |
| auto_renew | BOOLEAN | DEFAULT FALSE |
| status | domain_status | NOT NULL |
| is_primary | BOOLEAN | DEFAULT FALSE |
| cloudflare_zone_id | VARCHAR(255) | NULL |

**Related Tables**:
- `domain_reservations`: Temporary domain reservations
- `domain_claims`: Domain claim requests
- `domain_activity_logs`: Activity tracking

### 4. DNS

DNS record management.

**dns_records**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| domain_id | UUID | FK → domains |
| record_type | dns_record_type | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| value | TEXT | NOT NULL |
| priority | INTEGER | NULL |
| ttl | INTEGER | DEFAULT 3600 |
| proxied | BOOLEAN | DEFAULT FALSE |
| is_active | BOOLEAN | DEFAULT TRUE |

**dns_templates**: Reusable DNS record templates
**dns_template_records**: Records within templates
**txt_rules**: TXT record transformation rules

### 5. Billing

Invoice and payment management.

**invoices**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| invoice_number | VARCHAR(50) | NOT NULL, UNIQUE |
| user_id | UUID | NOT NULL |
| subtotal | DECIMAL(10,2) | NOT NULL |
| tax | DECIMAL(10,2) | NOT NULL |
| total | DECIMAL(10,2) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| status | invoice_status | NOT NULL |
| due_date | DATE | NULL |
| paid_at | TIMESTAMPTZ | NULL |

**invoice_items**: Line items for invoices
**payments**: Payment transactions

### 6. Support

Support ticket system.

**tickets**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| ticket_number | VARCHAR(50) | NOT NULL, UNIQUE |
| user_id | UUID | NOT NULL |
| subject | VARCHAR(500) | NOT NULL |
| description | TEXT | NULL |
| category | VARCHAR(100) | NULL |
| priority | VARCHAR(20) | DEFAULT 'medium' |
| status | ticket_status | NOT NULL |
| assigned_to | UUID | NULL |
| domain_id | UUID | FK → domains |

**ticket_messages**: Messages within tickets

### 7. CMS

Content management system.

**cms_pages**: Page metadata and status
**cms_sections**: Page sections with ordering
**cms_content**: Localized content for sections

### 8. Settings

System configuration.

**system_settings**: Key-value configuration
**feature_flags**: Feature toggle management
**smtp_settings**: Email configuration

### 9. Cloudflare

Cloudflare integration.

**cloudflare_zones**: Zone information
**dns_sync_jobs**: Sync job tracking
**dns_snapshots**: DNS record snapshots

### 10. Security

Audit and activity logging.

**audit_logs**: System audit trail
**activity_logs**: User activity tracking

## Enums

### user_status
- `pending` - Awaiting verification
- `active` - Active user
- `suspended` - Suspended account

### domain_status
- `available` - Available for registration
- `reserved` - Reserved temporarily
- `pending` - Pending registration
- `active` - Active domain
- `suspended` - Suspended
- `expired` - Expired
- `archived` - Archived

### invoice_status
- `pending` - Awaiting payment
- `paid` - Payment received
- `cancelled` - Cancelled
- `refunded` - Refunded

### ticket_status
- `open` - Open ticket
- `processing` - Being processed
- `resolved` - Resolved
- `closed` - Closed

## Future Scaling Strategy

### 1. Partitioning

For high-volume tables, consider PostgreSQL table partitioning:

```sql
-- Audit logs by month
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2. Indexing Strategy

- **B-tree indexes**: For equality and range queries
- **GIN indexes**: For JSONB columns
- **Partial indexes**: For active records only
- **Composite indexes**: For common query patterns

### 3. Caching

- Use Supabase Realtime for live updates
- Implement Redis for frequently accessed data
- Consider materialized views for complex aggregations

### 4. Scaling Considerations

- **Read replicas**: For read-heavy workloads
- **Connection pooling**: Via Supabase PgBouncer
- **CDN integration**: For static content
- **Edge functions**: For latency-sensitive operations

## RLS Implementation

Row Level Security is planned but not yet implemented. See `supabase/policies/` for policy documentation.

### Key Policies

1. **User owns own data**: Users can only access their own records
2. **Admin access**: Admins can view all records in their domain
3. **Billing access**: Billing managers have full billing access
4. **Support access**: Support agents can view assigned tickets

## Migration Commands

```bash
# Apply migrations
supabase db push

# Create new migration
supabase migration new create_new_table

# Reset database
supabase db reset
```

## Seed Commands

```bash
# Apply seeds
psql -f supabase/seed/00001_seed_roles.sql
psql -f supabase/seed/00002_seed_role_permissions.sql
```

## TypeScript Integration

Import types in your application:

```typescript
import type { Profile, Domain, Invoice, Ticket } from '@/supabase/types/database.types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Usage
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

## Summary

This database architecture provides:

- ✅ Complete schema for domain management
- ✅ DNS record management with Cloudflare integration
- ✅ Billing and payment processing
- ✅ Support ticket system
- ✅ CMS for content management
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Migration-based version control
- ✅ TypeScript type definitions
- ✅ RLS policy documentation
