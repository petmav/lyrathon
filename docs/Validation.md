# Candidate Verification System

The automated verification system (`src/lib/verification.ts`) assigns a "Verifiable Confidence Score" to each candidate profile.

## Overview
Instead of simple boolean checks, Linkdr uses an LLM-based agent to read uploaded documents and cross-reference them with the candidate's self-reported profile claims.

## Verification Runs
Validation is broken down into "Runs" (`verification_runs` table), each targeting a specific aspect:

### 1. Resume Verification
- **Input**: Candidate Profile + Resume PDF text.
- **Goal**: Confirm that experience, skills, and education listed in the profile match the resume.

### 2. Transcript Verification
- **Input**: Education history + Transcript/Testamur files.
- **Goal**: Validate degrees, schools, and graduation dates.

### 3. Project Links Verification
- **Input**: Project descriptions + Portfolio Links.
- **Goal**: (Optional) Use `web_search` tool to visit links and verify the project exists and the candidate's role is accurate.

### 4. Full Profile Aggregation
- **Input**: All of the above.
- **Goal**: Produce an aggregate confidence score for the entire profile.

## Confidence Scoring
- **Score (0-1)**: 
  - `> 0.66`: Verified (Green)
  - `> 0.33`: Partially Verified (Yellow)
  - `< 0.33`: Unverified / Low Confidence (Gray)
- **Update Logic**: When a run succeeds, it updates the `candidate.verifiable_confidence_score` based on the average of all successful aspects.

## Key Files
- `src/lib/verification.ts`: Core logic for queuing runs, calling OpenAI, and processing results.
- `src/lib/document-fetcher.ts`: Utilities for extracting text from files URLs.
