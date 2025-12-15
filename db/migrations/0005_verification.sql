-- Add verification support and per-candidate aggregate confidence
ALTER TABLE candidate
  ADD COLUMN IF NOT EXISTS verifiable_confidence_score NUMERIC(5,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS verification_runs (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate(candidate_id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('resume', 'transcript', 'project_links', 'full_profile')),
  input_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'skipped')),
  confidence NUMERIC(4,3),
  rationale TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS verification_runs_candidate_idx
  ON verification_runs (candidate_id);

CREATE INDEX IF NOT EXISTS verification_runs_status_created_idx
  ON verification_runs (status, created_at);

CREATE INDEX IF NOT EXISTS verification_runs_input_hash_idx
  ON verification_runs (candidate_id, input_hash);
