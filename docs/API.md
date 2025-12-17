# API Documentation

The Linkdr API is built with Next.js App Router Route Handlers.

## Candidates

### `GET /api/candidates`
Fetches a single candidate's profile data.
- **Query Params**: `candidate_id` (UUID)
- **Response**: JSON object containing candidate details, documents, and verification metadata.

### `POST /api/candidates/register`
Intake endpoint for candidate submissions. The payload must satisfy `candidateInputSchema` (name/email/password hash/age required; optional fields are sanitized). Violations return `400` with field-level errors. Successful submissions persist the record, refresh embeddings, and respond with the validated candidate shape (excluding the password hash).

#### Example Request
```bash
curl -X POST http://localhost:3000/api/candidates/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kai Patel",
    "age": 33,
    "email": "kai@example.com",
    "password_hash": "$2a$10$exampleCandidateKai",
    "current_position": "Senior Backend Engineer",
    "location": "Toronto, CA",
    "skills_text": "Go, AWS, PostgreSQL, GraphQL, distributed systems",
    "projects_text": "Lead payments platform rewrite for 5M users."
  }'
```

#### Example Response
```json
{
  "data": {
    "candidate_id": "uuid",
    "name": "Kai Patel",
    "age": 33,
    "email": "kai@example.com",
    "current_position": "Senior Backend Engineer",
    "...": "..."
  },
  "embeddingUpdated": true
}
```

### `POST /api/candidates/documents`
Uploads a document (Resume, Transcript, Portfolio) for a candidate.
- **Form Data**: `candidate_id`, `type` (resume|transcript|portfolio|other), `file`.
- **Behavior**: Saves file to storage (local/S3), computes checksum, and links to candidate.

## Search & Query

### `POST /api/candidates` (Filtered Search)
Filtered candidate search over PostgreSQL. Request bodies are validated with Zod (`candidateFiltersSchema`), so `searchTerm` must be a non-empty string while every other field is optional and treated as a preference.

#### Example Request
```bash
curl -X POST http://localhost:3000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "frontend",
    "location": "canada",
    "visaRequired": true,
    "minExperience": 5,
    "maxSalary": 180000,
    "availabilityBefore": "2025-03-01",
    "limit": 20
  }'
```

The route applies the keyword match as the only hard filter, boosts candidates who align with the optional hints (location aliases, visa readiness, experience, compensation, availability), validates the response shape, and returns `{ "data": Candidate[] }`.

### `POST /api/query` (Natural Language Search)
Turns natural-language recruiter prompts into structured filters via OpenAI before executing the search. Request bodies must match `{"query": string, "limit"?: number<=100}`. If `limit` is provided, it also guides shortlist sizing downstream (default 5, capped at 10).

#### Example Request
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Need senior React engineer in Canada, must be eligible for TN visa, salary under 170k",
    "limit": 10
  }'
```
Response includes the inferred filters plus the shortlisted candidates. If `OPENAI_API_KEY` is not configured, the endpoint falls back to keyword-only matching.

### `POST /api/query/shortlist`
Complete recruiter flow: parse intent → apply filters → retrieve semantic matches → generate an LLM-powered shortlist with recommendations. Request schema mirrors `/api/query`.

#### Example Request
```bash
curl -X POST http://localhost:3000/api/query/shortlist \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Looking for a staff-level backend engineer in Toronto with GraphQL experience, TN visa ready.",
    "limit": 5
  }'
```

The response contains the structured shortlist (candidate IDs, age, email, location, match summary, recommended action, confidence) plus the filters applied. When `OPENAI_API_KEY` is not set, the endpoint simply returns the fallback shortlist with neutral scores.

## Verification

### `POST /api/verification/process`
Triggered via Cron or manually to process queued verification jobs.
- **Header**: `x-api-key` (internal protection)

#### Example Request
```bash
curl -X POST http://localhost:3000/api/verification/process \
  -H "Content-Type: application/json" \
  -d '{ "limit": 3 }'
```

If the LLM or web_search isn’t available, the run is marked as failed and the candidate remains usable. Successful runs update the per-candidate confidence average; all API calls emit structured logs via `logEvent`.
