# Profiles RLS Policy Planning

## Overview
Row Level Security (RLS) policies for the `profiles` table.

## Policy: User owns own profile
Users can only view and update their own profile.

```sql
-- View own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Policy: Admins can view all profiles
Admin users can view all profiles in the system.

```sql
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'admin')
  )
);
```

## Policy: Admins can update profiles
Admin users can update any profile.

```sql
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'admin')
  )
);
```

## Policy: System Owner can delete profiles
Only System Owner can delete user profiles.

```sql
CREATE POLICY "System Owner can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type = 'system_owner'
  )
);
```
