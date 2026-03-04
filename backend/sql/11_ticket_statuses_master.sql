-- Ticket statuses master table (name + code for dropdown/labels).
-- Run once: node scripts/run-sql.cjs sql/11_ticket_statuses_master.sql
-- tickets.status remains ticket_status enum; use this table for display and ordering.

CREATE TABLE IF NOT EXISTS ticket_statuses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 0,
  color         VARCHAR(50),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_statuses_code ON ticket_statuses (code);
CREATE INDEX IF NOT EXISTS idx_ticket_statuses_display_order ON ticket_statuses (display_order);
CREATE INDEX IF NOT EXISTS idx_ticket_statuses_is_active ON ticket_statuses (is_active);

-- Seed: codes must match ticket_status enum (open, in-progress, on-hold, resolved, closed)
INSERT INTO ticket_statuses (code, name, display_order, color) VALUES
  ('open',        'Open',        1, NULL),
  ('in-progress', 'In Progress', 2, NULL),
  ('on-hold',     'On Hold',      3, NULL),
  ('resolved',    'Resolved',    4, NULL),
  ('closed',      'Closed',      5, NULL)
ON CONFLICT (code) DO NOTHING;
