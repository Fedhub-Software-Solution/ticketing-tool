-- Migration: Remove user_role enum; make users.role a text column (role code from roles table).
-- Run once on existing DB: node scripts/run-sql.cjs sql/13_roles_dynamic.sql
-- Ensures roles table exists (run 04_roles.sql first).

-- Convert users.role from enum to text (keeps existing values as-is)
ALTER TABLE users
  ALTER COLUMN role TYPE VARCHAR(50) USING role::text;

-- Drop the enum type
DROP TYPE IF EXISTS user_role;
