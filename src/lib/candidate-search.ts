import { pool } from '@/lib/db';
import { vectorToSql } from '@/lib/vector';

export type CandidateFilters = {
  searchTerm?: string;
  location?: string;
  visaRequired?: boolean;
  visaStatus?: string;
  minExperience?: number;
  maxSalary?: number;
  availabilityBefore?: string;
  limit?: number;
};

export async function searchCandidates(
  filters: CandidateFilters = {},
  semanticEmbedding?: number[] | null,
) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  const scoreParts: string[] = [];

  if (filters.searchTerm?.trim()) {
    values.push(`%${filters.searchTerm.trim()}%`);
    const idx = values.length;
    clauses.push(
      `(skills_text ILIKE $${idx} OR projects_text ILIKE $${idx} OR current_position ILIKE $${idx})`,
    );
  }

  applyLocationScoring(filters.location, values, scoreParts);
  applyVisaScoring(filters, values, scoreParts);
  applyExperienceScoring(filters, values, scoreParts);
  applySalaryScoring(filters, values, scoreParts);
  applyAvailabilityScoring(filters, values, scoreParts);

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Math.min(filters.limit ?? 25, 100);
  const joins: string[] = [];

  const scoreExpression = scoreParts.length ? scoreParts.join(' + ') : '0';
  const orderPieces: string[] = ['preference_score DESC'];

  if (semanticEmbedding && semanticEmbedding.length) {
    const vectorParam = vectorToSql(semanticEmbedding);
    values.push(vectorParam);
    joins.push(
      'LEFT JOIN candidate_embeddings ce ON ce.candidate_id = candidate.candidate_id',
    );
    orderPieces.push(
      'CASE WHEN ce.embedding IS NULL THEN 1 ELSE 0 END',
      `ce.embedding <-> $${values.length}`,
    );
  }

  orderPieces.push('candidate.profile_updated_at DESC');
  values.push(limit);

  const query = `
    SELECT
      candidate.candidate_id,
      candidate.name,
      candidate.current_position,
      candidate.location,
      candidate.visa_status,
      candidate.experience_years,
      candidate.salary_expectation,
      candidate.availability_date,
      candidate.skills_text,
      candidate.projects_text,
      candidate.profile_updated_at,
      ${scoreExpression} AS preference_score
    FROM candidate
    ${joins.join('\n')}
    ${whereClause}
    ORDER BY ${orderPieces.join(', ')}
    LIMIT $${values.length}
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  canada: ['ca'],
  'united states': ['us', 'usa'],
  'united kingdom': ['uk', 'gb'],
  germany: ['de'],
  france: ['fr'],
  australia: ['au'],
  japan: ['jp'],
  india: ['in'],
};

function buildLocationPatterns(input: string) {
  const normalized = input.trim().toLowerCase();
  const patterns = new Set<string>();
  patterns.add(`%${normalized}%`);

  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (country === normalized || aliases.includes(normalized)) {
      patterns.add(`%${country}%`);
      aliases.forEach((alias) => patterns.add(`%${alias}%`));
      break;
    }
  }

  return Array.from(patterns);
}

function applyLocationScoring(
  location: string | undefined,
  values: Array<string | number>,
  scoreParts: string[],
) {
  if (!location?.trim()) return;
  const patterns = buildLocationPatterns(location);
  const likeClauses: string[] = [];
  patterns.forEach((pattern) => {
    values.push(pattern);
    likeClauses.push(`LOWER(candidate.location) LIKE LOWER($${values.length})`);
  });
  if (!likeClauses.length) return;
  scoreParts.push(`CASE WHEN ${likeClauses.join(' OR ')} THEN 2 ELSE 0 END`);
}

function applyVisaScoring(
  filters: CandidateFilters,
  values: Array<string | number>,
  scoreParts: string[],
) {
  if (filters.visaRequired) {
    scoreParts.push(
      `CASE WHEN candidate.visa_status IS NOT NULL AND candidate.visa_status <> '' THEN 1 ELSE 0 END`,
    );
  }

  if (filters.visaStatus?.trim()) {
    values.push(`%${filters.visaStatus.trim()}%`);
    scoreParts.push(`CASE WHEN candidate.visa_status ILIKE $${values.length} THEN 1 ELSE 0 END`);
  }
}

function applyExperienceScoring(
  filters: CandidateFilters,
  values: Array<string | number>,
  scoreParts: string[],
) {
  if (typeof filters.minExperience === 'number') {
    values.push(filters.minExperience);
    scoreParts.push(
      `CASE WHEN candidate.experience_years IS NOT NULL AND candidate.experience_years >= $${values.length} THEN 1 ELSE 0 END`,
    );
  }
}

function applySalaryScoring(
  filters: CandidateFilters,
  values: Array<string | number>,
  scoreParts: string[],
) {
  if (typeof filters.maxSalary === 'number') {
    values.push(filters.maxSalary);
    scoreParts.push(
      `CASE WHEN candidate.salary_expectation IS NOT NULL AND candidate.salary_expectation <= $${values.length} THEN 1 ELSE 0 END`,
    );
  }
}

function applyAvailabilityScoring(
  filters: CandidateFilters,
  values: Array<string | number>,
  scoreParts: string[],
) {
  if (!filters.availabilityBefore) return;
  values.push(filters.availabilityBefore);
  scoreParts.push(
    `CASE WHEN candidate.availability_date IS NULL OR candidate.availability_date <= $${values.length} THEN 1 ELSE 0 END`,
  );
}
