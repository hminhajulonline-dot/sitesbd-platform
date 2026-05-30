# System Architecture

## Overview

SitesBD Platform is a comprehensive web hosting platform for Bangladesh, built with a modern cloud-native architecture.

## Application Architecture

| Domain | Application | Purpose |
|--------|-------------|---------|
| sites.bd | Landing Website | Marketing, feature展示, user acquisition |
| app.sites.bd | User Dashboard | User account management, domain/hosting control |
| admin.sites.bd | Admin Dashboard | Platform administration, user management |

## Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Infrastructure Flow                      │
└─────────────────────────────────────────────────────────────────┘

GitHub (Repository)
    ↓
Vercel (Deployment)
    ↓
Supabase (Database, Auth, Storage)
    ↓
Cloudflare (DNS, CDN, Security)
```

### Infrastructure Components

| Component | Service | Purpose |
|-----------|---------|---------|
| **Repository** | GitHub | Source code management, CI/CD triggers |
| **Deployment** | Vercel | Application hosting, preview deployments |
| **Database** | Supabase | PostgreSQL database, authentication, storage |
| **Edge** | Cloudflare | DNS management, content delivery, DDoS protection |

## Core Services

### Authentication Service
- User registration and login
- Email verification
- Password reset
- Session management
- Role-based access control (RBAC)

### Domain Service
- Domain registration (future)
- Domain transfer
- WHOIS management
- DNS configuration
- Domain renewal

### DNS Service
- DNS zone management
- Record management (A, CNAME, MX, TXT, etc.)
- DNSSEC configuration
- Cloudflare integration

### Billing Service
- Subscription management
- Payment processing (bkash, Nagad integration planned)
- Invoice generation
- Refund handling
- Payment history

### Ticket Service
- Support ticket creation
- Ticket assignment and prioritization
- Status tracking
- Resolution workflow
- Communication history

### CMS Service
- Content management
- Page builder
- Media library
- Version control
- Scheduled publishing

### Notification Service
- Email notifications
- SMS notifications (future)
- Push notifications (future)
- Template management
- Notification preferences

### Audit Service
- Activity logging
- Audit trail
- Compliance reporting
- Security monitoring
- Data retention

### Automation Service
- Scheduled tasks
- Cron jobs
- Workflow automation
- Background processing
- Error handling

## Future Services

### Marketplace
- Template marketplace
- Theme store
- Plugin marketplace
- Third-party integrations

### Referral System
- Referral tracking
- Commission management
- Affiliate dashboard
- payout processing

### API Platform
- Public API
- API key management
- Rate limiting
- Documentation
- SDK support

### AI Assistant
- Chat support
- Automated responses
- Knowledge base integration
- Ticket triage

## Technical Architecture

### Monorepo Structure
```
sitesbd-platform/
├── apps/              # Applications
│   ├── web/           # Landing website
│   ├── dashboard/     # User dashboard
│   └── admin/         # Admin dashboard
├── packages/          # Shared packages
│   ├── shared/        # Types, constants, utilities
│   ├── ui/            # Reusable UI components
│   ├── auth/          # Authentication
│   ├── database/      # Database schema
│   └── cloudflare/    # Cloudflare integration
├── docs/              # Documentation
└── .github/           # GitHub configuration
```

### Technology Stack
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + Shadcn UI
- **Monorepo**: Turborepo
- **Database**: Supabase
- **DNS/CDN**: Cloudflare API
- **Deployment**: Vercel

### Deployment Architecture

| Environment | URL Pattern | Description |
|-------------|-------------|-------------|
| Development | localhost:3000-3002 | Local development |
| Preview | *.vercel.app | PR preview deployments |
| Production | sites.bd, app.sites.bd, admin.sites.bd | Production domains |

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Security Layers                       │
└─────────────────────────────────────────────────────────────┘

Cloudflare (WAF, DDoS Protection, SSL)
    ↓
Vercel Edge (Authentication, Rate Limiting)
    ↓
Supabase (RLS, Row-Level Security)
    ↓
Application (Input Validation, Authorization)
```

## Data Flow

```
User Request → Cloudflare → Vercel → Next.js App
                                      ↓
                              API Routes / Server Actions
                                      ↓
                              Supabase (Auth, Database)
```

## Service Communication

| Service | Protocol | Port | Purpose |
|---------|----------|------|---------|
| Web App | HTTPS | 443 | User traffic |
| Dashboard | HTTPS | 443 | Authenticated user traffic |
| Admin | HTTPS | 443 | Admin traffic |
| API | HTTPS | 443 | Programmatic access |
| Database | PostgreSQL | 5432 | Internal |
| Cache | Redis | 6379 | Session, cache (future) |

## Scalability

### Horizontal Scaling
- Vercel edge functions for global distribution
- Cloudflare CDN for static assets
- Load balancing through Vercel

### Vertical Scaling
- Supabase auto-scaling for database
- CDN for bandwidth optimization
- Caching strategies

## Monitoring & Observability

- Vercel Analytics for performance monitoring
- Supabase Dashboard for database metrics
- Cloudflare Analytics for traffic analysis
- Error tracking (planned)
- Application logs (planned)

## Disaster Recovery

- GitHub for source control
- Vercel deployments for redundancy
- Supabase automated backups
- Cloudflare for DNS failover

## Compliance

- GDPR compliance for user data
- PCI DSS compliance for billing (planned)
- SSL/TLS encryption for all traffic
- Data retention policies
