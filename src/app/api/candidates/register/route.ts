import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  saveCandidate,
  refreshCandidateEmbedding,
  type CandidateInput,
} from '@/lib/candidate-ingest';
import {
  candidateProfileSchema,
  candidateRegistrationResponseSchema,
  type CandidateProfilePayload,
} from '@/lib/schemas';
import {
  enforceResponseShape,
  isRequestValidationError,
  isResponseValidationError,
  parseRequestPayload,
} from '@/lib/validation';
import { logEvent } from '@/lib/logger';
import {
  ensureVerificationRunsForCandidate,
} from '@/lib/verification';

export async function POST(request: Request) {
  try {
    const payload = parseRequestPayload<CandidateProfilePayload>(
      candidateProfileSchema,
      await request.json(),
    );

    let password_hash = payload.password_hash;
    if (!password_hash) {
      const existingCandidate = await db.query<{ password_hash: string }>(
        `SELECT password_hash FROM candidate WHERE email = $1`,
        [payload.email],
      );

      if (!existingCandidate.rowCount) {
        return NextResponse.json(
          { error: 'Candidate not found. Please register before updating.' },
          { status: 404 },
        );
      }

      password_hash = existingCandidate.rows[0].password_hash;
    }

    const candidateInput: CandidateInput = {
      ...payload,
      password_hash,
    };

    const candidate = await saveCandidate(candidateInput);
    let embeddingUpdated = false;

    await logEvent('info', 'candidate.register.received', {
      candidateId: candidate.candidate_id,
      email: candidate.email,
    });

    try {
      const updateResult = await refreshCandidateEmbedding(candidate.candidate_id);
      embeddingUpdated = updateResult.updated;
    } catch (embeddingError) {
      console.error('Embedding refresh failed', embeddingError);
    }

    // Queue verification runs for available evidence; final aggregate waits until all aspects present
    ensureVerificationRunsForCandidate(candidate.candidate_id).catch((err) =>
      console.error('Failed to queue verification', err),
    );

    const { password_hash: _pw, ...safeCandidate } = candidate as typeof candidate & {
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

    await logEvent('info', 'candidate.register.success', {
      candidateId: candidate.candidate_id,
      embeddingUpdated,
    });

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
    await logEvent('error', 'candidate.register.error', {
      error: error instanceof Error ? error.message : String(error),
    });
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
