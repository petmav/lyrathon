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

type CandidatePayload = {
  candidate: Record<string, unknown>;
  documents: {
    document_id: string;
    type: string;
    file_url: string | null;
    checksum: string | null;
    is_primary: boolean;
    text?: string | null;
  }[];
  links: {
    submitted: string[];
    duplicates: { link: string; candidate_id: string; candidate_name: string }[];
  };
};

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

export type VerificationRunType = 'full_profile' | 'resume' | 'transcript' | 'project_links';

function aspectHashPayload(payload: CandidatePayload, runType: VerificationRunType) {
  const candidate = payload.candidate ?? {};
  const pick = (obj: Record<string, unknown>, keys: string[]) =>
    keys.reduce<Record<string, unknown>>((acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    }, {});

  const docsFor = (types: string[]) =>
    payload.documents
      .filter((d) => types.includes(d.type))
      .map((d) => ({
        document_id: d.document_id,
        type: d.type,
        checksum: d.checksum,
        file_url: d.file_url,
        is_primary: d.is_primary,
      }));

  if (runType === 'resume') {
    return {
      candidate: pick(candidate, [
        'name',
        'email',
        'age',
        'current_position',
        'location',
        'visa_status',
        'experience_years',
        'salary_expectation',
        'availability_date',
        'skills_text',
        'awards_text',
        'certifications_text',
        'previous_positions',
      ]),
      documents: docsFor(['resume']),
    };
  }

  if (runType === 'transcript') {
    return {
      candidate: pick(candidate, ['education']),
      documents: docsFor(['transcript', 'other']),
    };
  }

  if (runType === 'project_links') {
    return {
      candidate: pick(candidate, ['projects_text', 'skills_text']),
      links: payload.links.submitted,
      documents: docsFor(['portfolio', 'project_links']),
    };
  }

  // full_profile
  return {
    candidate,
    documents: payload.documents.map((d) => ({
      document_id: d.document_id,
      type: d.type,
      checksum: d.checksum,
      file_url: d.file_url,
      is_primary: d.is_primary,
    })),
    links: payload.links.submitted,
  };
}

