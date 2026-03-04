-- Add human-readable ticket number (TKT-001, TKT-002, ...) for display and as public id.
-- Keeps id as UUID for FKs; ticket_number is unique and used in API as the ticket identifier.

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;

-- Backfill existing rows in created_at order
WITH numbered AS (
  SELECT id, 'TKT-' || LPAD(row_number() OVER (ORDER BY created_at, id)::text, 3, '0') AS nr
  FROM tickets
)
UPDATE tickets t SET ticket_number = n.nr FROM numbered n WHERE t.id = n.id;

-- Sequence for new tickets
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

-- Set sequence to continue after current max
DO $$
DECLARE
  max_n INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) INTO max_n
  FROM tickets WHERE ticket_number ~ '^TKT-[0-9]+$';
  PERFORM setval('ticket_number_seq', max_n + 1);
END $$;

-- Enforce NOT NULL and UNIQUE for new/updated rows
ALTER TABLE tickets ALTER COLUMN ticket_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets (ticket_number);
