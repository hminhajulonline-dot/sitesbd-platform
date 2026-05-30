# Versioning Strategy

## Overview

SitesBD Platform uses Semantic Versioning (SemVer) for clear, predictable version management.

## Version Format

```
MAJOR.MINOR.PATCH
```

| Part | Description | When to Increment |
|------|-------------|-------------------|
| MAJOR | Breaking changes | Incompatible API changes |
| MINOR | New functionality | Backward-compatible features |
| PATCH | Bug fixes | Backward-compatible patches |

## Version Examples

| Version | Type | Description |
|---------|------|-------------|
| 1.0.0 | Initial | First production release |
| 1.1.0 | Minor | New feature added |
| 1.1.1 | Patch | Bug fix |
| 2.0.0 | Major | Breaking changes |

## Version Lifecycle

```
1.0.0 (initial)
    ↓
1.0.1 (patch) ← Bug fixes
    ↓
1.0.2 (patch)
    ↓
1.1.0 (minor) ← New features (backward compatible)
    ↓
1.1.1 (patch)
    ↓
2.0.0 (major) ← Breaking changes
```

## What Constitutes Each Type

### MAJOR (Breaking Changes)
- Removing API endpoints
- Changing response formats
- Renaming required fields
- Changing authentication methods
- Removing features
- Database schema migrations

### MINOR (New Features)
- Adding new API endpoints
- Adding optional fields to responses
- Adding new configuration options
- New UI features
- New packages or modules

### PATCH (Bug Fixes)
- Security patches
- Performance improvements
- Bug fixes
- Documentation updates
- Non-breaking dependency updates

## Versioning in Code

### package.json
```json
{
  "name": "@sitesbd/web",
  "version": "1.0.0",
  "private": true
}
```

### Package Versions

Individual packages follow their own versioning:
- `@sitesbd/shared`: 1.0.0
- `@sitesbd/ui`: 1.0.0
- etc.

### Shared Version

All packages share the same major/minor version. Patch versions may differ for individual package fixes.

## Version Tags

All releases are tagged in Git:
```bash
# Major release
git tag -a v2.0.0 -m "Major release with breaking changes"

# Minor release
git tag -a v1.2.0 -m "New features added"

# Patch release
git tag -a v1.1.1 -m "Bug fixes"
```

## Version Compatibility

| Application | Minimum Package Version | Notes |
|-------------|------------------------|-------|
| web | 1.0.0 | Landing website |
| dashboard | 1.0.0 | User dashboard |
| admin | 1.0.0 | Admin dashboard |

## Deprecation

When deprecating functionality:
1. Add deprecation notice to code
2. Update documentation
3. Announce in release notes
4. Provide migration path
5. Remove in next major version

## Version Bumping

Before release:
1. Review changes since last version
2. Determine version bump type
3. Update all package versions
4. Update changelog
5. Create git tag

## Pre-release Versions

For testing new features:
```
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

Usage:
```bash
# Alpha (internal testing)
npm version --preid alpha

# Beta (public testing)
npm version --preid beta

# Release candidate
npm version --preid rc
```
