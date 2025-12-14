import { NextResponse, NextRequest} from 'next/server';
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
import { db } from '@/lib/db'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidate_id = searchParams.get('candidate_id');

    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 });
    }

    const result = await db.query(
      `
      SELECT
        name,
        email,
        age,
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
      FROM candidate
      WHERE candidate_id = $1
      `,
      [candidate_id],
    );

    const row = (result as any).rows?.[0] ?? null;
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('Failed to retrieve candidate', error);
    return NextResponse.json({ error: 'Failed to retrieve candidate' }, { status: 500 });
  }
}