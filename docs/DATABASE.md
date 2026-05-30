# Database Documentation

## Overview

SitesBD Platform will use Supabase as its primary database solution.

## Planned Schema

### Users
```sql
-- To be implemented in future PRs
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Domains
```sql
-- To be implemented in future PRs
domains (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  domain TEXT UNIQUE NOT NULL,
  status TEXT,
  created_at TIMESTAMP
)
```

### Hosting
```sql
-- To be implemented in future PRs
hosting (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  domain_id UUID REFERENCES domains(id),
  plan TEXT,
  status TEXT,
  created_at TIMESTAMP
)
```

### Billing
```sql
-- To be implemented in future PRs
billing (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL,
  status TEXT,
  created_at TIMESTAMP
)
```

## Migrations

Database migrations will be managed using Supabase CLI or a similar tool in future PRs.

## Indexes

Indexes will be created for:
- User email lookups
- Domain user associations
- Billing user associations

## Row Level Security (RLS)

RLS policies will be configured to ensure users can only access their own data.
