-- Role definitions (display name, description, permissions). User count derived from users.role matching code.
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_code ON roles (code);

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Optional: seed default roles so seed user (admin) and UI dropdowns work. Permissions = sidebar menu labels.
INSERT INTO roles (name, code, description, permissions)
SELECT * FROM (VALUES
  ('Administrator', 'admin', 'Full access to settings and users', ARRAY['Dashboard', 'Tickets', 'Board', 'Reports', 'Open Tickets', 'Closed Tickets', 'Overdue Tickets', 'Access Management', 'SLA Config', 'Escalations', 'Categories', 'Enterprise Setup']),
  ('Manager', 'manager', 'Manages SLA, escalations, and team', ARRAY['Dashboard', 'Tickets', 'Board', 'Reports', 'Open Tickets', 'Closed Tickets', 'Overdue Tickets', 'SLA Config', 'Escalations', 'Categories', 'Enterprise Setup']),
  ('Agent', 'agent', 'Handles tickets and assignments', ARRAY['Dashboard', 'Tickets', 'Board', 'Reports', 'Open Tickets', 'Closed Tickets', 'Overdue Tickets']),
  ('Customer', 'customer', 'Submits and views own tickets', ARRAY['Dashboard', 'Tickets', 'Open Tickets', 'Closed Tickets', 'Overdue Tickets'])
) AS v(name, code, description, permissions)
WHERE NOT EXISTS (SELECT 1 FROM roles LIMIT 1);

