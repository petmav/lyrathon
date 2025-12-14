import { NextResponse } from 'next/server';
import { extractFiltersFromQuery } from '@/lib/query-parser';
import { searchCandidates } from '@/lib/candidate-search';
import { generateEmbedding } from '@/lib/embeddings';
import { createShortlist } from '@/lib/shortlist';
import { logEvent } from '@/lib/logger';
import {
  candidateFiltersSchema,
  recruiterQueryRequestSchema,
  shortlistResponseSchema,
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

    if (!candidates.length) {
      const emptyResponse = enforceResponseShape(shortlistResponseSchema, {
        filters: sanitizedFilters,
        shortlist: [],
        overall_summary: 'No candidates matched the recruiter query.',
      });
      return NextResponse.json(emptyResponse);
    }

    const shortlist = await createShortlist(body.query, candidates, sanitizedFilters);

    const responseBody = enforceResponseShape(shortlistResponseSchema, {
      filters: sanitizedFilters,
      ...shortlist,
    });

    await logEvent('info', 'recruiter.shortlist.success', {
      filters: sanitizedFilters,
      duration_ms: Date.now() - started,
      shortlist_size: shortlist.shortlist.length,
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
      console.error('Shortlist response invalid', error.details);
      return NextResponse.json(
        { error: 'Failed to format shortlist response' },
        { status: 500 },
      );
    }

    console.error('Final shortlist generation failed', error);
    await logEvent('error', 'recruiter.shortlist.error', {
      message: (error as Error).message,
    });
    return NextResponse.json(
      { error: 'Failed to generate shortlist' },
      { status: 500 },
    );
  }
}
