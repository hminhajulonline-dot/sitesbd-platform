-- ============================================
-- Enums for SitesBD Platform
-- ============================================

-- User status enum
CREATE TYPE user_status AS ENUM (
  'pending',
  'active',
  'suspended'
);

-- Domain status enum
CREATE TYPE domain_status AS ENUM (
  'available',
  'reserved',
  'pending',
  'active',
  'suspended',
  'expired',
  'archived'
);

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM (
  'pending',
  'paid',
  'cancelled',
  'refunded'
);

-- Ticket status enum
CREATE TYPE ticket_status AS ENUM (
  'open',
  'processing',
  'resolved',
  'closed'
);

-- Role type enum
CREATE TYPE role_type AS ENUM (
  'system_owner',
  'super_admin',
  'admin',
  'billing_manager',
  'support_agent',
  'user'
);

-- DNS record type enum
CREATE TYPE dns_record_type AS ENUM (
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SOA',
  'SRV',
  'CAA',
  'DS',
  'DNSKEY',
  'RRSIG',
  'NAPTR',
  'PTR'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

-- Payment method enum
CREATE TYPE payment_method AS ENUM (
  'card',
  'bank_transfer',
  'bkash',
  'nagad',
  'rocket',
  'other'
);

-- DNS sync status enum
CREATE TYPE dns_sync_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

-- Comment
CREATE TYPE comment_type AS ENUM (
  'note',
  'resolution',
  'internal'
);
