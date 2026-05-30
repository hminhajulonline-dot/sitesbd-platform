# SitesBD Platform Foundation Extension

## Overview

This document describes the platform foundation extension for the SitesBD Platform, adding support for Quick Connect, Connection Guides, Notifications, and Announcements.

## Architecture Extensions

### 1. Quick Connect Architecture

Quick Connect allows users to easily deploy their domains to various hosting platforms with automatic DNS configuration.

#### Tables

**quick_connect_platforms**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Platform name (e.g., "Vercel") |
| slug | VARCHAR(100) | URL-friendly identifier |
| logo_url | TEXT | Platform logo URL |
| description | TEXT | Platform description |
| status | platform_status | active/inactive/deprecated |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**quick_connect_templates**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| platform_id | UUID | FK → quick_connect_platforms |
| name | VARCHAR(255) | Template name |
| description | TEXT | Template description |
| status | platform_status | Template status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**quick_connect_fields**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| platform_id | UUID | FK → quick_connect_platforms |
| field_name | VARCHAR(100) | Field identifier |
| field_label | VARCHAR(255) | Display label |
| field_type | VARCHAR(50) | Input type (text, url, etc.) |
| required | BOOLEAN | Is field required |
| placeholder | VARCHAR(255) | Placeholder text |
| sort_order | INTEGER | Display order |

#### Supported Platforms

| Platform | Slug | Description |
|----------|------|-------------|
| Blogger | blogger | Blogspot blogs |
| Vercel | vercel | Vercel deployments |
| GitHub Pages | github-pages | GitHub static sites |
| Netlify | netlify | Netlify hosting |
| Cloudflare Pages | cloudflare-pages | Cloudflare edge |
| Render | render | Render web services |
| Firebase | firebase | Firebase Hosting |
| Railway | railway | Railway deployment |
| Surge | surge | Surge.sh publishing |

#### Quick Connect Flow

```
User selects platform
    ↓
View platform details & templates
    ↓
Fill required fields (domain, project URL, etc.)
    ↓
Generate DNS records based on template
    ↓
Apply DNS records to user's domain
    ↓
Return connection status
```

### 2. Connection Guides Architecture

Connection guides provide step-by-step instructions for connecting domains to various platforms.

#### Tables

**connection_guides**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| platform_id | UUID | FK → quick_connect_platforms |
| title | VARCHAR(500) | Guide title |
| slug | VARCHAR(100) | URL-friendly identifier |
| content | TEXT | Markdown content |
| status | guide_status | draft/published/archived |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### Guide Content Structure

Guides are stored as Markdown and can include:
- Step-by-step instructions
- Code snippets
- Screenshots (via external URLs)
- Links to external resources

### 3. Notification Architecture

Notifications enable multi-channel communication with users.

#### Tables

**notification_templates**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Template name |
| channel | notification_channel | email/whatsapp/in_app |
| subject | VARCHAR(500) | Email subject (for email channel) |
| content | TEXT | Template content with placeholders |
| status | platform_status | Template status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**notifications**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Recipient user |
| title | VARCHAR(500) | Notification title |
| message | TEXT | Notification message |
| type | notification_type | info/warning/success/error |
| is_read | BOOLEAN | Read status |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### Notification Channels

| Channel | Description | Use Case |
|---------|-------------|----------|
| email | Email notifications | Welcome, invoices, updates |
| whatsapp | WhatsApp messages | SMS alerts, reminders |
| in_app | In-app notifications | Real-time alerts, tickets |

#### Notification Types

| Type | Description | Visual Style |
|------|-------------|--------------|
| info | Informational | Blue |
| warning | Warning message | Yellow |
| success | Success message | Green |
| error | Error message | Red |

#### Template Placeholders

Templates support variable placeholders using `{{variable}}` syntax:

| Placeholder | Description |
|------------|-------------|
| `{{user_name}}` | User's full name |
| `{{domain_name}}` | Domain name |
| `{{invoice_number}}` | Invoice number |
| `{{amount}}` | Payment amount |
| `{{ticket_number}}` | Support ticket number |
| `{{expiration_date}}` | Domain expiration date |
| `{{message}}` | Custom message |

### 4. Announcement Architecture

Announcements allow admins to broadcast messages to all users or specific segments.

#### Tables

**announcements**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(500) | Announcement title |
| content | TEXT | Announcement content |
| type | announcement_type | info/maintenance/promotion/warning |
| status | platform_status | active/inactive |
| start_date | TIMESTAMPTZ | When to start showing |
| end_date | TIMESTAMPTZ | When to stop showing |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### Announcement Types

| Type | Description | Use Case |
|------|-------------|----------|
| info | General information | New features, updates |
| maintenance | Maintenance notice | Scheduled downtime |
| promotion | Promotional content | Discounts, offers |
| warning | Important warning | Security alerts, urgent |

