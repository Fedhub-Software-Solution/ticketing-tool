-- Add 'on-hold' to ticket_status enum (for Create/Edit Ticket form).
-- Run once: node scripts/run-sql.cjs sql/03_add_on_hold_status.sql
-- (PostgreSQL 9.1+; IF NOT EXISTS is 9.5+)
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'on-hold';
