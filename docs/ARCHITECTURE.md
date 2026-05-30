# Architecture Document

## Overview

SitesBD Platform uses a modern monorepo architecture with Turborepo for optimized builds and shared packages for code reuse.

## Repository Structure

```
sitesbd-platform/
├── apps/           # Application workspaces
│   ├── web/        # Landing website (sites.bd)
│   ├── dashboard/  # User dashboard (app.sites.bd)
│   └── admin/      # Admin dashboard (admin.sites.bd)
├── packages/       # Shared packages
│   ├── shared/     # Shared types, constants, utilities
│   ├── ui/         # Reusable UI components
│   ├── auth/       # Authentication (placeholder)
│   ├── database/   # Database schema (placeholder)
│   └── cloudflare/ # Cloudflare API (placeholder)
├── docs/           # Documentation
└── .github/        # GitHub configuration
```

## Applications

### Web (Landing)
- **Purpose**: Marketing landing page
- **Port**: 3000
- **Routes**:
  - `/` - Home page
  - `/health` - Health check

### Dashboard (User)
- **Purpose**: User dashboard for managing services
- **Port**: 3001
- **Routes**:
  - `/` - Dashboard home
  - `/health` - Health check

### Admin
- **Purpose**: Admin dashboard for platform management
- **Port**: 3002
- **Routes**:
  - `/` - Admin home
  - `/health` - Health check

## Package Dependencies

```
apps/* 
  └── @sitesbd/shared (types, constants)
  └── @sitesbd/ui (components)
```

## Deployment Strategy

| Environment | Domain | Description |
|-------------|--------|-------------|
| Development | localhost | Local development |
| Preview | *.vercel.app | PR preview deployments |
| Production | sites.bd, app.sites.bd, admin.sites.bd | Production domains |

## Environment Variables

See `.env.example` for all required environment variables.

## Build Configuration

- **Turborepo**: Orchestrates builds across packages
- **TypeScript**: Strict mode enabled
- **ESLint**: Core web vitals rules + TypeScript
- **Prettier**: Code formatting
