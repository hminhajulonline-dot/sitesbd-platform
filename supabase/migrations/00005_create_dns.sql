-- ============================================
-- DNS Tables
-- ============================================

-- DNS records table
CREATE TABLE dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  record_type dns_record_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  priority INTEGER,
  ttl INTEGER DEFAULT 3600,
  proxied BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DNS templates table
CREATE TABLE dns_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DNS template records table
CREATE TABLE dns_template_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES dns_templates(id) ON DELETE CASCADE,
  record_type dns_record_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  priority INTEGER,
  ttl INTEGER DEFAULT 3600,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TXT rules table
CREATE TABLE txt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  pattern TEXT NOT NULL,
  replacement TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX idx_dns_records_record_type ON dns_records(record_type);
CREATE INDEX idx_dns_records_name ON dns_records(name);
CREATE INDEX idx_dns_records_is_active ON dns_records(is_active);
CREATE INDEX idx_dns_templates_user_id ON dns_templates(user_id);
CREATE INDEX idx_dns_template_records_template_id ON dns_template_records(template_id);
CREATE INDEX idx_txt_rules_domain_id ON txt_rules(domain_id);
CREATE INDEX idx_txt_rules_is_active ON txt_rules(is_active);

-- Triggers for updated_at
CREATE TRIGGER dns_records_updated_at
  BEFORE UPDATE ON dns_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER dns_templates_updated_at
  BEFORE UPDATE ON dns_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER txt_rules_updated_at
  BEFORE UPDATE ON txt_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
