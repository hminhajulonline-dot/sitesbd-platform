-- ============================================
-- Domains Tables
-- ============================================

-- Domains table
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain_name VARCHAR(255) NOT NULL,
  registrar VARCHAR(255),
  registration_date DATE,
  expiration_date DATE,
  auto_renew BOOLEAN DEFAULT FALSE,
  status domain_status NOT NULL DEFAULT 'pending',
  is_primary BOOLEAN DEFAULT FALSE,
  cloudflare_zone_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Domain reservations table
CREATE TABLE domain_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name VARCHAR(255) NOT NULL,
  reserved_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status domain_status NOT NULL DEFAULT 'reserved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Domain claims table
CREATE TABLE domain_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name VARCHAR(255) NOT NULL,
  claimed_by UUID NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status domain_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Domain activity logs table
CREATE TABLE domain_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_domain_name ON domains(domain_name);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_domains_cloudflare_zone_id ON domains(cloudflare_zone_id);
CREATE INDEX idx_domain_reservations_domain_name ON domain_reservations(domain_name);
CREATE INDEX idx_domain_reservations_reserved_by ON domain_reservations(reserved_by);
CREATE INDEX idx_domain_claims_domain_name ON domain_claims(domain_name);
CREATE INDEX idx_domain_claims_claimed_by ON domain_claims(claimed_by);
CREATE INDEX idx_domain_activity_logs_domain_id ON domain_activity_logs(domain_id);
CREATE INDEX idx_domain_activity_logs_user_id ON domain_activity_logs(user_id);
CREATE INDEX idx_domain_activity_logs_created_at ON domain_activity_logs(created_at);

-- Trigger for updated_at
CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER domain_reservations_updated_at
  BEFORE UPDATE ON domain_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER domain_claims_updated_at
  BEFORE UPDATE ON domain_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
