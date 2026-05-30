-- ============================================
-- Platform Foundation Enums
-- ============================================

-- Notification channel enum
CREATE TYPE notification_channel AS ENUM (
  'email',
  'whatsapp',
  'in_app'
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
  'info',
  'warning',
  'success',
  'error'
);

-- Announcement type enum
CREATE TYPE announcement_type AS ENUM (
  'info',
  'maintenance',
  'promotion',
  'warning'
);

-- Platform status enum
CREATE TYPE platform_status AS ENUM (
  'active',
  'inactive',
  'deprecated'
);

-- Guide status enum
CREATE TYPE guide_status AS ENUM (
  'draft',
  'published',
  'archived'
);
