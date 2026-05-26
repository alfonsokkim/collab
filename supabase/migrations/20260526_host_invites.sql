-- Add initiated_by column to distinguish applicant-initiated vs host-initiated requests
ALTER TABLE collab_requests
  ADD COLUMN IF NOT EXISTS initiated_by text NOT NULL DEFAULT 'applicant'
    CHECK (initiated_by IN ('applicant', 'host'));
