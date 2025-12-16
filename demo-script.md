# Demo Script (≤4 minutes)

Format: on-screen actions + narration cues. Aim for a smooth, single take with minimal context-switching.

## 0. Prep (off-camera, before recording)
- Run `npm run dev` and ensure the PostgreSQL container is up with seeded data.
- Open tabs: Landing (`/`), Applicant register (`/register`), Recruiter register (`/register/recruiter`), Recruiter console (`/recruiter_query_page`).
- Prepare two example queries:
  - “Senior React engineer in Canada, TN eligible, salary under 180k”
  - “Backend Go + Kafka, remote-friendly, salary < 200k”

## 1. Hook & Problem (0:00–0:30)
- Screen: Landing hero (scroll position top).
- Say: “Traditional recruiting forces candidates to spray resumes and recruiters to sift noise. Hard filters like visa/location get mixed with subjective fit, and context is lost across channels.”
- Say: “We built Linkdr to collapse this into one pass: one candidate submission, one natural-language recruiter query, transparent shortlists with reasons.”

## 2. Who & Pain Point (0:30–0:50)
- Screen: Briefly scroll hero → KPI cards.
- Say: “Pain hits two groups: candidates waste time reapplying; recruiters wrestle with irrelevant resumes and hidden constraints like visa, salary, availability.”

## 3. What We Built (0:50–1:10)
- Screen: Landing “Applicants / Recruiters” cards.
- Say: “Applicants submit once. Recruiters ask in plain language. We run SQL hard filters first, hybrid BM25 + pgvector, then LLM re-rank and generate a shortlist with contact details and rationale.”

## 4. Live Demo — Candidate Side (1:10–1:40)
- Screen: `/register` page.
- Action: Show brand tile (clickable home), highlight glass form. Enter demo data quickly (or show prefilled), submit.
- Say: “Applicant drops structured info plus free-text skills/projects. We normalize to SQL and queue embeddings.”

## 5. Live Demo — Recruiter Side (1:40–3:00)
- Screen: `/recruiter_query_page`.
- Action: Type query 1 (“Senior React… TN eligible… <180k”), hit Enter. Let “thinking” indicator run briefly; show streamed shortlist cards fading in; scroll summary below.
- Say: “We extract hard filters via structured output, run SQL pruning, hybrid search, then LLM re-rank. Cards include contact info, visa, salary, and the why.”
- Action: Send query 2 (“Backend Go + Kafka…”), show chronological chat: recruiter bubble → shortlist cards → summary.
- Say: “Chronology is preserved like a chat. Shortlists are capped by requested limit; confidence scored and schema-validated.”

## 6. Edge & Differentiation (3:00–3:20)
- Screen: Scroll cards/summary briefly.
- Say: “Edge: deterministic SQL first to cut spend, hybrid retrieval for recall, explainable LLM outputs with JSON schema validation, and contact-ready cards. Both applicant and recruiter flows share the same data spine.”

## 7. Technical Approach (3:20–3:40)
- Screen: Quick tab to code (optional) or narrate over console.
- Say: “PostgreSQL + pgvector store embeddings; SQL handles visa/location/availability; BM25 + kNN combine for recall; LLM re-ranks then formats via structured outputs. Frontend is Next.js with staged reveals and chat-like recruiter console. Validation via Zod; tests cover query parsing, candidate search, and shortlist shaping.”

## 8. Close (3:40–4:00)
- Screen: Back to landing hero.
- Say: “Linkdr turns a fragmented funnel into one conversation for both sides. Ready to plug into your ATS or run standalone.”

## Optional Backups (if time permits)
- Show API curl example for `/api/query/shortlist`.
- Mention monitoring hooks planned for retrieval metrics and feedback loops.
