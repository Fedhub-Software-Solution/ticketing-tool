-- Ticket comments (internal notes). Required for Communication & History.
-- If you already ran 01_schema.sql, this table exists. Run this only if you need to add it to an existing DB.

CREATE TABLE IF NOT EXISTS ticket_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments (ticket_id);

-- Ensure set_updated_at exists (from 01_schema.sql)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_comments_updated_at ON ticket_comments;
CREATE TRIGGER ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
