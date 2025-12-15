import crypto from 'crypto';
import OpenAI from 'openai';
import type { Response } from 'openai/resources/responses/responses';
import { db } from '@/lib/db';
import { logEvent } from '@/lib/logger';
import { fetchDocumentText, formatDocumentSummaries } from '@/lib/document-fetcher';

const VERIFICATION_MODEL =
  process.env.OPENAI_VERIFICATION_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-5-mini';

const verificationClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const verificationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overall_confidence: { type: 'number' },
    summary: { type: 'string' },
    checks: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          aspect: { type: 'string' },
          confidence: { type: 'number' },
          rationale: { type: 'string' },
        },
        required: ['aspect', 'confidence', 'rationale'],
      },
    },
  },
  required: ['overall_confidence', 'summary', 'checks'],
} as const;

export type VerificationRun = {
  verification_id: string;
  candidate_id: string;
  run_type: string;
  status: string;
  confidence: number | null;
  rationale: string | null;
  input_hash: string | null;
  link_overlap_count?: number | null;
};

export async function queueVerificationForCandidate(candidateId: string) {
  const payload = await buildCandidatePayload(candidateId);
  if (!payload) {
    return null;
  }

  const inputHash = hashPayload(payload);

  const existing = await db.query<VerificationRun>(
    `SELECT verification_id, candidate_id, run_type, status, confidence, rationale, input_hash
     FROM verification_runs
     WHERE candidate_id = $1 AND input_hash = $2 AND status IN ('succeeded', 'processing')
     ORDER BY created_at DESC
     LIMIT 1`,
    [candidateId, inputHash],
  );

  if (existing.rowCount) {
    return existing.rows[0];
  }

  const inserted = await db.query<VerificationRun>(
    `INSERT INTO verification_runs (candidate_id, run_type, status, input_hash)
     VALUES ($1, 'full_profile', 'queued', $2)
     ON CONFLICT DO NOTHING
     RETURNING verification_id, candidate_id, run_type, status, confidence, rationale, input_hash`,
    [candidateId, inputHash],
  );

  return inserted.rows[0] ?? null;
}

