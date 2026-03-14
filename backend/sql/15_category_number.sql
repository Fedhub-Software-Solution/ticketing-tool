-- =============================================================================
-- Category number: CAT-001, CAT-002, ... (auto-increment)
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS category_number_seq;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS category_number VARCHAR(20);

-- Backfill existing rows by creation order
UPDATE categories
SET category_number = 'CAT-' || LPAD((row_number() OVER (ORDER BY created_at, id))::text, 3, '0')
WHERE category_number IS NULL;

-- Set sequence to current max so next value is correct
SELECT setval(
  'category_number_seq',
  (SELECT COALESCE(MAX(CAST(NULLIF(SUBSTRING(category_number FROM 5), '') AS INTEGER)), 1) FROM categories WHERE category_number ~ '^CAT-[0-9]+$')
);

ALTER TABLE categories
  ALTER COLUMN category_number SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_category_number_key') THEN
    ALTER TABLE categories ADD CONSTRAINT categories_category_number_key UNIQUE (category_number);
  END IF;
END $$;

-- Trigger: assign next CAT-XXX on INSERT when category_number is not supplied
CREATE OR REPLACE FUNCTION set_category_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_number IS NULL OR NEW.category_number = '' THEN
    NEW.category_number := 'CAT-' || LPAD(nextval('category_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_set_category_number ON categories;
CREATE TRIGGER categories_set_category_number
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE PROCEDURE set_category_number();

COMMENT ON COLUMN categories.category_number IS 'Auto-increment display number e.g. CAT-001';
