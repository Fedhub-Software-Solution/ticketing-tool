-- Migration: Replace trigger_after_mins with level1_escalate_percent and level2_escalate_percent.
-- Level 1 = 50% of SLA Config time, Level 2 = 75% of SLA Config time.
-- Run on existing DBs that have escalation_rules.trigger_after_mins.

ALTER TABLE escalation_rules
  ADD COLUMN IF NOT EXISTS level1_escalate_percent INTEGER,
  ADD COLUMN IF NOT EXISTS level2_escalate_percent INTEGER;

UPDATE escalation_rules
SET level1_escalate_percent = 50, level2_escalate_percent = 75
WHERE level1_escalate_percent IS NULL OR level2_escalate_percent IS NULL;

ALTER TABLE escalation_rules
  ALTER COLUMN level1_escalate_percent SET DEFAULT 50,
  ALTER COLUMN level2_escalate_percent SET DEFAULT 75,
  ALTER COLUMN level1_escalate_percent SET NOT NULL,
  ALTER COLUMN level2_escalate_percent SET NOT NULL;

ALTER TABLE escalation_rules DROP COLUMN IF EXISTS trigger_after_mins;

ALTER TABLE escalation_rules
  ADD CONSTRAINT chk_level1_escalate_percent CHECK (level1_escalate_percent >= 0 AND level1_escalate_percent <= 100),
  ADD CONSTRAINT chk_level2_escalate_percent CHECK (level2_escalate_percent >= 0 AND level2_escalate_percent <= 100);
