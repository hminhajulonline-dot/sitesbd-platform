# SitesBD Authentication UI Documentation

## Overview

This document describes the authentication UI system for SitesBD Platform, including pages, components, validation, and integration with Supabase Auth.

## Pages

### Login Page (`/login`)

**Route:** `apps/web/src/app/(auth)/login/page.tsx`

**Features:**
- Email input field
- Password input with show/hide toggle
- Remember me checkbox
- Forgot password link
- Register link
- Form validation with React Hook Form + Zod
- Loading states
- Error states
- Success redirects

**Validation Schema:**
```typescript
{
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
}
```

**Redirect Logic:**
- Admin/Super Admin/System Owner → `/admin/dashboard`
- Regular users → `/dashboard`
- Unverified email → `/verify-email`

---

### Register Page (`/register`)

**Route:** `apps/web/src/app/(auth)/register/page.tsx`

**Features:**
- Full name field (required)
- Email field (required)
- Phone field (optional, validated as E.164 format)
- Password field with strength indicator
- Confirm password field
- Terms acceptance checkbox
- Form validation
- Loading states
- Error states

**Validation Schema:**
```typescript
{
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true),
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Post-Registration:**
1. Create auth user with Supabase
2. Create profile record
3. Assign default 'user' role
4. Redirect to `/verify-email`

---

### Forgot Password Page (`/forgot-password`)

**Route:** `apps/web/src/app/(auth)/forgot-password/page.tsx`

**Features:**
- Email input field
- Send reset link button
- Success state after email sent
- Error handling

**Flow:**
1. User enters email
2. System calls `supabase.auth.resetPasswordForEmail()`
3. Display success message
4. Link to login page

---

### Reset Password Page (`/reset-password`)

**Route:** `apps/web/src/app/(auth)/reset-password/page.tsx`

**Features:**
- Token validation on mount
- New password field with strength indicator
- Confirm password field
- Password requirements display
- Loading states
- Error states

**Token Handling:**
- Exchange code for session (OAuth callback)
- Check for existing session (token-based reset)
- Display invalid state if token expired

---

### Verify Email Page (`/verify-email`)

**Route:** `apps/web/src/app/(auth)/verify-email/page.tsx`

**Features:**
- Email verification status check
- Resend verification email button
- 60-second cooldown for resend
- Manual verification confirmation button
- Success state when verified

**Flow:**
1. Check current user
2. If email already verified → redirect to dashboard
3. Display verification pending state
4. Allow resend with cooldown
5. Manual check triggers re-verification

---

## UI Components

### Auth Components (`@sitesbd/ui`)

All auth components are exported from `@sitesbd/ui`:

```typescript
// Auth components
export { PasswordInput } from './components/auth/password-input';
export { AuthButton } from './components/auth/auth-button';
export { AuthDivider } from './components/auth/auth-divider';
export { AuthAlert } from './components/auth/auth-alert';
export { AuthHeader } from './components/auth/auth-header';

// Layout components
export { AuthLayout } from './components/layout/auth-layout';
```

---

### PasswordInput

**Location:** `packages/ui/src/components/auth/password-input.tsx`

**Props:**
```typescript
interface PasswordInputProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}
```

**Features:**
- Show/hide password toggle
- Eye/EyeOff icons
- Error message display
- ARIA attributes for accessibility

---

### AuthButton

**Location:** `packages/ui/src/components/auth/auth-button.tsx`

**Props:**
```typescript
interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}
```

**Variants:**
- `primary` - Blue background, white text
- `secondary` - Gray background
- `outline` - Blue border, transparent background
- `ghost` - Transparent background

**Features:**
- Loading spinner with Loader2 icon
- Loading text support
- Full-width option
- Disabled state styling

---

### AuthDivider

**Location:** `packages/ui/src/components/auth/auth-divider.tsx`

**Props:**
```typescript
interface AuthDividerProps {
  text?: string;
}
```

**Features:**
- Horizontal line with optional center text
- Dark mode support
- Used to separate form sections

---

### AuthAlert

**Location:** `packages/ui/src/components/auth/auth-alert.tsx`

**Props:**
```typescript
interface AuthAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}
```

**Variants:**
- `info` - Blue styling
- `success` - Green styling
- `warning` - Yellow styling
- `error` - Red styling

**Features:**
- Icon based on variant
- Optional dismiss button
- ARIA role="alert"

---

### AuthHeader

**Location:** `packages/ui/src/components/auth/auth-header.tsx`

**Props:**
```typescript
interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  logo?: React.ReactNode;
}
```

**Features:**
- Title and subtitle display
- Optional back button
- Optional logo slot

---

### AuthLayout

**Location:** `packages/ui/src/components/layout/auth-layout.tsx`

**Props:**
```typescript
interface AuthLayoutProps {
  children: ReactNode;
  showBrandPanel?: boolean;
}
```

**Features:**
- Responsive layout
- Desktop: shows brand panel on right
- Mobile: single column
- Brand panel with gradient background
- Feature highlights
- Footer with copyright

---

## Form Validation

### Technology Stack

- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Zod resolver for React Hook Form

### Validation Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

---

## Supabase Integration

### Client Configuration

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
```

