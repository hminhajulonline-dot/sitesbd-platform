-- ============================================
-- Cloudflare Tables
-- ============================================

-- Cloudflare zones table
CREATE TABLE cloudflare_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  zone_id VARCHAR(255) NOT NULL UNIQUE,
  zone_name VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  plan VARCHAR(50),
  name_servers TEXT[],
  verification_status VARCHAR(50),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DNS sync jobs table
CREATE TABLE dns_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES cloudflare_zones(id) ON DELETE CASCADE,
  status dns_sync_status NOT NULL DEFAULT 'pending',
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DNS snapshots table
CREATE TABLE dns_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES cloudflare_zones(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  record_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cloudflare_zones_domain_id ON cloudflare_zones(domain_id);
CREATE INDEX idx_cloudflare_zones_zone_id ON cloudflare_zones(zone_id);
CREATE INDEX idx_cloudflare_zones_zone_name ON cloudflare_zones(zone_name);
CREATE INDEX idx_dns_sync_jobs_zone_id ON dns_sync_jobs(zone_id);
CREATE INDEX idx_dns_sync_jobs_status ON dns_sync_jobs(status);
CREATE INDEX idx_dns_snapshots_zone_id ON dns_snapshots(zone_id);
CREATE INDEX idx_dns_snapshots_created_at ON dns_snapshots(created_at);

-- Triggers for updated_at
CREATE TRIGGER cloudflare_zones_updated_at
  BEFORE UPDATE ON cloudflare_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
