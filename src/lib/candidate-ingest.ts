import { createHash } from 'crypto';
import { pool } from '@/lib/db';
import { generateEmbedding, getEmbeddingModel } from '@/lib/embeddings';
import { vectorToSql } from '@/lib/vector';

export type PreviousPosition = {
  title: string;
  org: string;
  start_date?: string;
  end_date?: string;
};

export type EducationEntry = {
  degree: string;
  school: string;
  graduation_year?: number;
};

export type CandidateInput = {
  name: string;
  email: string;
  age: number;
  password_hash: string;
  current_position?: string;
  location?: string;
  visa_status?: string;
  experience_years?: number;
  salary_expectation?: number;
  availability_date?: string;
  skills_text?: string;
  awards_text?: string;
  certifications_text?: string;
  projects_text?: string;
  previous_positions?: PreviousPosition[];
  education?: EducationEntry[];
};

export type CandidateRecord = CandidateInput & {
  candidate_id: string;
  profile_updated_at: string;
};

type CandidateEmbeddingSource = {
  candidate_id: string;
  name: string;
  current_position?: string | null;
  location?: string | null;
  visa_status?: string | null;
  experience_years?: number | null;
  skills_text?: string | null;
  awards_text?: string | null;
  certifications_text?: string | null;
  projects_text?: string | null;
  previous_positions?: unknown;
  education?: unknown;
};

export async function saveCandidate(
  input: CandidateInput,
): Promise<CandidateRecord> {
  const existing = await pool.query(
    `SELECT candidate_id FROM candidate WHERE email = $1`,
    [input.email],
  );

  if (!existing.rowCount) {
    const result = await pool.query(
      `
        INSERT INTO candidate (
          name,
          age,
          email,
          password_hash,
          current_position,
          location,
          visa_status,
          experience_years,
          salary_expectation,
          availability_date,
          skills_text,
          awards_text,
          certifications_text,
          projects_text,
          previous_positions,
          education
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )
        RETURNING *
      `,
      [
        input.name,
        input.age,
        input.email,
        input.password_hash,
        normalizeCurrentPosition(input.current_position),
        input.location ?? null,
        input.visa_status ?? null,
        input.experience_years ?? null,
        input.salary_expectation ?? null,
        input.availability_date ?? null,
        input.skills_text ?? null,
        input.awards_text ?? null,
        input.certifications_text ?? null,
        input.projects_text ?? null,
        JSON.stringify(input.previous_positions ?? []),
        JSON.stringify(input.education ?? []),
      ],
    );

    return result.rows[0] as CandidateRecord;
  }

  const updates: string[] = [];
  const values: Array<string | number | null> = [];
  const hasField = (field: keyof CandidateInput) =>
    Object.prototype.hasOwnProperty.call(input, field);

  const pushUpdate = (field: string, value: string | number | null) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (hasField('name')) pushUpdate('name', input.name ?? null);
  if (hasField('age')) pushUpdate('age', input.age ?? null);
  if (hasField('password_hash'))
    pushUpdate('password_hash', input.password_hash ?? null);
  if (hasField('current_position'))
    pushUpdate('current_position', normalizeCurrentPosition(input.current_position));
  if (hasField('location')) pushUpdate('location', input.location ?? null);
  if (hasField('visa_status')) pushUpdate('visa_status', input.visa_status ?? null);
  if (hasField('experience_years'))
    pushUpdate('experience_years', input.experience_years ?? null);
  if (hasField('salary_expectation'))
    pushUpdate('salary_expectation', input.salary_expectation ?? null);
  if (hasField('availability_date'))
    pushUpdate('availability_date', input.availability_date ?? null);
  if (hasField('skills_text')) pushUpdate('skills_text', input.skills_text ?? null);
  if (hasField('awards_text')) pushUpdate('awards_text', input.awards_text ?? null);
  if (hasField('certifications_text'))
    pushUpdate('certifications_text', input.certifications_text ?? null);
  if (hasField('projects_text'))
    pushUpdate('projects_text', input.projects_text ?? null);
  if (hasField('previous_positions'))
    pushUpdate('previous_positions', JSON.stringify(input.previous_positions ?? []));
  if (hasField('education'))
    pushUpdate('education', JSON.stringify(input.education ?? []));

  updates.push('profile_updated_at = NOW()');
  values.push(input.email);

  const result = await pool.query(
    `
      UPDATE candidate
      SET ${updates.join(', ')}
      WHERE email = $${values.length}
      RETURNING *
    `,
    values,
  );

  return result.rows[0] as CandidateRecord;
}

export async function refreshCandidateEmbedding(candidateId: string) {
  const candidateResult = await pool.query(
    `
      SELECT
        candidate_id,
        name,
        current_position,
        location,
        visa_status,
        experience_years,
        skills_text,
        awards_text,
        certifications_text,
        projects_text,
        previous_positions,
        education
      FROM candidate
      WHERE candidate_id = $1
    `,
    [candidateId],
  );

  if (!candidateResult.rowCount) {
    throw new Error(`Candidate ${candidateId} not found.`);
  }

  const candidate = candidateResult.rows[0] as CandidateEmbeddingSource;
  const embeddingText = buildEmbeddingText(candidate);
  const contentHash = createHash('sha256').update(embeddingText).digest('hex');

  const existing = await pool.query(
    `SELECT content_hash FROM candidate_embeddings WHERE candidate_id = $1`,
    [candidateId],
  );

  if (existing.rowCount && existing.rows[0].content_hash === contentHash) {
    return { updated: false };
  }

  const embedding = await generateEmbedding(embeddingText);
  if (!embedding) {
    return { updated: false };
  }

  const vector = vectorToSql(embedding);
  const model = getEmbeddingModel();

  await pool.query(
    `
      INSERT INTO candidate_embeddings (
        candidate_id,
        embedding,
        embedding_model,
        content_hash
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        embedding_model = EXCLUDED.embedding_model,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW()
    `,
    [candidateId, vector, model, contentHash],
  );

  return { updated: true };
}

function normalizeCurrentPosition(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : 'Not employed';
}

function buildEmbeddingText(candidate: CandidateEmbeddingSource) {
  const sections: string[] = [
    `Name: ${candidate.name}`,
    candidate.current_position ? `Current Position: ${candidate.current_position}` : null,
    candidate.location ? `Location: ${candidate.location}` : null,
    candidate.visa_status ? `Visa: ${candidate.visa_status}` : null,
    candidate.experience_years
      ? `Experience: ${candidate.experience_years} years`
      : null,
    candidate.skills_text ? `Skills: ${candidate.skills_text}` : null,
    candidate.projects_text ? `Projects: ${candidate.projects_text}` : null,
    candidate.awards_text ? `Awards: ${candidate.awards_text}` : null,
    candidate.certifications_text
      ? `Certifications: ${candidate.certifications_text}`
      : null,
  ].filter(Boolean) as string[];

  const previousPositions = safeArray(candidate.previous_positions)
    .map(
      (pos) =>
        `Previous Role: ${pos.title ?? ''} at ${pos.org ?? ''} (${pos.start_date ?? ''} - ${pos.end_date ?? ''})`,
    )
    .filter(Boolean);

  const education = safeArray(candidate.education)
    .map(
      (edu) =>
        `Education: ${edu.degree ?? ''} at ${edu.school ?? ''} (${edu.graduation_year ?? ''})`,
    )
    .filter(Boolean);

  return [...sections, ...previousPositions, ...education].join('\n');
}

function safeArray(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
