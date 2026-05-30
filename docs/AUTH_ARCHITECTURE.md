# SitesBD Authentication Architecture

## Overview

This document describes the authentication architecture for the SitesBD Platform, built on Supabase Auth with role-based access control.

## Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Web      │  │   Admin     │  │    API      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼───────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Auth Middleware                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AuthMiddleware  │  Guards  │  Route Protection      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Auth Package (@sitesbd/auth)               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │   Client   │ │   Server   │ │   Session  │ │  Device  │ │
│  │            │ │            │ │  Service   │ │  Service │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│  ┌────────────┐ ┌────────────┐                               │
│  │RoleResolver│ │PermResolver│                               │
│  └────────────┘ └────────────┘                               │
└─────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │    Auth     │ │  Database  │ │ Realtime   │               │
│  └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. User Login Flow

```
User submits credentials
        │
        ▼
┌───────────────────┐
│   AuthClient      │
│   signIn()        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Supabase Auth   │
│   authenticate    │
└─────────┬─────────┘
          │
          ├── Success ──────────────────┐
          │                             │
          ▼                             ▼
┌───────────────────┐         ┌───────────────────┐
│   Create Session  │         │   Return Error   │
│   Record          │         │                  │
└─────────┬─────────┘         └───────────────────┘
          │
          ▼
┌───────────────────┐
│   Register Device │
│   & Update Prefs │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Return Auth     │
│   Context         │
└───────────────────┘
```

### 2. Session Flow

```
Client Request
      │
      ▼
┌───────────────────┐
│   AuthMiddleware  │
│   handle()        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Extract Token   │
│   from Cookie/    │
│   Authorization  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Verify Token    │
│   with Supabase   │
└─────────┬─────────┘
          │
          ├── Valid ──────────────────┐
          │                             │
          ▼                             ▼
┌───────────────────┐         ┌───────────────────┐
│   Build Auth      │         │   Return 401     │
│   Context         │         │   Unauthorized   │
└─────────┬─────────┘         └───────────────────┘
          │
          ▼
┌───────────────────┐
│   Check Guards    │
│   (Role/Permission)│
└─────────┬─────────┘
          │
          ├── Allowed ──────────────────┐
          │                             │
          ▼                             ▼
┌───────────────────┐         ┌───────────────────┐
│   Continue to     │         │   Return 403     │
│   Handler         │         │   Forbidden      │
└───────────────────┘         └───────────────────┘
```

### 3. Permission Flow

```
User Request
      │
      ▼
┌───────────────────┐
│   Permission      │
│   Resolver        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Get User Roles  │
│   from Cache/DB   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Get Role        │
│   Permissions     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Merge & Dedupe  │
│   Permissions     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Check Required  │
│   Permission      │
└─────────┬─────────┘
          │
          ├── Has Permission ─────────┐
          │                            │
          ▼                            ▼
┌───────────────────┐        ┌───────────────────┐
│   Allow Request   │        │   Deny Request   │
└───────────────────┘        └───────────────────┘
```

### 4. Device Tracking Flow

```
New Login
      │
      ▼
┌───────────────────┐
│   Extract Device │
│   Info           │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Check Existing  │
│   Device          │
└─────────┬─────────┘
          │
          ├── Exists ──────────────────┐
          │                             │
          ▼                             ▼
┌───────────────────┐        ┌───────────────────┐
│   Update Last      │        │   Register New    │
│   Active           │        │   Device          │
└─────────┬─────────┘        └─────────┬─────────┘
          │                            │
          ▼                            ▼
┌───────────────────┐        ┌───────────────────┐
│   Trust Device    │        │   Return Device   │
│   (if trusted)    │        │   Info            │
└───────────────────┘        └───────────────────┘
```

## Role Hierarchy

```
┌─────────────────┐
│   System Owner   │  ← Highest privilege
├─────────────────┤
│   Super Admin    │
├─────────────────┤
│     Admin       │
├─────────────────┤
│ Billing Manager │
├─────────────────┤
│ Support Agent   │
├─────────────────┤
│     User        │  ← Lowest privilege
└─────────────────┘
```

## Permission Categories

### User Management
- `view_users` - View user list
- `create_users` - Create new users
- `update_users` - Update user information
- `delete_users` - Delete users
- `suspend_users` - Suspend user accounts

### Domain Management
- `view_domains` - View domains
- `create_domains` - Create domains
- `update_domains` - Update domains
- `delete_domains` - Delete domains
- `transfer_domains` - Transfer domains

### DNS Management
- `view_dns_records` - View DNS records
- `create_dns_records` - Create DNS records
- `update_dns_records` - Update DNS records
- `delete_dns_records` - Delete DNS records