#### Announcement Display Logic

```sql
-- Active announcements
SELECT * FROM announcements
WHERE status = 'active'
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY created_at DESC;
```

## Entity Relationship Diagram

```
┌─────────────────────────────┐
│ quick_connect_platforms    │
├─────────────────────────────┤
│ id (PK)                    │
│ name                       │
│ slug (UK)                  │
│ logo_url                   │
│ description                │
│ status                     │
│ sort_order                 │
│ created_at                 │
│ updated_at                 │
└─────────────┬─────────────┘
              │ 1:N
    ┌─────────┴─────────┬──────────────┐
    │                    │              │
    ▼                    ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ templates   │  │   fields    │  │   guides    │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ id (PK)     │  │ id (PK)     │  │ id (PK)     │
│ platform_id │  │ platform_id │  │ platform_id │
│ name        │  │ field_name  │  │ title       │
│ description │  │ field_label │  │ slug        │
│ status      │  │ field_type  │  │ content     │
│ created_at   │  │ required    │  │ status      │
│ updated_at   │  │ placeholder │  │ sort_order  │
└─────────────┘  │ sort_order  │  │ created_at  │
                 │ created_at   │  │ updated_at  │
                 └─────────────┘  └─────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│notification_templates│     │    announcements    │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ name                │     │ title               │
│ channel             │     │ content            │
│ subject             │     │ type                │
│ content             │     │ status              │
│ status              │     │ start_date          │
│ created_at          │     │ end_date            │
│ updated_at          │     │ created_at          │
└─────────────────────┘     │ updated_at          │
        │                   └─────────────────────┘
        │ 1:N
        ▼
┌─────────────────────┐
│   notifications     │
├─────────────────────┤
│ id (PK)             │
│ user_id             │
│ title               │
│ message             │
│ type                │
│ is_read             │
│ metadata            │
│ created_at          │
└─────────────────────┘
```

## Future Expansion Strategy

### 1. Quick Connect Extensions

- **Custom Fields**: Allow users to define custom fields per platform
- **Connection Status**: Track deployment status and history
- **Webhooks**: Notify external systems on connection events
- **Auto-Deploy**: Automatic deployment triggers

### 2. Notification Extensions

- **Notification Preferences**: User-configurable notification settings
- **Notification Scheduling**: Schedule notifications for later
- **Batch Notifications**: Send to multiple users at once
- **Notification Analytics**: Track open rates, click rates

### 3. Announcement Extensions

- **Targeted Announcements**: Target specific user segments
- **Announcement Dismissal**: Allow users to dismiss announcements
- **Announcement Categories**: Categorize announcements
- **Push Notifications**: Mobile push notification support

### 4. Platform Extensions

- **Platform Reviews**: User ratings and reviews
- **Platform Stats**: Usage statistics per platform
- **Platform Health**: Integration health monitoring
- **Custom Platforms**: Allow users to add custom platforms

## Database Standards

All new tables follow the established standards:

✅ UUID primary keys
✅ Timestamps (created_at, updated_at)
✅ Proper indexes
✅ Foreign key constraints
✅ Enum types for status fields
✅ JSONB for flexible metadata

## Migration Order

Migrations must be applied in order:

1. `00012_create_platform_enums.sql` - Enums first
2. `00013_create_quick_connect.sql` - Quick Connect tables
3. `00014_create_notifications.sql` - Notification tables
4. `00015_create_announcements.sql` - Announcement table

## Seed Data

Seed files should be applied in order:

1. `00003_seed_quick_connect_platforms.sql` - 9 platforms
2. `00004_seed_notification_templates.sql` - 11 templates

## TypeScript Integration

```typescript
import type { 
  QuickConnectPlatform, 
  ConnectionGuide,
  Notification,
  NotificationTemplate,
  Announcement 
} from '@/supabase/types/database.types';

// Fetch active platforms
const { data: platforms } = await supabase
  .from('quick_connect_platforms')
  .select('*')
  .eq('status', 'active')
  .order('sort_order');

// Fetch user notifications
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// Fetch active announcements
const { data: announcements } = await supabase
  .from('announcements')
  .select('*')
  .eq('status', 'active')
  .gte('end_date', new Date().toISOString())
  .or('start_date.is.null,start_date.lte.now')
  .order('created_at', { ascending: false });
```

## Summary

This extension provides:

- ✅ Quick Connect for 9 hosting platforms
- ✅ Connection guides with Markdown content
- ✅ Multi-channel notifications (email, WhatsApp, in-app)
- ✅ Template-based notification system
- ✅ Announcements with scheduling
- ✅ Full TypeScript type definitions
- ✅ Comprehensive documentation
