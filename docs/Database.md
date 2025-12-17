# Database Documentation

Linkdr uses PostgreSQL with `pgvector` for vector similarity search.

## Connection
- **Library**: `pg` (node-postgres)
- **Path**: `src/lib/db.ts`
- **Pattern**: Singleton connection pool handling environment variables `DATABASE_URL`.
- **SSL**: Enabled for production environments.

## Schema
Key tables defined in the schema:

### `candidate`
Stores the core profile data.
- **PK**: `candidate_id` (UUID)
- **Columns**: `email`, `name`, `current_position`, `experience_years`, `skills_text`, `verifiable_confidence_score`, etc.
- **JSONB Columns**: `previous_positions`, `education` store structured array data.

### `candidate_embeddings`
Stores the vector representations of candidates.
- **PK**: `candidate_id` (FK to `candidate`)
- **Columns**: 
  - `embedding`: `vector(1536)` (OpenAI ada-002 compatible)
  - `content_hash`: SHA256 of the text content to detect changes.

### `candidate_documents`
Registry of uploaded files.
- **PK**: `document_id`
- **Columns**: `candidate_id`, `type` (resume, transcript, etc.), `file_url`, `checksum`.

### `verification_runs`
Audit log of all validation attempts.
- **PK**: `verification_id`
- **Columns**: `run_type`, `status` (queued, processing, succeeded, failed), `confidence`, `rationale`.
