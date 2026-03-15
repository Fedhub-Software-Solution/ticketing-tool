-- Migration: Replace escalation_rules.priority with sla_id (reference to slas table).
-- Run this on existing databases that have escalation_rules with priority.
-- For new installs, 01_schema.sql already defines escalation_rules with sla_id.

-- Add new column
ALTER TABLE escalation_rules
  ADD COLUMN IF NOT EXISTS sla_id UUID REFERENCES slas (id) ON DELETE SET NULL;

-- Backfill: set sla_id from slas where priority matches (pick first SLA per priority)
UPDATE escalation_rules er
SET sla_id = (
  SELECT s.id FROM slas s WHERE s.priority = er.priority ORDER BY s.created_at ASC LIMIT 1
)
WHERE er.sla_id IS NULL AND er.priority IS NOT NULL;

-- Drop old index and column
DROP INDEX IF EXISTS idx_escalation_rules_priority;
ALTER TABLE escalation_rules DROP COLUMN IF EXISTS priority;

-- Index for lookups by SLA
CREATE INDEX IF NOT EXISTS idx_escalation_rules_sla_id ON escalation_rules (sla_id);
