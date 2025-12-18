-- Core extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS vector;

-- Organizations that recruiters can optionally belong to
CREATE TABLE IF NOT EXISTS company (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    industry TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidate master record
CREATE TABLE IF NOT EXISTS candidate (
    candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age SMALLINT,
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    current_position TEXT NOT NULL DEFAULT 'Not employed',
    location TEXT,
    visa_status TEXT,
    experience_years NUMERIC(4,1),
    salary_expectation INTEGER,
    availability_date DATE,
    skills_text TEXT,
    awards_text TEXT,
    certifications_text TEXT,
    projects_text TEXT,
    previous_positions JSONB NOT NULL DEFAULT '[]'::JSONB,
    education JSONB NOT NULL DEFAULT '[]'::JSONB,
    profile_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profile_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verifiable_confidence_score NUMERIC(5,2) DEFAULT 0,
    CONSTRAINT candidate_age CHECK (age BETWEEN 16 AND 100),
    CONSTRAINT candidate_experience CHECK (experience_years IS NULL OR experience_years >= 0),
    CONSTRAINT candidate_salary CHECK (salary_expectation IS NULL OR salary_expectation >= 0)
);

-- Recruiters that can access the platform
CREATE TABLE IF NOT EXISTS recruiter (
    recruiter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES company(company_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    organisation TEXT,
    role_title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uploaded resumes/cover letters/portfolios for candidates
CREATE TABLE IF NOT EXISTS candidate_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('resume', 'portfolio', 'cover_letter', 'other', 'transcript')),
    file_url TEXT NOT NULL,
    checksum TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS candidate_documents_primary_idx
    ON candidate_documents (candidate_id)
    WHERE is_primary;

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

-- Recruiter/company specific status tracking for candidates
CREATE TABLE IF NOT EXISTS candidate_status (
    candidate_status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES recruiter(recruiter_id) ON DELETE SET NULL,
    company_id UUID REFERENCES company(company_id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'prospect',
    stage TEXT,
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT status_requires_context CHECK (recruiter_id IS NOT NULL OR company_id IS NOT NULL),
    CONSTRAINT unique_candidate_context UNIQUE (candidate_id, recruiter_id, company_id)
);

-- Helpful indexes for filtering
CREATE INDEX IF NOT EXISTS candidate_location_idx ON candidate (LOWER(location));
CREATE INDEX IF NOT EXISTS candidate_visa_idx ON candidate (visa_status);
CREATE INDEX IF NOT EXISTS candidate_availability_idx ON candidate (availability_date);
CREATE INDEX IF NOT EXISTS candidate_previous_positions_idx ON candidate USING GIN (previous_positions);
CREATE INDEX IF NOT EXISTS candidate_education_idx ON candidate USING GIN (education);
CREATE INDEX IF NOT EXISTS candidate_status_idx ON candidate_status (status);

-- Embeddings for semantic search
CREATE TABLE IF NOT EXISTS candidate_embeddings (
    candidate_id UUID PRIMARY KEY REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,
    embedding_model TEXT NOT NULL,
    content_hash TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_embeddings_model_idx ON candidate_embeddings (embedding_model);
CREATE INDEX IF NOT EXISTS candidate_embeddings_vec_hnsw_idx ON candidate_embeddings USING hnsw (embedding vector_l2_ops);

CREATE TABLE IF NOT EXISTS conversation (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiter(recruiter_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recruiter_queries (
    query_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    is_assistant BOOLEAN NOT NULL,
    conversation_id UUID REFERENCES conversation(conversation_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verification runs
CREATE TABLE IF NOT EXISTS verification_runs (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate(candidate_id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('resume', 'transcript', 'project_links', 'full_profile')),
  input_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'skipped')),
  confidence NUMERIC(4,3),
  rationale TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  web_search_used BOOLEAN DEFAULT FALSE,
  link_overlap_count INTEGER DEFAULT 0,
  link_notes TEXT,
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

CREATE INDEX IF NOT EXISTS verification_runs_run_type_idx
  ON verification_runs (run_type, created_at);