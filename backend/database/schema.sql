-- =============================================================================
-- FedHub Ticketing Tool - PostgreSQL Schema
-- Compatible with Node.js backend; same API for Web (React) and Mobile (Flutter)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS (optional; can use CHECK constraints instead for flexibility)
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent', 'customer');
CREATE TYPE user_status_type AS ENUM ('active', 'inactive');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status_type AS ENUM ('open', 'in-progress', 'resolved', 'closed');

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  role              user_role NOT NULL DEFAULT 'customer',
  avatar            VARCHAR(512),
  zone              VARCHAR(100),
  branch            VARCHAR(255),
  location          VARCHAR(255),
  status            user_status_type NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_zone ON users(zone);
CREATE INDEX idx_users_location ON users(location);

-- =============================================================================
-- SLAs
-- =============================================================================

CREATE TABLE slas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(255) NOT NULL,
  priority            ticket_priority NOT NULL,
  response_time_mins  INTEGER NOT NULL,
  resolution_time_mins INTEGER NOT NULL,
  category            VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slas_priority ON slas(priority);

-- =============================================================================
-- ESCALATION RULES
-- =============================================================================

CREATE TABLE escalation_rules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  priority          ticket_priority NOT NULL,
  trigger_after_mins INTEGER NOT NULL,
  level1_escalate   VARCHAR(255) NOT NULL,
  level2_escalate   VARCHAR(255) NOT NULL,
  notify_users      JSONB NOT NULL DEFAULT '[]',  -- array of email strings
  auto_escalate     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escalation_rules_priority ON escalation_rules(priority);

-- =============================================================================
-- CATEGORIES (hierarchical: parent_id for subcategories)
-- =============================================================================

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  icon        VARCHAR(100),
  color       VARCHAR(20),
  sla_id      UUID REFERENCES slas(id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_sla ON categories(sla_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- =============================================================================
-- ZONES (Enterprise structure)
-- =============================================================================

CREATE TABLE zones (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      VARCHAR(255) NOT NULL,
  code      VARCHAR(50),
  manager   VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_zones_code ON zones(code) WHERE code IS NOT NULL;

-- =============================================================================
-- BRANCHES (belong to a zone)
-- =============================================================================

CREATE TABLE branches (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      VARCHAR(255) NOT NULL,
  code      VARCHAR(50),
  zone_id   UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  manager   VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_zone ON branches(zone_id);
CREATE INDEX idx_branches_code ON branches(code);

-- =============================================================================
-- ENTERPRISE CONFIG (single row)
-- =============================================================================

CREATE TABLE enterprise_config (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255),
  legal_name   VARCHAR(255),
  reg_number   VARCHAR(100),
  tax_id       VARCHAR(100),
  industry     VARCHAR(100),
  email        VARCHAR(255),
  phone        VARCHAR(50),
  website      VARCHAR(255),
  address      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one row (optional)
-- CREATE UNIQUE INDEX idx_enterprise_singleton ON enterprise_config((true));

-- =============================================================================
-- TICKETS
-- =============================================================================

CREATE TABLE tickets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(500) NOT NULL,
  description       TEXT,
  status            ticket_status_type NOT NULL DEFAULT 'open',
  priority          ticket_priority NOT NULL DEFAULT 'medium',
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category      VARCHAR(255),
  zone              VARCHAR(100),
  location          VARCHAR(255),
  branch            VARCHAR(255),
  branch_code       VARCHAR(50),
  assigned_to_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sla_id            UUID REFERENCES slas(id) ON DELETE SET NULL,
  sla_due_date      TIMESTAMPTZ,
  escalation_level  INTEGER DEFAULT 0,
  escalated_to      VARCHAR(255),
  breached_sla      BOOLEAN DEFAULT false,
  parent_id         UUID REFERENCES tickets(id) ON DELETE SET NULL,
  tags              JSONB NOT NULL DEFAULT '[]',  -- array of strings
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_sla_due ON tickets(sla_due_date);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_tickets_zone ON tickets(zone);
CREATE INDEX idx_tickets_parent ON tickets(parent_id);

-- =============================================================================
-- TICKET COMMENTS
-- =============================================================================

CREATE TABLE ticket_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_author ON ticket_comments(author_id);

-- =============================================================================
-- TICKET ATTACHMENTS (optional; store metadata; file storage can be S3/local)
-- =============================================================================

CREATE TABLE ticket_attachments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_name  VARCHAR(255) NOT NULL,
  file_size  INTEGER,
  file_type  VARCHAR(100),
  file_path  VARCHAR(512) NOT NULL,  -- or URL if using S3
  uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);

-- =============================================================================
-- TRIGGERS: updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER slas_updated_at
  BEFORE UPDATE ON slas FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER escalation_rules_updated_at
  BEFORE UPDATE ON escalation_rules FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER zones_updated_at
  BEFORE UPDATE ON zones FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER branches_updated_at
  BEFORE UPDATE ON branches FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER enterprise_config_updated_at
  BEFORE UPDATE ON enterprise_config FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (optional; enable if you want DB-level role checks)
-- =============================================================================
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- etc.

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
