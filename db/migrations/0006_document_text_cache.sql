-- Cache extracted document text to avoid repeated fetch/parse work
CREATE TABLE IF NOT EXISTS candidate_document_cache (
    document_id UUID PRIMARY KEY REFERENCES candidate_documents(document_id) ON DELETE CASCADE,
    checksum TEXT NOT NULL,
    text_content TEXT,
    content_type TEXT,
    bytes INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candidate_document_cache_checksum_idx
  ON candidate_document_cache (checksum);
