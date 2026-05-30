-- ============================================
-- Support Tables
-- ============================================

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  domain_id UUID REFERENCES domains(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Ticket messages table
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type comment_type DEFAULT 'note',
  is_internal BOOLEAN DEFAULT FALSE,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_domain_id ON tickets(domain_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_user_id ON ticket_messages(user_id);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at);

-- Triggers for updated_at
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ticket_messages_updated_at
  BEFORE UPDATE ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
