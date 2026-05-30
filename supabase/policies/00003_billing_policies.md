# Billing RLS Policy Planning

## Overview
Row Level Security (RLS) policies for billing tables (invoices, invoice_items, payments).

## Policy: Users can view own invoices
Users can only view their own invoices.

```sql
CREATE POLICY "Users can view own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);
```

## Policy: Billing Managers can view all invoices
Billing managers can view all invoices in the system.

```sql
CREATE POLICY "Billing managers can view all invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'billing_manager')
  )
);
```

## Policy: Billing Managers can create/update invoices
Billing managers can create and update invoices.

```sql
CREATE POLICY "Billing managers can create invoices"
ON invoices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'billing_manager')
  )
);

CREATE POLICY "Billing managers can update invoices"
ON invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'billing_manager')
  )
);
```

## Policy: Users can view own payments
Users can only view their own payments.

```sql
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = payments.invoice_id
    AND i.user_id = auth.uid()
  )
);
```

## Policy: Billing Managers can process payments
Only billing managers can process payments.

```sql
CREATE POLICY "Billing managers can process payments"
ON payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'billing_manager')
  )
);
```