export async function queueVerificationForCandidate(
  candidateId: string,
  runType: VerificationRunType = 'full_profile',
  payloadOverride?: CandidatePayload,
) {
  const payload = payloadOverride ?? (await buildCandidatePayload(candidateId));
  if (!payload) {
    return null;
  }

  const inputHash = hashPayload({ runType, payload: aspectHashPayload(payload, runType) });

  const existing = await db.query<VerificationRun>(
    `SELECT verification_id, candidate_id, run_type, status, confidence, rationale, input_hash
     FROM verification_runs
     WHERE candidate_id = $1 AND input_hash = $2 AND run_type = $3 AND status IN ('queued', 'processing', 'succeeded')
     ORDER BY created_at DESC
     LIMIT 1`,
    [candidateId, inputHash, runType],
  );

  if (existing.rowCount) {
    return existing.rows[0];
  }

  const inserted = await db.query<VerificationRun>(
    `INSERT INTO verification_runs (candidate_id, run_type, status, input_hash)
     VALUES ($1, $2, 'queued', $3)
     ON CONFLICT DO NOTHING
     RETURNING verification_id, candidate_id, run_type, status, confidence, rationale, input_hash`,
    [candidateId, runType, inputHash],
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

    const result = await processVerificationRun(
      run.verification_id,
      run.candidate_id,
      run.run_type as VerificationRunType,
    );
    return { processed: true, run: result } as const;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper to process multiple queued runs with optional limited concurrency.
export async function processQueuedVerifications(limit = 5, concurrency = 2) {
  let processed = 0;
  let stop = false;

  const worker = async () => {
    while (!stop && processed < limit) {
      const result = await processNextVerificationRun();
      if (!result.processed) {
        stop = true;
        return;
      }
      processed += 1;
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
}

async function hasSuccessfulRun(candidateId: string, runType: VerificationRunType) {
  const res = await db.query(
    `SELECT 1 FROM verification_runs
     WHERE candidate_id = $1 AND run_type = $2 AND status = 'succeeded'
     LIMIT 1`,
    [candidateId, runType],
  );
  return Boolean(res.rowCount);
}

async function hasActiveRun(candidateId: string, runType: VerificationRunType) {
  const res = await db.query(
    `SELECT 1 FROM verification_runs
     WHERE candidate_id = $1
       AND run_type = $2
       AND status IN ('queued', 'processing')
     LIMIT 1`,
    [candidateId, runType],
  );
  return Boolean(res.rowCount);
}

async function latestSucceededRun(candidateId: string, runType: VerificationRunType) {
  const res = await db.query<VerificationRun>(
    `SELECT verification_id, input_hash
     FROM verification_runs
     WHERE candidate_id = $1 AND run_type = $2 AND status = 'succeeded'
     ORDER BY finished_at DESC
     LIMIT 1`,
    [candidateId, runType],
  );
  return res.rows[0] ?? null;
}

async function queueIfReady(
  candidateId: string,
  runType: VerificationRunType,
  ready: boolean,
  currentHash: string,
  payload?: CandidatePayload,
) {
  if (!ready) return false;
  const alreadyActive = await hasActiveRun(candidateId, runType);
  if (alreadyActive) return false;

  const last = await latestSucceededRun(candidateId, runType);
  if (last && last.input_hash === currentHash) return false;

  const queued = await queueVerificationForCandidate(candidateId, runType, payload);
  return Boolean(queued);
}

export async function ensureVerificationRunsForCandidate(candidateId: string) {
  const payload = await buildCandidatePayload(candidateId);
  if (!payload) return;

  const hasResumeDoc = payload.documents.some((doc) => doc.type === 'resume');
  const hasTranscriptDoc = payload.documents.some(
    (doc) => doc.type === 'transcript' || doc.type === 'other',
  );

  const projectLinks = extractLinksFromText(String(payload.candidate.projects_text ?? ''));
  const portfolioDocLinks = payload.documents
    .filter((doc) => doc.type === 'portfolio')
    .map((doc) => normalizeLink(doc.file_url ?? ''))
    .filter((v): v is string => Boolean(v));
  const projectsReady =
    projectLinks.length > 0 ||
    portfolioDocLinks.length > 0 ||
    Boolean(String(payload.candidate.projects_text ?? '').trim());

  let queuedAny = false;
  const currentHashes: Record<VerificationRunType, string> = {
    resume: hashPayload({ runType: 'resume', payload: aspectHashPayload(payload, 'resume') }),
    transcript: hashPayload({ runType: 'transcript', payload: aspectHashPayload(payload, 'transcript') }),
    project_links: hashPayload({ runType: 'project_links', payload: aspectHashPayload(payload, 'project_links') }),
    full_profile: hashPayload({ runType: 'full_profile', payload: aspectHashPayload(payload, 'full_profile') }),
  };

  const lastResume = await latestSucceededRun(candidateId, 'resume');
  const lastTranscript = await latestSucceededRun(candidateId, 'transcript');
  const lastProjects = await latestSucceededRun(candidateId, 'project_links');

  const resumeReady = hasResumeDoc || Boolean(lastResume);
  const transcriptReady = hasTranscriptDoc || Boolean(lastTranscript);
  const projectsReadyFlag = projectsReady || Boolean(lastProjects);

  queuedAny ||= await queueIfReady(candidateId, 'resume', resumeReady, currentHashes.resume, payload);
  queuedAny ||= await queueIfReady(candidateId, 'transcript', transcriptReady, currentHashes.transcript, payload);
  queuedAny ||= await queueIfReady(candidateId, 'project_links', projectsReadyFlag, currentHashes.project_links, payload);

  // Only queue the final full_profile when all aspect runs have succeeded.
  const allSucceeded =
    (await hasSuccessfulRun(candidateId, 'resume')) &&
    (await hasSuccessfulRun(candidateId, 'transcript')) &&
    (await hasSuccessfulRun(candidateId, 'project_links'));

  if (allSucceeded) {
    const lastFull = await latestSucceededRun(candidateId, 'full_profile');
    if (!lastFull || lastFull.input_hash !== currentHashes.full_profile) {
      queuedAny ||= await queueIfReady(candidateId, 'full_profile', true, currentHashes.full_profile, payload);
    }
  }

  if (queuedAny) {
    // Kick off processing in the background.
    setTimeout(() => {
      processQueuedVerifications().catch((err) =>
        console.error('Verification task failed in ensureVerificationRunsForCandidate', err),
      );
    }, 0);
  }
}

async function processVerificationRun(
  verificationId: string,
  candidateId: string,
  runType: VerificationRunType,
) {
  const payload = await buildCandidatePayload(candidateId);
  if (!payload) {
    await markRunFailed(verificationId, 'Candidate not found');
    return null;
  }

  const inputHash = hashPayload({ runType, payload: aspectHashPayload(payload, runType) });
  await db.query(
    `UPDATE verification_runs
     SET input_hash = COALESCE(input_hash, $2)
     WHERE verification_id = $1`,
    [verificationId, inputHash],
  );

  const assessment = await runVerificationModel(payload, runType);

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
    runType,
  });

  // Re-evaluate downstream queues after this run completes.
  ensureVerificationRunsForCandidate(candidateId).catch((err) =>
    console.error('Post-run ensure failed', err),
  );

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
  await db.query(
    `
    WITH aspect_runs AS (
      SELECT DISTINCT ON (run_type) run_type, confidence
      FROM verification_runs
      WHERE candidate_id = $1
        AND status = 'succeeded'
        AND run_type IN ('resume', 'transcript', 'project_links')
        AND confidence IS NOT NULL
      ORDER BY run_type, finished_at DESC
    ),
    counts AS (
      SELECT COUNT(*) AS found, AVG(confidence)::numeric AS avg_conf
      FROM aspect_runs
    )
    UPDATE candidate
    SET verifiable_confidence_score = (
      SELECT CASE WHEN found = 3 THEN avg_conf ELSE NULL END FROM counts
    ),
        profile_updated_at = now()
    WHERE candidate_id = $1;
    `,
    [candidateId],
  );
}

function hashPayload(payload: unknown) {
  const normalize = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map((v) => normalize(v));
    }
    if (value && typeof value === 'object') {
      const sortedKeys = Object.keys(value).sort();
      const obj: Record<string, unknown> = {};
      for (const key of sortedKeys) {
        obj[key] = normalize((value as any)[key]);
      }
      return obj;
    }
    return value;
  };

  const normalizedPayload = normalize(payload);
  return crypto.createHash('sha256').update(JSON.stringify(normalizedPayload)).digest('hex');
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

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
     ORDER BY created_at DESC`,
    [candidateId],
  );

  // Always include the newest document per type, then fill with additional recents up to a safe cap.
  const selectDocsForVerification = (rows: typeof docs.rows) => {
    const byType = new Map<string, (typeof docs.rows)[number]>();
    for (const doc of rows) {
      if (!byType.has(doc.type)) {
        byType.set(doc.type, doc);
      }
    }
    const selected: (typeof docs.rows)[number][] = Array.from(byType.values());
    for (const doc of rows) {
      if (selected.length >= 12) break;
      if (!selected.includes(doc)) {
        selected.push(doc);
      }
    }
    return selected;
  };

  const docsForVerification = selectDocsForVerification(docs.rows);

  const hydratedDocs = await Promise.all(
    docsForVerification.map(async (doc) => {
      const text = await getDocumentTextWithCache(doc);
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

type CachedDocRow = {
  text_content: string | null;
  checksum: string;
  content_type: string | null;
  bytes: number | null;
};

async function getDocumentTextWithCache(doc: {
  document_id: string;
  file_url: string | null;
  checksum: string | null;
}) {
  if (!doc.file_url || !doc.checksum) return null;

  const cached = await db.query<CachedDocRow>(
    `SELECT text_content, checksum, content_type, bytes
     FROM candidate_document_cache
     WHERE document_id = $1 AND checksum = $2`,
    [doc.document_id, doc.checksum],
  );

  if (cached.rowCount && cached.rows[0].text_content) {
    return {
      text: cached.rows[0].text_content,
      bytes: cached.rows[0].bytes ?? 0,
      contentType: cached.rows[0].content_type ?? undefined,
    };
  }

  const fetched = await fetchDocumentText(doc.file_url).catch(() => null);
  if (!fetched?.text) return null;

  await db.query(
    `INSERT INTO candidate_document_cache (document_id, checksum, text_content, content_type, bytes, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (document_id) DO UPDATE
     SET checksum = EXCLUDED.checksum,
         text_content = EXCLUDED.text_content,
         content_type = EXCLUDED.content_type,
         bytes = EXCLUDED.bytes,
         updated_at = now()`,
    [doc.document_id, doc.checksum, fetched.text, fetched.contentType ?? null, fetched.bytes ?? null],
  );

  return fetched;
}

type VerificationAssessment = {
  overall_confidence: number;
  summary: string;
  checks: { aspect: string; confidence: number; rationale: string }[];
  web_search_used?: boolean;
};

const RUN_TYPE_ASPECTS: Record<VerificationRunType, string[]> = {
  full_profile: ['resume', 'education', 'projects'],
  resume: ['resume'],
  transcript: ['education'],
  project_links: ['projects'],
};

function allowedAspects(runType: VerificationRunType) {
  return RUN_TYPE_ASPECTS[runType] ?? RUN_TYPE_ASPECTS.full_profile;
}

function normalizeAspect(aspect: string) {
  const lower = aspect.toLowerCase();
  if (lower.includes('project')) return 'projects';
  if (lower.includes('education') || lower.includes('transcript')) return 'education';
  return 'resume';
}

async function runVerificationModel(
  payload: CandidatePayload,
  runType: VerificationRunType,
): Promise<VerificationAssessment | null> {
  const allowed = allowedAspects(runType);

  if (!verificationClient) {
    return {
      overall_confidence: 0.5,
      summary: 'Verification model unavailable; returning neutral confidence.',
      checks: allowed.map((aspect) => ({
        aspect,
        confidence: 0.5,
        rationale: 'LLM not available',
      })),
    };
  }

  // Use web search only for project_links runs to avoid long-running full_profile calls.
  const hasLinks = runType === 'project_links' && payload.links.submitted.length > 0;
  const runInstructions: Record<VerificationRunType, string> = {
    resume:
      'Review the resume file for credibility and alignment with the candidate profile (exclude projects and transcript/testamur context). Return confidence 0-1 for how well the resume reflects the claimed profile.',
    transcript:
      'Review the transcript/testamur file for credibility and alignment with the candidate profile (exclude resume/projects context). Focus on whether education/grades support the claimed profile. Return confidence 0-1.',
    project_links:
      'Review the provided project links for credibility and alignment with the candidate profile. Use web_search to validate links and assess whether projects match the claimed skills/roles. Return confidence 0-1.',
    full_profile:
      'Review all provided evidence (resume, transcript, projects) for credibility and alignment with the candidate profile. Return confidence 0-1 for overall fit.',
  };

  const callModel = async () => {
    const timeoutMs = 60_000;
    const call = verificationClient.responses.create({
      model: VERIFICATION_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'You are a verification agent. Return JSON with per-aspect confidence (0-1) limited to the target aspects, plus an overall confidence for those aspects only.',
                runInstructions[runType],
                'If evidence for a target aspect is missing, state that explicitly instead of inventing details.',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildVerificationPrompt(payload, runType),
            },
          ],
        },
      ],
      tools: hasLinks ? [{ type: 'web_search' }] : undefined,
      tool_choice: hasLinks ? 'auto' : 'none',
      text: {
        format: {
          type: 'json_schema',
          name: 'VerificationResult',
          schema: verificationJsonSchema,
        },
      },
    });

    return await Promise.race([
      call,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('verification call timed out')), timeoutMs),
      ),
    ]);
  };

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response: Response | null = null;
    try {
      response = await callModel();
    } catch (err) {
      if (attempt === maxAttempts - 1) {
        console.error('Verification model failed', err);
        return null;
      }
      continue;
    }

    if (!response) continue;
    const output = extractOutputText(response);
    if (!output) {
      if (attempt === maxAttempts - 1) return null;
      continue;
    }

    try {
      const parsed = JSON.parse(output) as VerificationAssessment;
      const filteredChecks = (parsed.checks || [])
        .map((check) => ({
          aspect: normalizeAspect(check.aspect),
          confidence: clampConfidence(Number(check.confidence)),
          rationale: check.rationale,
        }))
        .filter((check) => allowed.includes(check.aspect));

      if (!filteredChecks.length) {
        allowed.forEach((aspect) =>
          filteredChecks.push({
            aspect,
            confidence: clampConfidence(parsed.overall_confidence ?? 0),
            rationale: 'Model did not return this aspect; using overall confidence.',
          }),
        );
      }

      const overall =
        runType === 'full_profile'
          ? clampConfidence(parsed.overall_confidence)
          : clampConfidence(filteredChecks[0]?.confidence ?? parsed.overall_confidence);

      return {
        overall_confidence: overall,
        summary: parsed.summary,
        checks: filteredChecks,
        web_search_used: didUseWebSearch(response),
      };
    } catch (error) {
      console.error('Failed to parse verification output', error, output);
      if (attempt === maxAttempts - 1) return null;
      // retry next loop
    }
  }
  return null;
}

function buildVerificationPrompt(payload: CandidatePayload, runType: VerificationRunType): string {
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

  const educationClaims = Array.isArray(candidate.education)
    ? JSON.stringify(candidate.education, null, 2)
    : String(candidate.education ?? '[]');
  const previousPositions = Array.isArray(candidate.previous_positions)
    ? JSON.stringify(candidate.previous_positions, null, 2)
    : String(candidate.previous_positions ?? '[]');

  const docsForRun =
    runType === 'resume'
      ? docs.filter((d) => d.type === 'resume')
      : runType === 'transcript'
        ? docs.filter((d) => d.type === 'transcript' || d.type === 'other')
        : runType === 'project_links'
          ? docs.filter((d) => d.type === 'portfolio')
          : docs;

  const docSummary = formatDocumentSummaries(docsForRun, {
    defaultWordLimit: 700,
    perTypeWordLimits: {
      resume: 700, // ~2 pages
      transcript: 1400, // ~4 pages
      other: 1400,
    },
  });
  const includeProjects = runType === 'project_links' || runType === 'full_profile';
  const includeEducation = runType !== 'project_links';

  return [
    `Candidate: ${candidate.name} (${candidate.email})`,
    `Location: ${candidate.location ?? 'n/a'} | Visa: ${candidate.visa_status ?? 'n/a'} | Experience: ${candidate.experience_years ?? 'n/a'} years`,
    `Current role: ${candidate.current_position ?? 'n/a'}`,
    `Skills: ${candidate.skills_text ?? 'n/a'}`,
    includeProjects ? `Projects: ${candidate.projects_text ?? 'n/a'}` : undefined,
    includeEducation ? `Education claims JSON: ${educationClaims}` : undefined,
    includeEducation ? `Previous positions JSON: ${previousPositions}` : undefined,
    docSummary,
    includeProjects ? linkLines : undefined,
    includeProjects ? overlapLines : undefined,
    `Target aspects for this run: ${allowedAspects(runType).join(', ')}`,
    'Provide per-aspect confidence only for the target aspects, then an overall confidence based solely on them. If links exist, try web search before deciding; if no links or search is unavailable, state that explicitly.',
  ]
    .filter(Boolean)
    .join('\n');
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
    ...docs
      .filter((d) => ['portfolio', 'project_links'].includes(String((d as any).type)))
      .map((d) => normalizeLink(d.file_url ?? ''))
      .filter((v): v is string => Boolean(v)),
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