### Auth Operations

| Operation | Function | Page |
|-----------|----------|------|
| Sign In | `supabase.auth.signInWithPassword()` | login |
| Sign Up | `supabase.auth.signUp()` | register |
| Sign Out | `supabase.auth.signOut()` | reset-password |
| Reset Password | `supabase.auth.resetPasswordForEmail()` | forgot-password |
| Update Password | `supabase.auth.updateUser()` | reset-password |
| Get User | `supabase.auth.getUser()` | verify-email |
| Resend Email | `supabase.auth.resend()` | verify-email |

### Error Handling

All Supabase operations are wrapped in try-catch blocks:

```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    // Handle error
    setError(error.message);
    return;
  }
  
  // Handle success
} catch (err) {
  // Handle unexpected errors
  setError('An unexpected error occurred');
}
```

---

## Brand Identity

### Color Palette

**Primary:** `#2563eb` (Blue 600)
**Primary Hover:** `#1d4ed8` (Blue 700)

Used for:
- Primary buttons
- Links
- Focus rings
- Brand panel gradient

### Typography

**Font Family:** System font stack (Tailwind default)

**Headings:**
- Title: `text-2xl font-bold`

**Body:**
- Regular: `text-sm`
- Large: `text-base`

### Spacing

**Form Fields:**
- Input padding: `px-4 py-3`
- Field spacing: `space-y-5`

**Container:**
- Max width: `max-w-md`
- Padding: `px-4 sm:px-6 lg:px-8`

---

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual flow
- Focus indicators on all focusable elements

### ARIA Support

- `aria-invalid` on invalid inputs
- `aria-describedby` for error messages
- `aria-label` on icon buttons
- `role="alert"` on error messages

### Screen Reader

- Proper label associations
- Error messages announced
- Loading states announced

---

## Responsive Design

### Mobile First

**Base styles** apply to mobile devices.

### Tablet (md:)

- Slightly larger padding
- Adjusted form spacing

### Desktop (lg:)

- Brand panel visible
- Larger max-width
- Better visual balance

---

## Testing

### Validation Tests

**Location:** `apps/web/src/__tests__/auth/validation.test.ts`

**Test Coverage:**
- Login validation
- Register validation
- Forgot password validation
- Password strength calculation

### Running Tests

```bash
npm test
```

---

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   └── (auth)/
│   │       ├── layout.tsx           # Auth root layout
│   │       ├── login/page.tsx       # Login page
│   │       ├── register/page.tsx    # Register page
│   │       ├── forgot-password/page.tsx
│   │       ├── reset-password/page.tsx
│   │       └── verify-email/page.tsx
│   └── __tests__/
│       └── auth/
│           └── validation.test.ts   # Validation tests
└── package.json

packages/ui/
└── src/
    └── components/
        ├── auth/
        │   ├── index.ts
        │   ├── password-input.tsx
        │   ├── auth-button.tsx
        │   ├── auth-divider.tsx
        │   ├── auth-alert.tsx
        │   └── auth-header.tsx
        └── layout/
            ├── index.ts
            └── auth-layout.tsx
```

---

## Future Enhancements

### Planned Features

1. **Two-Factor Authentication (2FA)**
   - TOTP integration
   - SMS/Email OTP support

2. **Social Authentication**
   - Google
   - GitHub
   - Microsoft

3. **Password Recovery**
   - Security questions
   - Recovery codes

4. **Session Management**
   - Active sessions list
   - Device management
   - Logout from all devices

5. **Remember Me Functionality**
   - Extended session expiry
   - Persistent login option

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome for Android)