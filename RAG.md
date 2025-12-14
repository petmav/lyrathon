# RAG Pipeline (current state)

**End-to-end flow implemented**
- Intake form/API (`/api/candidates/register`) writes to Postgres with required fields validated via Zod; embeddings are generated and stored in `candidate_embeddings` (pgvector).
- Recruiter prompt (`/api/query` or `/api/query/shortlist`) is parsed by OpenAI Responses into structured filters, then SQL performs deterministic pruning (visa, availability, salary, experience). Keyword tokens act as the only hard text filter.
- Semantic reordering uses pgvector similarity when an embedding is available; results are ordered by preference score + vector distance.
- Shortlist orchestrator (`/api/query/shortlist`) sends the filtered pool to an LLM with a JSON schema (up to 10 results, guided by `limit` in the request) that must include age/email/location/visa/experience/salary and explicit reasoning. If the LLM fails, a deterministic fallback shortlist is returned.

**Artifacts & data**
- `db/migrations` define the candidate/recruiter/documents schema with password hashes and pgvector extension.
- `db/seeds/seed.sql` + `db/seeds/candidates_small.sql` seed baseline companies/recruiters and 60+ overlapping candidates for semantic differentiation.
- Scripts (`scripts/setup`, `db-migrate`, `db-seed`, `db-reset`) start Docker, apply migrations, and load seeds.

**Validation & monitoring**
- All API requests/responses are validated against shared Zod schemas (`src/lib/schemas.ts`). Errors return `400` with field details; responses are enforced before sending.
- Structured logging via `logEvent` posts to `LOG_WEBHOOK_URL` when set; otherwise stdout/stderr.
- Jest suite (`npm test`) covers query parsing fallbacks, candidate search ordering, and shortlist LLM/fallback behavior.

**Open refinements / future work**
- Hybrid BM25+vector retrieval and ontology-based expansion (planned; currently keyword + vector similarity).
- Learned correlation model / re-ranker (current reordering is rule + vector based).
- Governance and deletion workflows beyond current validation and schema-level constraints.
