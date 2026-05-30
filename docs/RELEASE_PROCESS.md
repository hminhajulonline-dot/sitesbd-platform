# Release Process

## Overview

SitesBD Platform follows a structured release process across four environments: Development, Testing, Staging, and Production.

## Environment Overview

| Environment | Purpose | URL | Deploy Trigger |
|-------------|---------|-----|----------------|
| Development | Local development | localhost | Manual |
| Testing | Integration testing | testing.sites.bd | PR to develop |
| Staging | Pre-production validation | staging.sites.bd | Release branch |
| Production | Live system | sites.bd, app.sites.bd, admin.sites.bd | Main branch |

## Release Pipeline

```
Development → Testing → Staging → Production
     ↓           ↓          ↓          ↓
  Local       PR       Release      Tag + Deploy
```

## Development Environment

### Purpose
- Individual feature development
- Local testing
- Component debugging

### Setup
```bash
# Clone repository
git clone https://github.com/hminhajulonline-dot/sitesbd-platform.git

# Install dependencies
npm install

# Start development
npm run dev
```

### Ports
- Web: 3000
- Dashboard: 3001
- Admin: 3002

## Testing Environment

### Purpose
- Integration testing
- Feature validation
- CI/CD verification

### Deploy Trigger
- Pull request to `develop` branch
- Automatic Vercel preview deployment

### Process
1. Developer creates PR to `develop`
2. CI runs all checks (build, lint, typecheck)
3. Vercel creates preview URL
4. Team reviews and approves
5. PR merged to `develop`
6. Preview deployment updated

### Quality Gates
- [ ] All CI checks pass
- [ ] Code review approved
- [ ] Features tested manually
- [ ] No critical bugs

## Staging Environment

### Purpose
- Pre-production validation
- UAT (User Acceptance Testing)
- Release preparation

### Deploy Trigger
- Release branch created (`release/X.Y.x`)

### Process
1. Create release branch from `develop`
2. Update version if needed
3. Vercel deploys to staging.sites.bd
4. QA team performs UAT
5. Bug fixes merged to release branch
6. Release approved
7. Merge to `main`

### Staging Checklist
- [ ] All features complete
- [ ] No critical/high bugs
- [ ] Performance acceptable
- [ ] Security scan passed
- [ ] Documentation updated

## Production Environment

### Purpose
- Live system for users
- High availability
- Zero downtime deployments

### Deploy Trigger
- Merge to `main` branch
- Git tag created

### Process
1. Merge release branch to `main`
2. Create git tag (vX.Y.Z)
3. Push tag to GitHub
4. Vercel triggers production deployment
5. Monitoring and validation
6. Merge to `develop`

### Production Checklist
- [ ] Staging testing complete
- [ ] Rollback plan ready
- [ ] Monitoring dashboards active
- [ ] Support team notified
- [ ] Changelog updated

## Release Types

### Hotfix Release
For critical production issues.

```
main → hotfix/issue → main → develop
```

Process:
1. Create hotfix branch from `main`
2. Implement fix
3. PR to `main` (expedited review)
4. Merge to `main` and tag
5. Cherry-pick to `develop`
6. Deploy

Timeline: Hours to 1 day

### Patch Release
Bug fixes and security patches.

```
develop → release/X.Y.x → main → develop
```

Timeline: 1-2 weeks

### Minor Release
New features, backward compatible.

```
develop → release/X.Y.x → main → develop
```

Timeline: 2-4 weeks

### Major Release
Breaking changes, major updates.

```
develop → release/X.Y.x → main → develop
```

Timeline: 1-3 months

## Deployment Windows

| Day | Time | Type | Notes |
|-----|------|------|-------|
| Monday-Thursday | 10:00-16:00 | Any | Standard releases |
| Friday | 10:00-12:00 | Patches only | Avoid weekend issues |
| Weekend/Holiday | None | Emergency only | Requires approval |

## Rollback Procedure

If production issues detected:

1. **Immediate**: Revert Vercel deployment to previous
   ```
   Vercel Dashboard → Deployments → Select previous → Actions → Promote to Production
   ```

2. **Code**: Revert merge commit
   ```bash
   git revert <merge-commit-sha>
   git push origin main
   ```

3. **Database**: Apply rollback scripts (if needed)

4. **Notify**: Team and stakeholders

5. **Post-mortem**: Document issue and resolution

## Post-Release

1. Monitor error tracking
2. Check performance metrics
3. Verify feature functionality
4. Update changelog
5. Announce to stakeholders
6. Merge `main` to `develop`

## Release Schedule

| Release Type | Cadence | Example |
|--------------|---------|---------|
| Patch | Every 1-2 weeks | v1.0.1, v1.0.2 |
| Minor | Every 2-4 weeks | v1.1.0, v1.2.0 |
| Major | Quarterly | v2.0.0 |

## Communication

### Pre-release
- Notify team 2-3 days before
- Share release notes draft
- Schedule testing session

### Post-release
- Announce completion
- Share changelog
- Monitor for issues
- Schedule follow-up if needed

## Emergency Releases

For critical production issues:

1. Skip staging if severity is Critical
2. Deploy directly from hotfix branch
3. Notify team immediately
4. Document decision in PR
5. Post-mortem within 48 hours
