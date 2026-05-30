# Product Requirements Document (PRD)

## SitesBD Platform

### Overview
SitesBD is a comprehensive web hosting platform designed specifically for the Bangladesh market, providing domain registration, web hosting, and related services.

### Architecture Overview

| Domain | Purpose |
|--------|---------|
| sites.bd | Landing website / marketing |
| app.sites.bd | User dashboard |
| admin.sites.bd | Admin dashboard |

### Technology Stack
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS with Shadcn UI
- **Monorepo**: Turborepo
- **Database**: Supabase (planned)
- **DNS/CDN**: Cloudflare API (planned)
- **Deployment**: Vercel

### Core Features (Future Phases)

#### Phase 1: Foundation (Current)
- [x] Monorepo structure with Turborepo
- [x] Shared package with types and utilities
- [x] UI component library (Button, Card, PageContainer)
- [x] Placeholder pages for all three applications
- [x] Health check endpoints
- [x] GitHub templates for issues and PRs

#### Phase 2: Authentication
- [ ] User registration and login
- [ ] Email verification
- [ ] Password reset
- [ ] Session management
- [ ] Role-based access control

#### Phase 3: User Dashboard
- [ ] Domain management
- [ ] Hosting management
- [ ] Billing overview
- [ ] Support tickets
- [ ] Account settings

#### Phase 4: Admin Dashboard
- [ ] User management
- [ ] Domain management
- [ ] Hosting provisioning
- [ ] Billing management
- [ ] Support ticket handling
- [ ] Analytics and reporting

#### Phase 5: CMS Integration
- [ ] Website builder
- [ ] Template marketplace
- [ ] CDN integration

### User Roles
1. **Guest**: Browse landing page, register
2. **User**: Access dashboard, manage domains/hosting
3. **Admin**: Full access to admin dashboard

### Non-Functional Requirements
- 99.9% uptime SLA
- Sub-second page loads
- GDPR compliant data handling
- PCI DSS compliance for billing

### Success Metrics
- User registration conversion rate > 40%
- Dashboard load time < 2 seconds
- Support ticket resolution < 24 hours
- Zero critical security incidents

### Open Questions
1. Payment gateway integration (bkash, Nagad?)
2. SSL certificate provisioning approach
3. Email service provider selection
4. CDN strategy for static assets