export async function processNextVerificationRun() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const queued = await client.query<VerificationRun>(
      `SELECT verification_id, candidate_id, run_type, status, confidence, rationale, input_hash
       FROM verification_runs
       WHERE status = 'queued'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    );

    if (!queued.rowCount) {
      await client.query('COMMIT');
      return { processed: false } as const;
    }

    const run = queued.rows[0];
    await client.query(
      `UPDATE verification_runs
       SET status = 'processing', started_at = now(), updated_at = now()
       WHERE verification_id = $1`,
      [run.verification_id],
    );
    await client.query('COMMIT');

    const result = await processVerificationRun(run.verification_id, run.candidate_id);
    return { processed: true, run: result } as const;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function processVerificationRun(verificationId: string, candidateId: string) {
  const payload = await buildCandidatePayload(candidateId);
  if (!payload) {
    await markRunFailed(verificationId, 'Candidate not found');
    return null;
  }

  const inputHash = hashPayload(payload);
  await db.query(
    `UPDATE verification_runs
     SET input_hash = COALESCE(input_hash, $2)
     WHERE verification_id = $1`,
    [verificationId, inputHash],
  );

  const assessment = await runVerificationModel(payload);

  if (!assessment) {
    await markRunFailed(verificationId, 'Verification model unavailable');
    return null;
  }

  const confidence = clampConfidence(assessment.overall_confidence ?? 0);

  await db.query(
    `UPDATE verification_runs
     SET status = 'succeeded',
         confidence = $2,
         rationale = $3,
         metadata = $4,
         link_overlap_count = $5,
         link_notes = $6,
         web_search_used = $7,
         updated_at = now(),
         finished_at = now()
     WHERE verification_id = $1`,
    [
      verificationId,
      confidence,
      assessment.summary,
      JSON.stringify(assessment.checks),
      payload.links.duplicates.length,
      payload.links.duplicates.map((d) => `${d.link} -> ${d.candidate_name}`).join(' | '),
      assessment.web_search_used,
    ],
  );

  await recomputeCandidateVerificationScore(candidateId);

  await logEvent('info', 'verification.run.succeeded', {
    verificationId,
    candidateId,
    confidence,
  });

  return {
    verification_id: verificationId,
    candidate_id: candidateId,
    confidence,
    rationale: assessment.summary,
    link_overlap_count: payload.links.duplicates.length,
  } as VerificationRun;
}

async function markRunFailed(verificationId: string, reason: string) {
  await db.query(
    `UPDATE verification_runs
     SET status = 'failed', rationale = $2, updated_at = now(), finished_at = now()
     WHERE verification_id = $1`,
    [verificationId, reason],
  );

  await logEvent('error', 'verification.run.failed', {
    verificationId,
    reason,
  });
}

async function recomputeCandidateVerificationScore(candidateId: string) {
  const agg = await db.query<{ avg: number | null }>(
    `SELECT AVG(confidence) AS avg
     FROM verification_runs
     WHERE candidate_id = $1 AND status = 'succeeded' AND confidence IS NOT NULL`,
    [candidateId],
  );

  const avg = agg.rows[0]?.avg ?? 0;
  await db.query(
    `UPDATE candidate
     SET verifiable_confidence_score = $2,
         profile_updated_at = now()
     WHERE candidate_id = $1`,
    [candidateId, avg],
  );
}

function hashPayload(payload: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

type CandidatePayload = {
  candidate: Record<string, unknown>;
  documents: { document_id: string; type: string; file_url: string | null; checksum: string | null; is_primary: boolean; text?: string | null }[];
  links: {
    submitted: string[];
    duplicates: { link: string; candidate_id: string; candidate_name: string }[];
  };
};

async function buildCandidatePayload(candidateId: string): Promise<CandidatePayload | null> {
  const candidateResult = await db.query(
    `SELECT candidate_id, name, age, email, current_position, location, visa_status, experience_years,
            salary_expectation, availability_date, skills_text, awards_text, certifications_text, projects_text,
            previous_positions, education
     FROM candidate
     WHERE candidate_id = $1`,
    [candidateId],
  );

  if (!candidateResult.rowCount) return null;

  const docs = await db.query(
    `SELECT document_id, type, file_url, checksum, is_primary
     FROM candidate_documents
     WHERE candidate_id = $1
     ORDER BY created_at ASC`,
    [candidateId],
  );

  const hydratedDocs = await Promise.all(
    docs.rows.slice(0, 5).map(async (doc) => {
      const text = await fetchDocumentText(doc.file_url).catch(() => null);
      if (text?.text) {
        await logEvent('info', 'verification.document.text_extracted', {
          candidateId,
          documentId: doc.document_id,
          type: doc.type,
          bytes: text.bytes,
        });
      }
      return { ...doc, text: text?.text ?? null };
    }),
  );

  return {
    candidate: candidateResult.rows[0],
    documents: hydratedDocs,
    links: await resolveLinks(candidateId, candidateResult.rows[0], docs.rows),
  };
}

type VerificationAssessment = {
  overall_confidence: number;
  summary: string;
  checks: { aspect: string; confidence: number; rationale: string }[];
  web_search_used?: boolean;
};

async function runVerificationModel(payload: CandidatePayload): Promise<VerificationAssessment | null> {
  if (!verificationClient) {
    return {
      overall_confidence: 0.5,
      summary: 'Verification model unavailable; returning neutral confidence.',
      checks: [
        { aspect: 'resume', confidence: 0.5, rationale: 'LLM not available' },
        { aspect: 'education', confidence: 0.5, rationale: 'LLM not available' },
        { aspect: 'projects', confidence: 0.5, rationale: 'LLM not available' },
      ],
    };
  }

  const response = await verificationClient.responses.create({
    model: VERIFICATION_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: "You are a verification agent. Evaluate whether the candidate's resume, education claims, transcript, and linked projects align. Return JSON with per-aspect confidence (0-1) and an overall confidence."
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildVerificationPrompt(payload),
          },
        ],
      },
    ],
    tools: [{ type: 'web_search' }],
    tool_choice: 'auto',
    text: {
      format: {
        type: 'json_schema',
        name: 'VerificationResult',
        schema: verificationJsonSchema,
      },
    },
  });

  const output = extractOutputText(response);
  if (!output) return null;

  try {
    const parsed = JSON.parse(output) as VerificationAssessment;
    return {
      overall_confidence: clampConfidence(parsed.overall_confidence),
      summary: parsed.summary,
      checks: (parsed.checks || []).map((check) => ({
        aspect: check.aspect,
        confidence: clampConfidence(Number(check.confidence)),
        rationale: check.rationale,
      })),
      web_search_used: didUseWebSearch(response),
    };
  } catch (error) {
    console.error('Failed to parse verification output', error, output);
    return null;
  }
}

function buildVerificationPrompt(payload: CandidatePayload): string {
  const candidate = payload?.candidate ?? {};
  const docs = payload?.documents ?? [];
  const linkLines = payload.links.submitted.length
    ? `Links provided: ${payload.links.submitted.join(' | ')}`
    : 'Links provided: none';
  const overlapLines = payload.links.duplicates.length
    ? `Potential duplicate links on other candidates: ${payload.links.duplicates
        .map((d) => `${d.link} (also on ${d.candidate_name})`)
        .join(' | ')}`
    : 'Potential duplicate links on other candidates: none detected';

  const docSummary = formatDocumentSummaries(docs);
  return [
    `Candidate: ${candidate.name} (${candidate.email})`,
    `Location: ${candidate.location ?? 'n/a'} | Visa: ${candidate.visa_status ?? 'n/a'} | Experience: ${candidate.experience_years ?? 'n/a'} years`,
    `Current role: ${candidate.current_position ?? 'n/a'}`,
    `Skills: ${candidate.skills_text ?? 'n/a'}`,
    `Projects: ${candidate.projects_text ?? 'n/a'}`,
    `Education claims: ${candidate.education ?? 'n/a'}`,
    docSummary,
    linkLines,
    overlapLines,
    'Provide per-aspect confidence for resume alignment, education claims, and project links, then an overall confidence. Use web search on provided links if helpful, and note overlaps as potential risk.',
  ].join('\n');
}

function extractOutputText(response: Response) {
  if (!response?.output?.length) return null;
  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const content of item.content) {
        if (content.type === 'output_text' && content.text) {
          return content.text;
        }
      }
    }
  }
  return null;
}

function didUseWebSearch(response: Response): boolean {
  if (!response?.output?.length) return false;
  return response.output.some((item) => item.type === 'web_search_call');
}

function normalizeLink(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/[),.;]+$/, '');
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    url.hash = '';
    return url.toString().toLowerCase();
  } catch (error) {
    return trimmed.toLowerCase();
  }
}

export function extractLinksFromText(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>()"']+/gi) || [];
  const normalized = matches
    .map((m) => normalizeLink(m))
    .filter((v): v is string => Boolean(v));
  return Array.from(new Set(normalized));
}

async function resolveLinks(
  candidateId: string,
  candidate: Record<string, unknown>,
  docs: { file_url: string | null }[],
) {
  const submitted = [
    ...extractLinksFromText(String(candidate.projects_text ?? '')),
    ...extractLinksFromText(String(candidate.skills_text ?? '')),
    ...docs.map((d) => normalizeLink(d.file_url ?? '')).filter((v): v is string => Boolean(v)),
  ];

  const uniqueLinks = Array.from(new Set(submitted));
  const duplicates = await findLinkOverlaps(candidateId, uniqueLinks);

  return {
    submitted: uniqueLinks,
    duplicates,
  } as const;
}

async function findLinkOverlaps(candidateId: string, links: string[]) {
  if (!links.length) return [] as { link: string; candidate_id: string; candidate_name: string }[];

  const overlaps: { link: string; candidate_id: string; candidate_name: string }[] = [];

  for (const link of links.slice(0, 10)) {
    const pattern = `%${link}%`;
    const match = await db.query<{ candidate_id: string; name: string }>(
      `SELECT candidate_id, name
       FROM candidate
       WHERE candidate_id <> $1
         AND (
           projects_text ILIKE $2 OR
           skills_text ILIKE $2 OR
           awards_text ILIKE $2 OR
           certifications_text ILIKE $2
         )
       ORDER BY profile_created_at ASC
       LIMIT 3`,
      [candidateId, pattern],
    );

    match.rows.forEach((row) => {
      overlaps.push({ link, candidate_id: row.candidate_id, candidate_name: row.name });
    });
  }

  return overlaps.slice(0, 10);
}
