-- =============================================================================
-- Priority master table (Critical, High, Medium, Low) for SLA and dropdowns
-- =============================================================================

CREATE TABLE IF NOT EXISTS priorities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_priorities_display_order ON priorities (display_order);

COMMENT ON TABLE priorities IS 'Master list of priority levels for SLA and tickets';

-- Insert Critical, High, Medium, Low (order: Critical=1, High=2, Medium=3, Low=4)
INSERT INTO priorities (code, name, display_order) VALUES
  ('critical', 'Critical', 1),
  ('high',     'High',     2),
  ('medium',   'Medium',   3),
  ('low',      'Low',      4)
ON CONFLICT (code) DO NOTHING;

-- Allow SLA priority to use 'critical'. Run once; if already added, ignore error.
ALTER TYPE priority_level ADD VALUE IF NOT EXISTS 'critical';
