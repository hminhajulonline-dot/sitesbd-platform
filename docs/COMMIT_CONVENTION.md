# Commit Convention

## Overview

SitesBD Platform follows Conventional Commits specification for clear, structured commit history.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Commit Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `feat` | New feature | Adding new functionality |
| `fix` | Bug fix | Resolving bugs |
| `chore` | Maintenance | Dependencies, configs, tooling |
| `docs` | Documentation | README, docs, comments |
| `refactor` | Code refactoring | No behavior change |
| `test` | Tests | Adding/updating tests |
| `ci` | CI/CD | GitHub Actions, pipelines |
| `perf` | Performance | Performance improvements |
| `style` | Formatting | Code style (no logic change) |
| `build` | Build | Build system, dependencies |

## Scope

Optional scope to indicate what was changed:

| Scope | Description |
|-------|-------------|
| `web` | Landing website app |
| `dashboard` | User dashboard app |
| `admin` | Admin dashboard app |
| `shared` | Shared package |
| `ui` | UI components package |
| `auth` | Authentication package |
| `database` | Database package |
| `cloudflare` | Cloudflare package |
| `deps` | Dependencies |
| `config` | Configuration |
| `workflow` | GitHub Actions |

## Examples

### feat
```
feat(dashboard): add domain management page

Add new domain management interface with:
- Domain listing table
- DNS configuration panel
- Renewal status display

Closes #123
```

### fix
```
fix(ui): resolve button loading state issue

The Button component was not updating the loading state
correctly when the disabled prop was set.

Before: Button showed spinner even when disabled
After: Button correctly hides spinner when disabled

Fixes #456
```

### chore
```
chore(deps): update dependencies to latest versions

- next: 15.0.0 → 15.1.0
- react: 19.0.0 → 19.1.0
- turbo: 2.0.0 → 2.1.0
```

### docs
```
docs(readme): update installation instructions

Added troubleshooting section for common installation issues.
```

### refactor
```
refactor(shared): extract validation utilities

Moved validation functions to separate module for reusability.
```

### test
```
test(ui): add tests for Button component

Added tests for:
- Default button state
- Loading state
- Disabled state
- Size variants
```

### ci
```
ci(workflows): add deployment workflow

Added GitHub Actions workflow for:
- Build verification
- Preview deployments
- Production deployments
```

## Rules

1. **Lowercase type**: Always use lowercase
2. **No period at end**: Don't end with period
3. **Imperative mood**: "add" not "added" or "adds"
4. **Max 72 characters**: Keep subject line short
5. **Reference issues**: Include issue numbers in footer

## Good vs Bad Commits

### Good
```
feat(web): add contact form

Add contact form component with:
- Name, email, message fields
- Client-side validation
- Submission to API endpoint

Closes #100
```

### Bad
```
Fixed stuff

Changed some things to make it work

update file

WIP

Fixed bug #123
```

## Commit Message Anatomy

```
feat(dashboard): add user profile page

Added new user profile page with settings management.
Includes form validation and save functionality.

BREAKING CHANGE: Updated user settings schema
Closes #123
Ref: #456
```

## Reverting

```
revert: feat(auth): add password reset functionality

This reverts commit abc123def456.

Reason: Security issue discovered in reset flow
```

## Breaking Changes

```
feat(api)!: change authentication endpoint

Changed /api/auth/login to /api/v1/auth/login

BREAKING CHANGE: Update client integrations
```

## Tips

1. **Atomic commits**: One logical change per commit
2. **Descriptive messages**: Explain "why", not just "what"
3. **Small changes**: Easier to review and revert
4. **Regular commits**: Don't let changes pile up
5. **Review before push**: Check commit messages
