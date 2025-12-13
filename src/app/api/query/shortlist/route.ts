import { NextResponse } from 'next/server';
import { extractFiltersFromQuery } from '@/lib/query-parser';
import { searchCandidates } from '@/lib/candidate-search';
import { generateEmbedding } from '@/lib/embeddings';
import { createShortlist } from '@/lib/shortlist';

type RequestPayload = {
  query: string;
  limit?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPayload;
    if (!body?.query) {
      return NextResponse.json({ error: 'Query text is required.' }, { status: 400 });
    }

    const filters = await extractFiltersFromQuery(body.query);
    if (body.limit) {
      filters.limit = body.limit;
    }

    const queryEmbedding = await generateEmbedding(body.query);
    const candidates = await searchCandidates(filters, queryEmbedding);

    if (!candidates.length) {
      return NextResponse.json({
        filters,
        shortlist: [],
        overall_summary: 'No candidates matched the recruiter query.',
      });
    }

    const shortlist = await createShortlist(body.query, candidates, filters);

    return NextResponse.json({
      filters,
      ...shortlist,
    });
  } catch (error) {
    console.error('Final shortlist generation failed', error);
    return NextResponse.json(
      { error: 'Failed to generate shortlist' },
      { status: 500 },
    );
  }
}
