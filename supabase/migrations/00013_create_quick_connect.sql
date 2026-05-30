-- ============================================
-- Quick Connect Tables
-- ============================================

-- Quick connect platforms table
CREATE TABLE quick_connect_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  status platform_status NOT NULL DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quick connect templates table
CREATE TABLE quick_connect_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES quick_connect_platforms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status platform_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quick connect fields table
CREATE TABLE quick_connect_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES quick_connect_platforms(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  required BOOLEAN DEFAULT FALSE,
  placeholder VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Connection guides table
CREATE TABLE connection_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES quick_connect_platforms(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  status guide_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform_id, slug)
);

-- Indexes
CREATE INDEX idx_quick_connect_platforms_slug ON quick_connect_platforms(slug);
CREATE INDEX idx_quick_connect_platforms_status ON quick_connect_platforms(status);
CREATE INDEX idx_quick_connect_platforms_sort_order ON quick_connect_platforms(sort_order);
CREATE INDEX idx_quick_connect_templates_platform_id ON quick_connect_templates(platform_id);
CREATE INDEX idx_quick_connect_fields_platform_id ON quick_connect_fields(platform_id);
CREATE INDEX idx_quick_connect_fields_sort_order ON quick_connect_fields(sort_order);
CREATE INDEX idx_connection_guides_platform_id ON connection_guides(platform_id);
CREATE INDEX idx_connection_guides_slug ON connection_guides(slug);
CREATE INDEX idx_connection_guides_status ON connection_guides(status);

-- Triggers for updated_at
CREATE TRIGGER quick_connect_platforms_updated_at
  BEFORE UPDATE ON quick_connect_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER quick_connect_templates_updated_at
  BEFORE UPDATE ON quick_connect_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER connection_guides_updated_at
  BEFORE UPDATE ON connection_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
