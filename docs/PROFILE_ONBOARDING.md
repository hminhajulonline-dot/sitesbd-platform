# Profile & Onboarding Documentation

## Overview

This document describes the profile completion and onboarding system for SitesBD Platform. After authentication, users must complete their profile before accessing the dashboard.

## Onboarding Flow

```
Register → Verify Email → Login → Check Profile Completion
                                              ↓
                          If Incomplete: Onboarding Wizard
                                              ↓
                          Profile Completed → Dashboard
```

## Routes

| Route | Description |
|-------|-------------|
| `/onboarding` | Multi-step profile completion wizard |
| `/profile/setup` | Basic profile information setup |
| `/profile/preferences` | User preferences configuration |

## Profile Completion Calculation

Profile completion is calculated based on the following fields:

| Field | Weight | Description |
|-------|--------|-------------|
| Full Name | 20% | User's full name |
| Phone | 15% | User's phone number |
| Country | 20% | User's country (derived from timezone) |
| Timezone | 20% | User's timezone |
| Language | 25% | User's preferred language |

### Completion Status

- **0-35%**: Incomplete - User is redirected to onboarding
- **36-75%**: Partial - Some fields completed
- **76-99%**: Almost complete - Minor fields missing
- **100%**: Complete - User can access dashboard

## Onboarding Wizard Steps

### Step 1: Basic Information
- Full Name (required)
- Phone Number (optional)

### Step 2: Location
- Country (required)
- Timezone (required)

### Step 3: Preferences
- Language (required)
- Theme Preference (light/dark/system)
- Email Notifications (optional)
- WhatsApp Notifications (optional)

### Step 4: Avatar
- Profile picture upload (optional)
- Skip option available

### Step 5: Review
- Summary of entered information
- Edit options for each section
- Confirm and complete

## Database Integration

### Tables Used

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Foreign key to auth.users |
| email | VARCHAR | User email |
| full_name | VARCHAR | User's full name |
| phone | VARCHAR | Phone number |
| avatar_url | TEXT | Profile picture URL |
| status | user_status | Profile status |

#### `user_preferences`
| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Foreign key to auth.users |
| theme | VARCHAR | Theme preference |
| language | VARCHAR | Language preference |
| timezone | VARCHAR | Timezone |
| notification_email | BOOLEAN | Email notifications |
| notification_whatsapp | BOOLEAN | WhatsApp notifications |

## Redirect Logic

### Unauthenticated Users
- Redirect to `/login` when accessing protected routes
- Preserve intended destination with `?redirect=` parameter

### Authenticated Users with Incomplete Profile
- Redirect to `/onboarding` when accessing dashboard
- Show onboarding wizard on login

### Authenticated Users with Complete Profile
- Redirect to `/dashboard` when accessing auth routes
- Skip onboarding

## Components

### UI Components

| Component | Description |
|----------|-------------|
| `ProfileWizard` | Multi-step onboarding wizard container |
| `WizardStep` | Individual step wrapper |
| `ProgressIndicator` | Step progress visualization |
| `AvatarUploader` | Profile picture upload with preview |
| `ProfileReview` | Review summary before submission |

### Service

| Service | Description |
|---------|-------------|
| `ProfileCompletionService` | Profile completion calculation and tracking |

## Validation

### Validation Libraries
- **Zod**: Schema validation
- **React Hook Form**: Form state management

### Validation Schemas

#### Basic Information
```typescript
{
  fullName: string (min 2 chars),
  phone: string (optional)
}
```

#### Location
```typescript
{
  country: string (required),
  timezone: string (required)
}
```

#### Preferences
```typescript
{
  language: string (required),
  theme: 'light' | 'dark' | 'system',
  emailNotifications: boolean,
  whatsappNotifications: boolean
}
```

## Accessibility

- Keyboard navigation for all steps
- ARIA labels on interactive elements
- Proper focus management
- Error states with descriptive messages
- Screen reader friendly

## Responsive Design

- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## Testing

### Test Coverage

| Test | Description |
|------|-------------|
| Profile Completion Calculation | Verify percentage calculation |
| Missing Fields Detection | Verify missing field identification |
| Wizard Validation | Verify step validation |
| Preferences Validation | Verify preference validation |

### Running Tests

```bash
npm run test
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Security Considerations

- Users can only access their own profile data
- Middleware validates authentication on protected routes
- Profile completion status is server-side validated
- No sensitive data exposed in client-side calculations
