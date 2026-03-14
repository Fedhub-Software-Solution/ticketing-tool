-- =============================================================================
-- Add sub_category to slas for sub-category selection
-- =============================================================================

ALTER TABLE slas
  ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);

COMMENT ON COLUMN slas.sub_category IS 'Sub-category name (child of category) for this SLA';
