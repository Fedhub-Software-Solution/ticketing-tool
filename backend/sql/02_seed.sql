-- Ticketing Tool - Optional seed data
-- Run after 01_schema.sql. Uses pgcrypto for password hashing (bcrypt).

-- Ensure we have the extension for bcrypt (same as bcrypt in Node)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seed data (run once; re-run may duplicate SLAs/categories/escalation rules)
-- =============================================================================
-- Zones
-- =============================================================================
INSERT INTO zones (id, name, code, is_active)
VALUES
  ('a0000001-0000-0000-0000-000000000001'::uuid, 'North', 'N', true),
  ('a0000001-0000-0000-0000-000000000002'::uuid, 'South', 'S', true),
  ('a0000001-0000-0000-0000-000000000003'::uuid, 'West', 'W', true)
ON CONFLICT (id) DO NOTHING;

-- Branches
INSERT INTO branches (id, name, code, zone_id, is_active)
SELECT 'b0000001-0000-0000-0000-000000000001'::uuid, 'Chennai Main', 'CHN-M', id, true FROM zones WHERE code = 'S' LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Users (one admin for initial login)
-- Password: admin123 (hash from bcryptjs so Node login works)
-- =============================================================================
INSERT INTO users (id, name, email, password_hash, role, status)
SELECT
  'c0000001-0000-0000-0000-000000000001'::uuid,
  'Admin User',
  'admin@company.com',
  '$2a$10$2YQNKj5fNVk8YGcbsxRjHO9CxX8Ce8IJchdCVAf9cUdszuaNYjtWC',
  'admin'::user_role,
  'active'::user_status
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@company.com');

-- =============================================================================
-- SLAs
-- =============================================================================
INSERT INTO slas (name, priority, response_time_mins, resolution_time_mins)
SELECT * FROM (VALUES
  ('Critical Priority SLA', 'urgent'::priority_level, 15, 240),
  ('High Priority SLA', 'high'::priority_level, 60, 480),
  ('Medium Priority SLA', 'medium'::priority_level, 240, 1440),
  ('Low Priority SLA', 'low'::priority_level, 480, 2880)
) AS v(name, priority, response_time_mins, resolution_time_mins)
WHERE NOT EXISTS (SELECT 1 FROM slas LIMIT 1);

-- =============================================================================
-- Escalation rules
-- =============================================================================
INSERT INTO escalation_rules (name, priority, trigger_after_mins, level1_escalate, level2_escalate, notify_users, auto_escalate)
VALUES
  ('Urgent Ticket Escalation', 'urgent'::priority_level, 30, 'Technical Lead', 'Senior Support Manager', ARRAY['manager@company.com', 'director@company.com'], true),
  ('High Priority Escalation', 'high'::priority_level, 120, 'Senior Agent', 'Team Lead', ARRAY['teamlead@company.com'], true),
  ('Medium Priority Escalation', 'medium'::priority_level, 480, 'Senior Agent', 'Team Lead', ARRAY['teamlead@company.com'], false),
  ('Low Priority Escalation', 'low'::priority_level, 1440, 'Senior Agent', 'Team Lead', ARRAY['teamlead@company.com'], false);

-- =============================================================================
-- Categories (sample; parent_id can be set for subcategories)
-- =============================================================================
INSERT INTO categories (name, description, icon, color, is_active)
VALUES
  ('Maintenance', 'General maintenance requests and facility upkeep', 'wrench', '#8B5CF6', true),
  ('Hardware', 'Hardware issues, equipment repairs, and replacements', 'cpu', '#EF4444', true),
  ('IT Support', 'Information technology support and software issues', 'monitor', '#6366F1', true),
  ('HVAC', 'Heating, ventilation, and air conditioning systems', 'wind', '#06B6D4', true),
  ('Electrical', 'Electrical systems, wiring, and power-related issues', 'zap', '#FBBF24', true),
  ('Plumbing', 'Plumbing issues, water systems, and drainage', 'droplet', '#0EA5E9', true),
  ('Fire Safety', 'Fire safety systems, alarms, and emergency equipment', 'flame', '#F97316', true);
