RAG Draft

Pipeline overview: collect candidate data via intake form; normalize to SQL (profile, skills, visa, preferred locations, compensation, seniority, metadata). Ingest structured fields into relational tables for deterministic filtering and keep unstructured résumé/portfolio text in blob store → embed into vector DB (e.g., pgvector, Pinecone) plus metadata IDs.

Query workflow:

Requirement filter (SQL): parse org query with lightweight LLM to extract hard filters (visa, location, salary range, seniority, availability) and run SQL to prune disqualified candidates fast.
Semantic retrieval (Hybrid): for remaining IDs, build a search corpus combining TF-IDF/BM25 keywords and dense embeddings; run hybrid search (BM25 + kNN) to honor exact terms and semantic similarity; optionally interpolate with skill ontologies (skill-to-skill graph) for correlation-based expansion.
LLM re-rank: send top ~50 matches’ snippets + query into smaller LLM to re-score based on nuanced fit (recent projects, stated interests). Output top 10 with rationales.
LLM shortlist: pass re-ranked set into main orchestrator LLM that crafts the final shortlist (3–5 profiles) with narrative summaries, strengths, possible concerns, and follow-up questions for recruiters.
Components:

Data intake: Next.js form → API route → normalization worker (e.g., queue + serverless function) → SQL + vector store ingestion.
Embeddings: use domain-tuned model (OpenAI text-embedding-3-large or open-source Instructor) to encode composite text per candidate (skills + experiences). Store chunk references for explainability.
Correlation model: simple option—FAISS/pgvector kNN over embedding space; advanced—train two-tower model using historical placements to learn skill/culture fit, fallback to cosine similarity when sparse.
Re-ranking LLM: smaller, cheaper model (GPT-4o mini / Claude Haiku) with prompt template that scores relevance 1–5 and cites supporting evidence; return structured JSON for downstream.
Shortlist generator LLM: larger reasoning model (GPT-4o) that takes top N candidates, company brief, and produces final response or UI-ready markdown/JSON.
Operational considerations:

Metadata joins: keep candidate IDs consistent between SQL and vector store; store embedding version to enable re-ingest when model changes.
Latency: SQL filter (<50 ms) → hybrid search (<150 ms with precomputed indexes) → re-rank (~1 s) → shortlist (~2–3 s). Total <5 s target.
Monitoring: track retrieval metrics (filter hit rate, kNN recall@10, re-rank precision). Add human feedback loop: recruiters label “good fit” to fine-tune correlation model and prompt.
Governance: enforce consent on data collection; allow candidates to update/delete profile; store PII encrypted at rest.
Implementation plan:

Define schema + Prisma models for candidate core data + freeform text blobs.
Build intake form, validation, and ingestion job that writes to SQL and triggers embedding worker.
Stand up pgvector/Pinecone index; create ingestion script to chunk and embed candidate text.
Implement query parser (LLM function call) to extract hard filters; run SQL filter + hybrid search service.
Add re-rank microservice (LLM call) and final shortlist generator; deliver results through Next.js API/route handler.
Instrument logs/metrics, add evaluator notebooks to test queries, iterate on prompts.
Natural next steps: decide on vector store (managed vs pgvector), choose embedding/LLM providers, and prototype the SQL filter + hybrid retrieval path with synthetic candidate data.