import { NextResponse } from 'next/server';
import {
  saveCandidate,
  refreshCandidateEmbedding,
  type CandidateInput,
} from '@/lib/candidate-ingest';
import {
  candidateInputSchema,
  candidateRegistrationResponseSchema,
} from '@/lib/schemas';
import {
  enforceResponseShape,
  isRequestValidationError,
  isResponseValidationError,
  parseRequestPayload,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const payload = parseRequestPayload(
      candidateInputSchema,
      await request.json(),
    ) as CandidateInput;

    const candidate = await saveCandidate(payload);
    let embeddingUpdated = false;

    try {
      const updateResult = await refreshCandidateEmbedding(candidate.candidate_id);
      embeddingUpdated = updateResult.updated;
    } catch (embeddingError) {
      console.error('Embedding refresh failed', embeddingError);
    }

    const { password_hash, ...safeCandidate } = candidate as typeof candidate & {
      password_hash?: string;
    };

    const normalizedCandidate = normalizeCandidateTypes(
      normalizeCandidateDates(safeCandidate),
    );

    const responseBody = enforceResponseShape(
      candidateRegistrationResponseSchema,
      {
        data: normalizedCandidate,
        embeddingUpdated,
      },
    );

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (isRequestValidationError(error)) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }

    if (isResponseValidationError(error)) {
      console.error('Candidate response validation failed', error.details);
      return NextResponse.json(
        { error: 'Failed to format candidate response' },
        { status: 500 },
      );
    }

    console.error('Candidate registration failed', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 },
    );
  }
}

type CandidateDateFields = {
  availability_date?: unknown;
  profile_created_at?: unknown;
  profile_updated_at?: unknown;
};

function normalizeCandidateDates<T extends CandidateDateFields>(candidate: T): T {
  const normalizeDateField = (value: unknown) => {
    if (!value) return value;
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    return value;
  };

  return {
    ...candidate,
    availability_date: normalizeDateField(candidate.availability_date),
    profile_created_at: normalizeDateField(candidate.profile_created_at),
    profile_updated_at: normalizeDateField(candidate.profile_updated_at),
  };
}

function normalizeCandidateTypes<T extends Record<string, unknown>>(candidate: T): T {
  const coerceNumber = (value: unknown) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return value;
      const n = Number(trimmed);
      return Number.isNaN(n) ? value : n;
    }
    return value;
  };

  return {
    ...candidate,
    age: coerceNumber(candidate['age']),
    experience_years: coerceNumber(candidate['experience_years']),
    salary_expectation: coerceNumber(candidate['salary_expectation']),
    // preference_score may not exist on registration response, but coerce if present
    preference_score: coerceNumber(candidate['preference_score']),
  } as T;
}
