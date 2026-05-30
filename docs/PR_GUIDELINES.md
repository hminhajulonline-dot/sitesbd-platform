# Pull Request Guidelines

## Overview

This document outlines the process for creating and merging pull requests.

## PR Structure

1. **Title**: Clear, concise description
2. **Description**: Summary of changes and motivation
3. **Type**: Bug fix, feature, refactor, docs
4. **Testing**: How changes were verified
5. **Screenshots**: Visual evidence (if applicable)

## PR Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Push branch and open PR
4. Address review comments
5. Squash and merge when approved

## Review Checklist

- [ ] Code follows coding standards
- [ ] TypeScript strict mode passes
- [ ] No `any` types introduced
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log/debug code
- [ ] Environment variables documented

## Merge Requirements

- All CI checks passing
- At least one approval (for non-docs changes)
- No unresolved review comments
- Up to date with main branch

## PR Labels

- `bug` - Bug fix
- `feature` - New feature
- `enhancement` - Improvement
- `docs` - Documentation only
- `refactor` - Code refactoring
- `security` - Security related
