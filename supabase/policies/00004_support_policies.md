# Support RLS Policy Planning

## Overview
Row Level Security (RLS) policies for support tables (tickets, ticket_messages).

## Policy: Users can view own tickets
Users can only view their own support tickets.

```sql
CREATE POLICY "Users can view own tickets"
ON tickets FOR SELECT
USING (auth.uid() = user_id);
```

## Policy: Users can create tickets
Users can create support tickets for themselves.

```sql
CREATE POLICY "Users can create tickets"
ON tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Policy: Users can update own tickets
Users can update their own tickets (only subject/description).

```sql
CREATE POLICY "Users can update own tickets"
ON tickets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Policy: Support Agents can view all tickets
Support agents can view all tickets in the system.

```sql
CREATE POLICY "Support agents can view all tickets"
ON tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'support_agent')
  )
);
```

## Policy: Support Agents can update tickets
Support agents can update any ticket status and assignment.

```sql
CREATE POLICY "Support agents can update tickets"
ON tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'support_agent')
  )
);
```

## Policy: Users can view own ticket messages
Users can view messages on their own tickets.

```sql
CREATE POLICY "Users can view own ticket messages"
ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_messages.ticket_id
    AND t.user_id = auth.uid()
  )
);
```

## Policy: Support Agents can view all ticket messages
Support agents can view all messages including internal ones.

```sql
CREATE POLICY "Support agents can view all messages"
ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_type IN ('system_owner', 'super_admin', 'support_agent')
  )
);
```
