import { NextResponse } from 'next/server';
import { extractFiltersFromQuery } from '@/lib/query-parser';
import { searchCandidates } from '@/lib/candidate-search';
import { generateEmbedding } from '@/lib/embeddings';
import { logEvent } from '@/lib/logger';
import {
  candidateFiltersSchema,
  recruiterQueryRequestSchema,
  recruiterQueryResponseSchema,
} from '@/lib/schemas';
import {
  enforceResponseShape,
  isRequestValidationError,
  isResponseValidationError,
  parseRequestPayload,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = parseRequestPayload(
      recruiterQueryRequestSchema,
      await request.json(),
    );

    const started = Date.now();
    const filters = await extractFiltersFromQuery(body.query);
    const sanitizedFilters = candidateFiltersSchema.parse({
      ...filters,
      limit: body.limit ?? filters.limit,
    });

    const queryEmbedding = await generateEmbedding(body.query);
    const candidates = await searchCandidates(sanitizedFilters, queryEmbedding);
    const payload = enforceResponseShape(recruiterQueryResponseSchema, {
      filters: sanitizedFilters,
      data: candidates,
    });
    await logEvent('info', 'recruiter.query.success', {
      filters: sanitizedFilters,
      results: candidates.length,
      duration_ms: Date.now() - started,
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (isRequestValidationError(error)) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    if (isResponseValidationError(error)) {
      console.error('Recruiter query response invalid', error.details);
      return NextResponse.json(
        { error: 'Failed to format recruiter query response' },
        { status: 500 },
      );
    }

    console.error('Query orchestration failed', error);
    await logEvent('error', 'recruiter.query.error', {
      message: (error as Error).message,
    });
    return NextResponse.json(
      { error: 'Failed to process recruiter query' },
      { status: 500 },
    );
  }
}
