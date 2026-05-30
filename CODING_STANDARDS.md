# Coding Standards

## Overview

These standards ensure code quality, maintainability, and consistency across the SitesBD Platform.

## TypeScript

### Strict Mode
- TypeScript strict mode is **enabled** for all packages
- No `any` types allowed
- Use explicit types for all function parameters and return values

### Type Definitions
```typescript
// Good
function getUserById(id: string): Promise<User> {
  // implementation
}

// Bad
function getUserById(id: any): any {
  // implementation
}
```

### Interfaces over Types
Use interfaces for object shapes:
```typescript
// Preferred
interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

// Acceptable for unions
type Status = 'pending' | 'active' | 'inactive';
```

## React Components

### Server Components First
- Use Server Components by default in Next.js 15
- Add `'use client'` only when necessary

### Component Structure
```typescript
// Good
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <div>{user.name}</div>;
}

// Bad - Client component when not needed
'use client';
export function UserProfile({ userId }: { userId: string }) {
  // client side fetching
}
```

### Component Organization
1. Imports (external, internal, types)
2. Type definitions
3. Helper functions
4. Main component
5. Exports

## Shared Packages

### No Business Logic in UI
- UI components should be presentation only
- Business logic goes in shared packages or server actions
- Components receive data and callbacks, not business logic

### Type Export Pattern
```typescript
// packages/shared/src/types/user.ts
export interface User {
  id: string;
  email: string;
}

// packages/shared/src/index.ts
export * from './types/user';
```

## File Structure

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: SCREAMING_SNAKE_CASE (`API_ROUTES.ts`)
- Types/Interfaces: PascalCase (`UserProfileProps.ts`)

### Barrel Exports
Use index files for clean imports:
```typescript
// packages/shared/src/index.ts
export * from './constants';
export * from './types';
export * from './utils';
```

## Error Handling

### Typed Errors
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Usage
throw new AppError('User not found', 'USER_NOT_FOUND', 404);
```

### Never Expose Sensitive Data
```typescript
// Bad
catch (error) {
  console.error('Database connection failed:', error.connectionString);
  return { error: error.stack }; // Exposes internals
}

// Good
catch (error) {
  console.error('Database connection failed');
  return { error: 'An error occurred' }; // Safe
}
```

## Performance

### Server Actions
- Prefer server actions for mutations
- Use optimistic updates when appropriate
- Implement proper loading states

### Bundle Size
- Keep shared packages lightweight
- Use dynamic imports for heavy components
- Tree-shake unused exports

## Testing Standards

- Test business logic, not implementation details
- Use RTL for React component tests
- Aim for meaningful test coverage over 100% coverage

## Git Conventions

### Commit Messages
```
feat: add user profile component
fix: resolve dashboard loading issue
docs: update README
refactor: extract shared types
```

### Branch Naming
```
feature/user-dashboard
fix/domain-validation
docs/api-reference
```

## Review Checklist

Before merging PRs, ensure:
- [ ] No `any` types introduced
- [ ] Strict TypeScript checks pass
- [ ] Components are appropriately server/client
- [ ] Business logic is not in UI components
- [ ] Error handling is in place
- [ ] No sensitive data exposed
