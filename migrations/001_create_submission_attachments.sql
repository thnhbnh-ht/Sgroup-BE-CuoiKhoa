-- Migration: Create submission_attachments table and backfill existing attachments
-- Description: Supports multiple file attachments per assignment submission

CREATE TABLE IF NOT EXISTS submission_attachments (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  upload_id BIGINT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_submission_upload UNIQUE (submission_id, upload_id)
);

-- Index for optimizing queries fetching attachments by submission_id
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission_id
  ON submission_attachments(submission_id);

-- Backfill: Link existing uploads to submissions if repository_url matches upload url
INSERT INTO submission_attachments (submission_id, upload_id, created_at)
SELECT s.id, u.id, s.submitted_at
FROM submissions s
JOIN uploads u ON u.url = s.repository_url
ON CONFLICT (submission_id, upload_id) DO NOTHING;

