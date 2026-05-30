# SitesBD Platform

A comprehensive web hosting platform for Bangladesh, built with Next.js 15, React 19, TypeScript, and Turborepo.

## Architecture

| Domain | Purpose |
|--------|---------|
| sites.bd | Landing website |
| app.sites.bd | User dashboard |
| admin.sites.bd | Admin dashboard |

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + Shadcn UI
- **Monorepo**: Turborepo
- **Database**: Supabase (planned)
- **DNS/CDN**: Cloudflare API (planned)
- **Deployment**: Vercel

## Project Structure

```
sitesbd-platform/
├── apps/           # Applications
│   ├── web/        # Landing website
│   ├── dashboard/  # User dashboard
│   └── admin/      # Admin dashboard
├── packages/       # Shared packages
│   ├── shared/     # Types, constants, utilities
│   ├── ui/         # Reusable UI components
│   ├── auth/       # Authentication (placeholder)
│   ├── database/   # Database schema (placeholder)
│   └── cloudflare/ # Cloudflare API (placeholder)
├── docs/           # Documentation
└── .github/        # GitHub configuration
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
npm install
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Or run individual apps
cd apps/web && npm run dev
cd apps/dashboard && npm run dev
cd apps/admin && npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Documentation

- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Security](docs/SECURITY.md)
- [Coding Standards](CODING_STANDARDS.md)

## License

Private - All rights reserved
