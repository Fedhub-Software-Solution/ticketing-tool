-- Add created_by to users: admin-created users store creator id; self-registered stay NULL.
-- Run: node scripts/run-sql.cjs sql/08_users_created_by.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_created_by ON users (created_by);

COMMENT ON COLUMN users.created_by IS 'User who created this account (admin flow). NULL = self-registered.';
