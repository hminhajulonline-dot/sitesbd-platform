# Branching Strategy

## Overview

SitesBD Platform uses a structured branching strategy to ensure clean, organized development workflow.

## Branch Types

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `main` | Production-ready code | Permanent |
| `develop` | Integration for next release | Permanent |
| `feature/*` | New features | Until merged |
| `hotfix/*` | Emergency production fixes | Until merged |
| `release/*` | Release preparation | Until merged |

## Workflow

```
feature/xyz → develop → main
                ↓
         release/*
                ↓
              main
                ↓
          hotfix/*
```

## Branch Details

### main
- **Purpose**: Production-ready code
- **Protection**: Required reviews, CI must pass
- **When to push**: After release or hotfix
- **Never**: Direct commits

### develop
- **Purpose**: Integration branch for features
- **Protection**: Required reviews, CI must pass
- **When to push**: After feature merge or release
- **Never**: Direct commits (except by release process)

### feature/*
- **Purpose**: Develop new functionality
- **Naming**: `feature/TICKET-description` or `feature/description`
- **Base**: `develop`
- **Merge**: Pull request to `develop`
- **Delete**: After merge

### hotfix/*
- **Purpose**: Critical production fixes
- **Naming**: `hotfix/TICKET-description` or `hotfix/description`
- **Base**: `main`
- **Merge**: Pull request to `main` and `develop`
- **Delete**: After merge

### release/*
- **Purpose**: Release preparation
- **Naming**: `release/MAJOR.MINOR.x` (e.g., `release/1.2.x`)
- **Base**: `develop`
- **Merge**: Pull request to `main`
- **Delete**: After release completion

## Creating a Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push -u origin feature/my-feature
```

## Merging Feature to Develop

```bash
# Create PR targeting develop
# Wait for CI and review approval
# Squash and merge
```

## Creating a Release

```bash
# From develop, create release branch
git checkout develop
git pull origin develop
git checkout -b release/1.2.x

# Update version if needed
# Test and fix any issues

# Merge to main
git checkout main
git merge release/1.2.x --no-ff
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/1.2.x --no-ff
git push origin develop

# Delete release branch
git branch -d release/1.2.x
```

## Creating a Hotfix

```bash
# From main, create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make fix, commit
git add .
git commit -m "fix: critical fix"

# Push and create PR to main
git push -u origin hotfix/critical-fix

# After merge, cherry-pick to develop
git checkout develop
git cherry-pick <commit-hash>
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-fix
```

## Best Practices

1. **Keep branches short-lived**: Merge within days, not weeks
2. **Small, focused changes**: One feature per branch
3. **Keep up to date**: Rebase on develop regularly
4. **Write descriptive names**: `feature/user-authentication` not `feature/1`
5. **Update documentation**: Include docs updates in PR
6. **Test locally**: Ensure CI passes before requesting review

## Branch Protection

| Branch | Required Reviews | Required Checks |
|--------|-----------------|-----------------|
| `main` | 1+ (admin) | CI must pass |
| `develop` | 1+ | CI must pass |

## Quick Reference

```bash
# Create feature
git checkout develop && git pull
git checkout -b feature/my-feature

# Update from develop
git fetch origin && git rebase origin/develop

# Merge feature
git checkout develop && git merge --no-ff feature/my-feature

# Create release
git checkout develop && git checkout -b release/1.2.x

# Complete release
git checkout main && git merge --no-ff release/1.2.x && git tag
```
