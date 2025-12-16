-- Extend verification runs with link overlap and tool usage metadata
ALTER TABLE verification_runs
  ADD COLUMN IF NOT EXISTS web_search_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS link_overlap_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_notes TEXT;

CREATE INDEX IF NOT EXISTS verification_runs_run_type_idx
  ON verification_runs (run_type, created_at);
