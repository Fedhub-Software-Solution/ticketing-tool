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


