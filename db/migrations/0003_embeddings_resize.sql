BEGIN;

DROP INDEX IF EXISTS candidate_embeddings_vec_hnsw_idx;
DROP TABLE IF EXISTS candidate_embeddings;

CREATE TABLE candidate_embeddings (
    candidate_id UUID PRIMARY KEY REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,
    embedding_model TEXT NOT NULL,
    content_hash TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX candidate_embeddings_model_idx ON candidate_embeddings (embedding_model);
CREATE INDEX candidate_embeddings_vec_hnsw_idx ON candidate_embeddings USING hnsw (embedding vector_l2_ops);

COMMIT;
