-- Add notification preference columns to users for Profile Settings
-- Run with: node scripts/run-sql.cjs sql/07_user_profile_preferences.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sla_warnings BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS desktop_push BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.email_alerts IS 'Email alerts for new assignments & mentions';
COMMENT ON COLUMN users.sla_warnings IS 'Email/in-app breach notifications';
COMMENT ON COLUMN users.desktop_push IS 'Desktop push for real-time updates';
