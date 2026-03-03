-- Notifications for assignments, comments, SLA warnings, escalations
-- Run after 01_schema.sql. Uses existing users and tickets.

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  description TEXT,
  ticket_id  UUID REFERENCES tickets (id) ON DELETE SET NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

COMMENT ON COLUMN notifications.type IS 'assignment|comment|escalation|warning|success|new_ticket';
