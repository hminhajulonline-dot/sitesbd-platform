# Domains RLS Policy Planning

## Overview
Row Level Security (RLS) policies for the `domains` table.

## Policy: Users can view own domains
Users can only view their own domains.

```sql
CREATE POLICY "Users can view own domains"
ON domains FOR SELECT
USING (auth.uid() = user_id);
```

## Policy: Users can create domains
Users can create domains for themselves.

```sql
CREATE POLICY "Users can create domains"
ON domains FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Policy: Users can update own domains
Users can update their own domains.

```sql
CREATE POLICY "Users can update own domains"
ON domains FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Policy: Users can delete own domains
Users can delete their own domains.

```sql
CREATE POLICY "Users can delete own domains"
ON domains FOR DELETE
USING (auth.uid() = user_id);
```

## Policy: Admins can manage all domains
Admin users can view, update, and delete any domain.

```sql
CREATE POLICY "Admins can view all domains"
ON domains FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'admin')
  )
);

CREATE POLICY "Admins can update any domain"
ON domains FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'admin')
  )
);
```
