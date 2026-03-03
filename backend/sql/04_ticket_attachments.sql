-- Ticket attachments: store file metadata and path (files stored on disk or S3).
-- Run after 01_schema.sql: node scripts/run-sql.cjs sql/04_ticket_attachments.sql

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id      UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  file_name      VARCHAR(255) NOT NULL,
  file_size      INTEGER,
  file_type      VARCHAR(100),
  file_path      VARCHAR(512) NOT NULL,
  uploaded_by_id UUID REFERENCES users (id) ON DELETE SET NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments (ticket_id);
