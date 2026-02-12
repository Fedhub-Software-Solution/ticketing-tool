-- Roles table for Access Management (list/add/edit/delete roles)
-- Run after 01_schema.sql and 02_seed.sql. User count is derived from users.role enum matching roles.code.

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles (code);

-- Seed system roles (code must match user_role enum: admin, manager, agent, customer)
INSERT INTO roles (id, name, code, description, permissions) VALUES
  (gen_random_uuid(), 'Administrator', 'admin', 'Full system access with ability to manage all settings and users.', ARRAY['Full System Access', 'User Management', 'SLA Configuration', 'Financial Reports', 'Enterprise Management', 'Security Audit Logs']),
  (gen_random_uuid(), 'Manager', 'manager', 'High-level oversight of departments and team performance.', ARRAY['Department Oversight', 'Ticket Reassignment', 'Reporting', 'Team Management', 'Internal Knowledge Base Management']),
  (gen_random_uuid(), 'Support Agent', 'agent', 'Standard operational access for resolving customer issues.', ARRAY['Ticket Resolution', 'Customer Communication', 'Internal Notes', 'SLA Tracking', 'Macros & Canned Responses']),
  (gen_random_uuid(), 'Customer', 'customer', 'External users seeking support and tracking their own tickets.', ARRAY['Ticket Creation', 'Status Tracking', 'Knowledge Base Access', 'Feedback', 'Profile Management'])
ON CONFLICT (code) DO NOTHING;
