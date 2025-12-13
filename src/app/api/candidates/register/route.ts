import { NextResponse } from 'next/server';
import {
  saveCandidate,
  refreshCandidateEmbedding,
  type CandidateInput,
} from '@/lib/candidate-ingest';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CandidateInput;

    if (!payload?.name || !payload?.email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 },
      );
    }

    const candidate = await saveCandidate(payload);
    let embeddingUpdated = false;

    try {
      const updateResult = await refreshCandidateEmbedding(candidate.candidate_id);
      embeddingUpdated = updateResult.updated;
    } catch (embeddingError) {
      console.error('Embedding refresh failed', embeddingError);
    }

    return NextResponse.json(
      {
        data: candidate,
        embeddingUpdated,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Candidate registration failed', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 },
    );
  }
}
