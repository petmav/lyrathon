import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
import { newConversation, saveRecruiterQuery } from '@/lib/recruiter';

const conversation_title = "New Conversation";

async function getConversationId(body: any): Promise<string> {
  if (!body.conversation_id) {
    const conversation = await newConversation(body.recruiter_id, conversation_title);
    console.log(conversation);
    return conversation.conversation_id;
  }
  return body.conversation_id;
}

export async function POST(request: Request) {
  try {
    const body = parseRequestPayload(
      recruiterQueryRequestSchema,
      await request.json(),
    );
    const conversation_id = await getConversationId(body);
    console.log('Using conversation ID:', conversation_id);

    const started = Date.now();
    // store body.query in recruiter_queries table
    saveRecruiterQuery({
      conversation_id: conversation_id,
      query_text: body.query,
      is_assistant: false,
    });
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
      saveRecruiterQuery({
        conversation_id: conversation_id,
        query_text: JSON.stringify(emptyResponse),
        is_assistant: true,
      });
      return NextResponse.json({ conversation_id: conversation_id, conversation_title, responseBody: emptyResponse });
    }

    const shortlist = await createShortlist(body.query, candidates, sanitizedFilters);

    // Hydrate shortlist with verification scores
    const hydratedShortlist = await Promise.all(
      shortlist.shortlist.map(async (candidate) => {
        const verifications = await db.query(
          `SELECT run_type, confidence
           FROM verification_runs
           WHERE candidate_id = $1
           ORDER BY finished_at DESC`,
          [candidate.candidate_id],
        );

        const runs = verifications.rows;
        const getScore = (type: string) => {
          const run = runs.find((r: any) => r.run_type === type);
          return run ? Number(run.confidence) : null;
        };

        return {
          ...candidate,
          verification_scores: {
            resume: getScore('resume'),
            projects: getScore('project_links'),
            education: getScore('transcript'),
          },
        };
      }),
    );

    const responseBody = enforceResponseShape(shortlistResponseSchema, {
      filters: sanitizedFilters,
      shortlist: hydratedShortlist,
      overall_summary: shortlist.overall_summary,
    });

    await logEvent('info', 'recruiter.shortlist.success', {
      filters: sanitizedFilters,
      duration_ms: Date.now() - started,
      shortlist_size: shortlist.shortlist.length,
    });

    // store responseBody in recruiter_queries table
    // store responseBody in recruiter_queries table
    saveRecruiterQuery({
      conversation_id: conversation_id,
      query_text: JSON.stringify(responseBody),
      is_assistant: true,
    });

    // Fetch the latest title (it might have been updated by the background task)
    const conversationRes = await db.query(
      `SELECT title FROM conversation WHERE conversation_id = $1`,
      [conversation_id]
    );
    const finalTitle = conversationRes.rows[0]?.title || conversation_title;

    return NextResponse.json({ conversation_id: conversation_id, conversation_title: finalTitle, responseBody });
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
