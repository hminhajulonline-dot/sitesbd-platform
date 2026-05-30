# Quality Gates

## Overview

SitesBD Platform enforces quality gates to ensure code quality, security, and reliability before merging to protected branches.

## Quality Gate Requirements

All pull requests must pass the following quality gates before merge.

### Required Checks

| Gate | Command | Timeout | Required |
|------|---------|---------|----------|
| Build | `npm run build` | 10 min | ✓ |
| Lint | `npm run lint` | 5 min | ✓ |
| Type Check | `npm run type-check` | 5 min | ✓ |
| Formatting | `npm run format -- --check` | 3 min | ✓ |

### Automated Enforcement

Quality gates are enforced through:
1. **GitHub Actions CI**: Runs on every PR
2. **Branch Protection**: Required status checks on main/develop
3. **Vercel Deployments**: Preview builds for testing

## Gate Descriptions

### 1. Build Gate

**Command**: `npm run build`

**Purpose**: Verify project builds successfully

**Success Criteria**:
- All applications build without errors
- No missing dependencies
- Output directories created correctly

**Failure Resolution**:
1. Check for missing imports
2. Verify all dependencies installed
3. Review build error messages

### 2. Lint Gate

**Command**: `npm run lint`

**Purpose**: Ensure code follows style guidelines

**Success Criteria**:
- ESLint passes with no errors
- No `console.log` statements
- No disabled rules
- Code follows patterns in CODING_STANDARDS.md

**Failure Resolution**:
1. Run `npm run lint -- --fix` to auto-fix
2. Review ESLint output for issues
3. Check .eslintrc.js configuration

### 3. Type Check Gate

**Command**: `npm run type-check`

**Purpose**: Verify TypeScript types are correct

**Success Criteria**:
- TypeScript compiles with no errors
- No `any` types introduced
- Strict mode enabled
- All types properly defined

**Failure Resolution**:
1. Add proper type annotations
2. Remove any usage of `any`
3. Update type definitions
4. Run `tsc --noEmit` for detailed errors

### 4. Formatting Gate

**Command**: `npm run format -- --check`

**Purpose**: Ensure consistent code formatting

**Success Criteria**:
- Prettier passes with no changes needed
- Consistent code style

**Failure Resolution**:
1. Run `npm run format` to auto-format
2. Commit formatted changes

## Pre-Merge Checklist

Before requesting review, ensure:

- [ ] `npm run build` passes locally
- [ ] `npm run lint` passes locally
- [ ] `npm run type-check` passes locally
- [ ] `npm run format` shows no changes needed
- [ ] No `any` types introduced
- [ ] No `console.log` statements
- [ ] Tests written (if applicable)
- [ ] Documentation updated

## PR Requirements

### Description Requirements

Every PR must include:
- Clear summary of changes
- List of files modified
- Testing performed
- Screenshots for UI changes
- Link to related issues

### Review Requirements

- Minimum 1 reviewer approval
- All CI checks passing
- No unresolved comments
- Up to date with target branch

### Branch Requirements

- Targets `develop` for features
- Targets `main` for releases/hotfixes
- Rebased on latest target branch
- No merge commits (squash only)

## CI Configuration

### GitHub Actions Workflow

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
```

### Branch Protection Rules

Configure in GitHub Settings:

| Branch | Required Checks | Required Reviews |
|--------|-----------------|------------------|
| main | ci, lint, typecheck | 1 |
| develop | ci, lint, typecheck | 1 |

## Quality Metrics

### Code Coverage Goals

| Type | Target |
|------|--------|
| Shared packages | 80%+ |
| UI components | 70%+ |
| Server actions | 80%+ |

### Performance Targets

| Metric | Target |
|--------|--------|
| Build time | < 5 minutes |
| Lint time | < 2 minutes |
| Type check time | < 3 minutes |

## Failed Gates

### If Build Fails

1. **Don't push more commits** - fix locally first
2. Run `npm run build` and fix errors
3. Check for circular dependencies
4. Verify environment variables

### If Lint Fails

1. Run `npm run lint -- --fix` to auto-fix
2. Review remaining errors manually
3. Update .eslintrc.js only if needed
4. Add eslint-disable comments sparingly

### If Type Check Fails

1. Run `tsc --noEmit` locally
2. Add proper types to all functions
3. Remove any `any` types
4. Use `unknown` instead of `any` where needed

### If Formatting Fails

1. Run `npm run format` locally
2. Commit formatted changes
3. Don't mix formatting with other changes

## Continuous Improvement

Quality gates are reviewed quarterly:
1. Analyze failure patterns
2. Update requirements if needed
3. Add new gates as necessary
4. Document rule exceptions

## Exceptions

### Emergency Fixes

For critical production issues:
1. Merge with failing checks if approved
2. Document exception in PR
3. Create follow-up ticket for fixes
4. Post-mortem within 48 hours

### Documentation Only

For docs-only PRs:
- Skip build check
- Lint and type-check still required
- Reduced review requirements

## Tooling

| Tool | Purpose | Version |
|------|---------|---------|
| ESLint | Linting | 9.x |
| Prettier | Formatting | 3.x |
| TypeScript | Type checking | 5.x |
| Turbo | Build orchestration | 2.x |
| Next.js | Framework | 15.x |
