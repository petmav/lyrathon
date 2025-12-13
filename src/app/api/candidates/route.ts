import { NextResponse } from 'next/server';
import { searchCandidates, type CandidateFilters } from '@/lib/candidate-search';
import { logEvent } from '@/lib/logger';
import {
  candidateFiltersSchema,
  candidateSearchResponseSchema,
} from '@/lib/schemas';
import {
  enforceResponseShape,
  isRequestValidationError,
  isResponseValidationError,
  parseRequestPayload,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const filters = parseRequestPayload(
      candidateFiltersSchema,
      await request.json(),
    ) as CandidateFilters;

    const started = Date.now();
    const rows = await searchCandidates(filters);
    await logEvent('info', 'candidate.search.success', {
      filters,
      duration_ms: Date.now() - started,
      results: rows.length,
    });
    const responseBody = enforceResponseShape(candidateSearchResponseSchema, {
      data: rows,
    });
    return NextResponse.json(responseBody);
  } catch (error) {
    if (isRequestValidationError(error)) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    if (isResponseValidationError(error)) {
      console.error('Candidate search response invalid', error.details);
      return NextResponse.json(
        { error: 'Failed to format candidate search results' },
        { status: 500 },
      );
    }

    console.error('Candidate search failed', error);
    await logEvent('error', 'candidate.search.error', {
      message: (error as Error).message,
    });
    return NextResponse.json(
      { error: 'Failed to retrieve candidates' },
      { status: 500 },
    );
  }
}
