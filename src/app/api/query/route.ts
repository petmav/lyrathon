import { NextResponse } from 'next/server';
import { extractFiltersFromQuery } from '@/lib/query-parser';
import { searchCandidates } from '@/lib/candidate-search';
import { generateEmbedding } from '@/lib/embeddings';

type QueryPayload = {
  query: string;
  limit?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueryPayload;
    if (!body?.query) {
      return NextResponse.json({ error: 'Query text is required.' }, { status: 400 });
    }

    const filters = await extractFiltersFromQuery(body.query);
    if (body.limit) {
      filters.limit = body.limit;
    }

    const queryEmbedding = await generateEmbedding(body.query);
    const candidates = await searchCandidates(filters, queryEmbedding);
    return NextResponse.json({
      filters,
      data: candidates,
    });
  } catch (error) {
    console.error('Query orchestration failed', error);
    return NextResponse.json(
      { error: 'Failed to process recruiter query' },
      { status: 500 },
    );
  }
}
