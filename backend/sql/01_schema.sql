-- Ticketing Tool - PostgreSQL Schema
-- Run this file first. Compatible with Node.js backend and any client (React, Flutter).

-- Extensions (optional, for UUIDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types matching frontend
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent', 'customer');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE ticket_status AS ENUM ('open', 'in-progress', 'resolved', 'closed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- =============================================================================
-- Zones (regional grouping)
-- =============================================================================
CREATE TABLE zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50),
  manager    VARCHAR(255),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zones_is_active ON zones (is_active);

-- =============================================================================
-- Branches (belong to a zone)
-- =============================================================================
CREATE TABLE branches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50),
  zone_id    UUID NOT NULL REFERENCES zones (id) ON DELETE RESTRICT,
  manager    VARCHAR(255),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_zone ON branches (zone_id);
CREATE INDEX idx_branches_is_active ON branches (is_active);

-- =============================================================================
-- Users
-- =============================================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL,
  zone_id       UUID REFERENCES zones (id) ON DELETE SET NULL,
  branch_id     UUID REFERENCES branches (id) ON DELETE SET NULL,
  location      VARCHAR(255),
  status        user_status NOT NULL DEFAULT 'active',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email ON users (LOWER(email));
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_zone ON users (zone_id);
CREATE INDEX idx_users_branch ON users (branch_id);

-- =============================================================================
-- SLAs
-- =============================================================================
CREATE TABLE slas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(255) NOT NULL,
  priority            priority_level NOT NULL,
  response_time_mins  INTEGER NOT NULL CHECK (response_time_mins >= 0),
  resolution_time_mins INTEGER NOT NULL CHECK (resolution_time_mins >= 0),
  category            VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_slas_priority ON slas (priority);

-- =============================================================================
-- Escalation rules
-- =============================================================================
CREATE TABLE escalation_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  priority          priority_level NOT NULL,
  trigger_after_mins INTEGER NOT NULL CHECK (trigger_after_mins >= 0),
  level1_escalate   VARCHAR(255),
  level2_escalate   VARCHAR(255),
  notify_users      TEXT[] DEFAULT '{}',
  auto_escalate     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escalation_rules_priority ON escalation_rules (priority);

-- =============================================================================
-- Categories (hierarchical: parent_id for subcategories)
-- =============================================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  icon        VARCHAR(100),
  color       VARCHAR(50),
  sla_id      UUID REFERENCES slas (id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES categories (id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories (parent_id);
CREATE INDEX idx_categories_sla ON categories (sla_id);
CREATE INDEX idx_categories_is_active ON categories (is_active);

-- =============================================================================
-- Tickets
-- =============================================================================
CREATE TABLE tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(500) NOT NULL,
  description       TEXT,
  status            ticket_status NOT NULL DEFAULT 'open',
  priority          priority_level NOT NULL DEFAULT 'medium',
  category_id       UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  sub_category      VARCHAR(255),
  zone_id           UUID REFERENCES zones (id) ON DELETE SET NULL,
  location          VARCHAR(255),
  branch_id         UUID REFERENCES branches (id) ON DELETE SET NULL,
  branch_code       VARCHAR(50),
  assigned_to_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  created_by_id     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  sla_id            UUID REFERENCES slas (id) ON DELETE SET NULL,
  sla_due_date      TIMESTAMPTZ,
  escalation_level  INTEGER CHECK (escalation_level IS NULL OR escalation_level >= 0),
  escalated_to      VARCHAR(255),
  breached_sla      BOOLEAN NOT NULL DEFAULT false,
  parent_id         UUID REFERENCES tickets (id) ON DELETE SET NULL,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status ON tickets (status);
CREATE INDEX idx_tickets_priority ON tickets (priority);
CREATE INDEX idx_tickets_category ON tickets (category_id);
CREATE INDEX idx_tickets_assigned_to ON tickets (assigned_to_id);
CREATE INDEX idx_tickets_created_by ON tickets (created_by_id);
CREATE INDEX idx_tickets_created_at ON tickets (created_at DESC);
CREATE INDEX idx_tickets_zone ON tickets (zone_id);
CREATE INDEX idx_tickets_branch ON tickets (branch_id);
CREATE INDEX idx_tickets_sla_due ON tickets (sla_due_date) WHERE sla_due_date IS NOT NULL;
CREATE INDEX idx_tickets_parent ON tickets (parent_id);

-- =============================================================================
-- Ticket comments
-- =============================================================================
CREATE TABLE ticket_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments (ticket_id);

-- =============================================================================
-- Enterprise config (single row)
-- =============================================================================
CREATE TABLE enterprise_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255),
  legal_name   VARCHAR(255),
  reg_number  VARCHAR(100),
  tax_id       VARCHAR(100),
  industry     VARCHAR(255),
  email        VARCHAR(255),
  phone        VARCHAR(50),
  website      VARCHAR(255),
  address      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one row (application must upsert by fixed id or use first row)
INSERT INTO enterprise_config (id) VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER zones_updated_at
  BEFORE UPDATE ON zones FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER branches_updated_at
  BEFORE UPDATE ON branches FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER slas_updated_at
  BEFORE UPDATE ON slas FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER escalation_rules_updated_at
  BEFORE UPDATE ON escalation_rules FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER enterprise_config_updated_at
  BEFORE UPDATE ON enterprise_config FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