### Billing
- `view_invoices` - View invoices
- `create_invoices` - Create invoices
- `update_invoices` - Update invoices
- `process_payments` - Process payments
- `refund_payments` - Refund payments

### Support
- `view_tickets` - View tickets
- `create_tickets` - Create tickets
- `update_tickets` - Update tickets
- `assign_tickets` - Assign tickets

### CMS
- `view_cms_pages` - View CMS pages
- `create_cms_pages` - Create CMS pages
- `update_cms_pages` - Update CMS pages
- `publish_cms_pages` - Publish CMS pages

## Database Tables

### user_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| session_token | VARCHAR | Unique session token |
| refresh_token | TEXT | Refresh token |
| ip_address | INET | Client IP |
| user_agent | TEXT | Browser user agent |
| device_id | VARCHAR | Device identifier |
| expires_at | TIMESTAMPTZ | Session expiry |
| last_activity_at | TIMESTAMPTZ | Last activity |
| is_active | BOOLEAN | Active status |

### user_devices
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| device_id | VARCHAR | Device identifier |
| device_name | VARCHAR | Device name |
| device_type | VARCHAR | desktop/mobile/tablet |
| browser | VARCHAR | Browser name |
| os | VARCHAR | Operating system |
| is_trusted | BOOLEAN | Trusted device |
| is_current | BOOLEAN | Current device |

### user_preferences
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| theme | VARCHAR | light/dark/system |
| language | VARCHAR | Language code |
| timezone | VARCHAR | Timezone |
| notification_email | BOOLEAN | Email notifications |
| notification_whatsapp | BOOLEAN | WhatsApp notifications |
| notification_in_app | BOOLEAN | In-app notifications |

## Future OTP Strategy

### Planned OTP Implementation

1. **Email OTP**
   - 6-digit code
   - 5-minute expiry
   - 3 attempts max

2. **SMS OTP (WhatsApp)**
   - 6-digit code
   - 5-minute expiry
   - 3 attempts max

3. **TOTP (Authenticator)**
   - Time-based one-time password
   - 30-second window
   - 3 previous/next codes

### OTP Flow

```
User requests OTP
        │
        ▼
┌───────────────────┐
│   Generate Code   │
│   Store in DB     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Send via        │
│   Channel         │
│   (Email/SMS)     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   User enters     │
│   OTP Code        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Verify Code     │
│   & Mark OTP      │
│   Verified        │
└───────────────────┘
```

## Usage Examples

### Client-Side Auth

```typescript
import { initAuthClient, getAuthClient } from '@sitesbd/auth';

// Initialize
initAuthClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

// Get current user
const auth = getAuthClient();
const result = await auth.getUser();
if (result.success) {
  console.log(result.data.email);
}
```

### Server-Side Auth

```typescript
import { initAuthServer, getAuthServer } from '@sitesbd/auth';

// Initialize
initAuthServer({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
});

// Create user
const server = getAuthServer();
const result = await server.createUser(email, password);
```

### Route Protection

```typescript
import { guards } from '@sitesbd/auth';

// In middleware
const result = await authMiddleware.handle(request);
if (!result.allowed) {
  return NextResponse.redirect(result.redirectTo);
}

// Using guards
const guard = guards.requireAdmin;
const check = guard(result.context);
if (!check.allowed) {
  return NextResponse.json({ error: check.error }, { status: 403 });
}
```

### Role Checking

```typescript
import { RoleResolver } from '@sitesbd/auth';

const roleResolver = new RoleResolver({ supabase });

// Check if user has role
const isAdmin = await roleResolver.hasRole(userId, 'admin');

// Get primary role
const result = await roleResolver.getPrimaryRole(userId);
if (result.success && result.data) {
  console.log(result.data.name);
}
```

### Permission Checking

```typescript
import { PermissionResolver } from '@sitesbd/auth';

const permResolver = new PermissionResolver({ supabase });

// Check permission
const canManageUsers = await permResolver.hasPermission(userId, 'manage_users');

// Check multiple permissions
const canManageBilling = await permResolver.hasAllPermissions(userId, [
  'view_invoices',
  'process_payments',
]);
```

## Security Considerations

1. **Token Storage**
   - Access tokens stored in httpOnly cookies
   - Refresh tokens for session persistence
   - Short-lived access tokens (1 hour)

2. **Session Management**
   - Sessions expire after 7 days
   - Active session tracking
   - Invalidate all sessions option

3. **Device Tracking**
   - Trusted devices feature
   - Session per device
   - Device revocation

4. **Rate Limiting**
   - Login attempts: 5 per 15 minutes
   - OTP attempts: 3 per code
   - API requests: 100 per minute

5. **Audit Logging**
   - All auth events logged
   - Failed login attempts
   - Permission changes
