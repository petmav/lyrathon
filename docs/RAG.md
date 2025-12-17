# Retrieval-Augmented Generation (RAG) Pipeline

This document explains the RAG pipeline used in Linkdr to match candidates with semantic search queries.

## 1. Data Ingestion & Embedding

### Logic
The `candidate-ingest.ts` module handles the transformation of candidate data into vector embeddings.
- **Trigger**: Called whenever a candidate profile is created or updated.
- **Source Fields**: Name, current position, location, visa status, experience years, skills, projects, awards, certifications, previous positions, and education.
- **Embedding Generation**: 
  - All textual fields are concatenated into a single "blob" string via `buildEmbeddingText`.
  - A hash (`content_hash`) is computed to prevent unnecessary re-embedding if data hasn't changed.
  - The text is sent to the OpenAI Embeddings API (via `src/lib/embeddings.ts`).
- **Storage**: The resulting vector is stored in the `candidate_embeddings` table (using `pgvector`).

### Key Files
- `src/lib/candidate-ingest.ts`: Main logic for building the text blob and managing updates.
- `src/lib/embeddings.ts`: Wrapper for OpenAI API calls.

## 2. Query Parsing

### Logic
User queries (e.g., "Senior React Developer in Sydney") are parsed using an LLM to extract structured filters.
- **Input**: Natural language query.
- **Output**: JSON object with `searchTerm`, `location`, `visaStatus`, `minExperience`, etc.
- **Fallback**: If the LLM fails or API key is missing, the entire input is treated as a keyword search.

### Key Files
- `src/lib/query-parser.ts`: Handles the prompt to OpenAI and parses the JSON response.

## 3. Hybrid Search

### Logic
The search engine (`src/lib/candidate-search.ts`) performs a hybrid search:
1. **Semantic Search**: Uses cosine similarity (`<=>` operator in Postgres) to find candidates with similar embeddings to the query.
2. **Structured Filtering**: Applies SQL `WHERE` clauses for hard constraints (e.g., specific location, visa status) extracted by the query parser.
3. **Keyword Matching**: (Optional) Can fallback to `tsvector` keyword matching if semantic search confidence is low or for specific keywords.

### Key Files
- `src/lib/candidate-search.ts`: Orchestrates the search query construction and execution.
- `src/lib/vector.ts`: Utilities for formatting vectors for SQL.
