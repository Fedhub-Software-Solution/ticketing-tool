-- Add company_name and phone_number for Support Portal registration.
-- Run: node scripts/run-sql.cjs sql/09_users_company_phone.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_company_name ON users (company_name);

COMMENT ON COLUMN users.company_name IS 'Company/organization name (e.g. from portal registration)';
COMMENT ON COLUMN users.phone_number IS 'Phone number (e.g. from portal registration)';
