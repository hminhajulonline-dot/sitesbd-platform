# Permissions System

## Overview

SitesBD Platform implements a role-based access control (RBAC) system.

## User Roles

| Role | Description | Permissions |
|------|-------------|--------------|
| guest | Unauthenticated user | View landing page |
| user | Authenticated user | Access dashboard, manage own resources |
| admin | Platform administrator | Full access to all resources |

## Permission Matrix

| Resource | Guest | User | Admin |
|----------|-------|------|-------|
| Landing page | ✓ | ✓ | ✓ |
| User dashboard | ✗ | ✓ | ✓ |
| Admin dashboard | ✗ | ✗ | ✓ |
| Domain management | ✗ | Own only | All |
| Billing | ✗ | Own only | All |

## Implementation

Permissions will be checked in:
- Server actions
- API routes
- UI components (visibility only)

## Future Considerations

- Custom roles
- Resource-level permissions
- Team/Organization permissions
