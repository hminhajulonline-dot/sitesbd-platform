-- ============================================
-- OTP Tables and Enums for SitesBD Platform
-- ============================================

-- OTP Purpose Enum
CREATE TYPE otp_purpose AS ENUM (
  'registration',
  'forgot_password',
  'email_change',
  'admin_login'
);

-- OTP Status Enum
CREATE TYPE otp_status AS ENUM (
  'pending',
  'verified',
  'expired',
  'used'
);

-- ============================================
-- Email OTP Table
-- ============================================
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email address the OTP is sent to
  email VARCHAR(255) NOT NULL,
  
  -- 6-digit OTP code (hashed in production)
  otp_code VARCHAR(6) NOT NULL,
  
  -- Purpose of the OTP
  purpose otp_purpose NOT NULL DEFAULT 'registration',
  
  -- Current status of the OTP
  status otp_status NOT NULL DEFAULT 'pending',
  
  -- When the OTP expires (5 minutes from creation)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  
  -- When the OTP was verified (null if not yet verified)
  verified_at TIMESTAMPTZ,
  
  -- Number of verification attempts
  attempt_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT email_otps_email_purpose_unique UNIQUE (email, purpose)
);

-- Index for finding active OTPs by email
CREATE INDEX idx_email_otps_email ON email_otps(email);

-- Index for finding OTPs by status and expiration
CREATE INDEX idx_email_otps_status_expires ON email_otps(status, expires_at);

-- Index for cleanup of expired OTPs
CREATE INDEX idx_email_otps_expires_at ON email_otps(expires_at) WHERE status = 'pending';

-- ============================================
-- OTP Rate Limiting Table
-- ============================================
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email being rate limited
  email VARCHAR(255) NOT NULL,
  
  -- Purpose of the rate limit
  purpose otp_purpose NOT NULL,
  
  -- When the rate limit window started
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- When the rate limit expires
  window_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 seconds'),
  
  -- Number of OTP requests in this window
  request_count INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT otp_rate_limits_email_purpose_unique UNIQUE (email, purpose)
);

-- Index for checking rate limits
CREATE INDEX idx_otp_rate_limits_lookup ON otp_rate_limits(email, purpose, window_end);

-- ============================================
-- Functions
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_otps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER email_otps_updated_at
  BEFORE UPDATE ON email_otps
  FOR EACH ROW
  EXECUTE FUNCTION update_email_otps_timestamp();

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE email_otps 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment attempt count
CREATE OR REPLACE FUNCTION increment_otp_attempt(p_otp_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE email_otps 
  SET attempt_count = attempt_count + 1 
  WHERE id = p_otp_id
  RETURNING attempt_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage all OTP records (for admin operations)
CREATE POLICY "Service role full access to email_otps"
  ON email_otps FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can manage all rate limit records
CREATE POLICY "Service role full access to otp_rate_limits"
  ON otp_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only insert into rate limits (for tracking their own requests)
CREATE POLICY "Users can insert rate limits"
  ON otp_rate_limits FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Users can update their own rate limits (increment count)
CREATE POLICY "Users can update own rate limits"
  ON otp_rate_limits FOR UPDATE
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE email_otps IS 'Stores OTP codes for email verification during registration and password reset';
COMMENT ON COLUMN email_otps.email IS 'Email address the OTP is sent to';
COMMENT ON COLUMN email_otps.otp_code IS '6-digit OTP code (should be hashed in production)';
COMMENT ON COLUMN email_otps.purpose IS 'Purpose of the OTP: registration, forgot_password, email_change, admin_login';
COMMENT ON COLUMN email_otps.status IS 'Current status: pending, verified, expired, used';
COMMENT ON COLUMN email_otps.expires_at IS 'When the OTP expires (default 5 minutes from creation)';
COMMENT ON COLUMN email_otps.verified_at IS 'Timestamp when OTP was successfully verified';
COMMENT ON COLUMN email_otps.attempt_count IS 'Number of failed verification attempts';
COMMENT ON COLUMN email_otps.attempt_count IS 'Number of failed verification attempts';

COMMENT ON TABLE otp_rate_limits IS 'Tracks OTP request rate limits per email per purpose';
COMMENT ON COLUMN otp_rate_limits.window_start IS 'When the rate limit window started';
COMMENT ON COLUMN otp_rate_limits.window_end IS 'When the rate limit window expires';
COMMENT ON COLUMN otp_rate_limits.request_count IS 'Number of OTP requests in this window';