import { NextResponse } from 'next/server';
import { searchCandidates, type CandidateFilters } from '@/lib/candidate-search';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CandidateFilters;
    const filters: CandidateFilters = body ?? {};

    if (!filters.searchTerm || !filters.searchTerm.trim()) {
      return NextResponse.json(
        { error: 'searchTerm is required for candidate search.' },
        { status: 400 },
      );
    }

    const rows = await searchCandidates(filters);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Candidate search failed', error);
    return NextResponse.json(
      { error: 'Failed to retrieve candidates' },
      { status: 500 },
    );
  }
}
