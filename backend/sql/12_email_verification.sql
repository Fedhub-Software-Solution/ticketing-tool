-- Email verification for new accounts (self-registration and admin-created users).
-- Run: node scripts/run-sql.cjs sql/12_email_verification.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users (verification_token) WHERE verification_token IS NOT NULL;

-- Mark all existing users as verified so they can continue to log in
UPDATE users SET email_verified = true WHERE email_verified = false AND verification_token IS NULL;

COMMENT ON COLUMN users.email_verified IS 'True after user clicks verification link in email';
COMMENT ON COLUMN users.verification_token IS 'Token sent in verification email; cleared after verification';
COMMENT ON COLUMN users.verification_token_expires_at IS 'Expiry for verification token (e.g. 24h)';
