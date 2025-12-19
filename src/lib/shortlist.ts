import OpenAI from 'openai';
import type { Response } from 'openai/resources/responses/responses';
import type {
  CandidateFilters,
  CandidateResult,
} from '@/lib/candidate-search';
import {
  shortlistResultSchema,
  SHORTLIST_MAX_RESULTS,
  type ShortlistCorePayload,
} from '@/lib/schemas';

const SHORTLIST_MODEL =
  process.env.OPENAI_SHORTLIST_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-5-mini';

const DEFAULT_SHORTLIST_LIMIT = 5;

const shortlistClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type ShortlistEntry = ShortlistCorePayload['shortlist'][number];

export type ShortlistPayload = ShortlistCorePayload & {
  filters: CandidateFilters;
};

const shortlistJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    shortlist: {
      type: 'array',
      minItems: 0,
      maxItems: SHORTLIST_MAX_RESULTS,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          candidate_id: { type: 'string' },
          name: { type: 'string' },
          age: { type: ['number', 'null'] },
          email: { type: 'string' },
          location: { type: ['string', 'null'] },
          visa_status: { type: ['string', 'null'] },
          experience_years: { type: ['number', 'null'] },
          salary_expectation: { type: ['number', 'null'] },
          match_summary: { type: 'string' },
          recommended_action: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: [
          'candidate_id',
          'name',
          'age',
          'email',
          'location',
          'visa_status',
          'experience_years',
          'salary_expectation',
          'match_summary',
          'recommended_action',
          'confidence',
        ],
      },
    },
    overall_summary: { type: 'string' },
  },
  required: ['shortlist', 'overall_summary'],
} as const;

export async function createShortlist(
  recruiterQuery: string,
  candidates: CandidateResult[],
  filters: CandidateFilters,
  client: OpenAI | null = shortlistClient,
): Promise<Omit<ShortlistPayload, 'filters'>> {
  const shortlistLimit = Math.min(
    Math.max(filters.limit ?? DEFAULT_SHORTLIST_LIMIT, 1),
    SHORTLIST_MAX_RESULTS,
  );
  const limitedCandidates = candidates.slice(0, shortlistLimit);

  if (!client || !limitedCandidates.length) {
    return {
      shortlist: buildFallbackShortlist(limitedCandidates),
      overall_summary: 'LLM unavailable; returning raw candidate matches.',
    };
  }

  const response = await client.responses.create({
    model: SHORTLIST_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'You are a recruiting assistant. Select and justify the best candidates based on the recruiter query and provided candidate data. For each recommendation, explicitly describe the reasoning that led you to that decision (recent experience, skills, location, visa, availability, cultural fit, etc.) so the recruiter can understand the thought process. Always surface the candidate contact information in the shortlist response.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildPrompt(recruiterQuery, limitedCandidates, shortlistLimit),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'ShortlistResult',
        schema: shortlistJsonSchema,
      },
    },
  });

  const outputText = extractOutput(response);
  if (!outputText) {
    return {
      shortlist: buildFallbackShortlist(limitedCandidates),
      overall_summary: 'LLM output missing; returning raw candidate matches.',
    };
  }

  try {
    const parsed = shortlistResultSchema.parse(JSON.parse(outputText));

    // Post-process: Repair valid UUIDs if LLM returned mismatched IDs (e.g. emails)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    parsed.shortlist = parsed.shortlist.map(entry => {
      // If ID is valid, keep it
      if (uuidRegex.test(entry.candidate_id)) return entry;

      // If invalid, try to find the candidate by email or name in our source list
      const match = limitedCandidates.find(
        c => c.email === entry.candidate_id || c.email === entry.email || c.name === entry.name
      );

      if (match) {
        console.log(`Repaired candidate ID for ${entry.name}: ${entry.candidate_id} -> ${match.candidate_id}`);
        return { ...entry, candidate_id: match.candidate_id };
      }

      return entry;
    });

    return parsed;
  } catch (error) {
    console.error('Shortlist parsing failed, falling back to raw matches', error);
    return {
      shortlist: buildFallbackShortlist(limitedCandidates),
      overall_summary: 'LLM returned invalid data; falling back to raw candidate matches.',
    };
  }
}

function buildFallbackShortlist(candidates: CandidateResult[]): ShortlistEntry[] {
  return candidates.map((candidate) => ({
    candidate_id: candidate.candidate_id,
    name: candidate.name,
    age: candidate.age ?? null,
    email: candidate.email,
    location: candidate.location ?? null,
    visa_status: candidate.visa_status ?? null,
    experience_years: candidate.experience_years ?? null,
    salary_expectation: candidate.salary_expectation ?? null,
    match_summary:
      candidate.skills_text ?? candidate.projects_text ?? 'Candidate match summary unavailable.',
    recommended_action: 'Review manually',
    confidence: 0.5,
  }));
}

function buildPrompt(query: string, candidates: CandidateResult[], limit: number) {
  const lines = [
    `Recruiter query: ${query}`,
    '',
    'Candidates:',
  ];

  for (const candidate of candidates) {
    lines.push(
      `- ${candidate.name} (${candidate.candidate_id})`,
      `  Age: ${candidate.age ?? 'Unknown'} | Email: ${candidate.email}`,
      `  Role: ${candidate.current_position ?? 'Unknown'} | Location: ${candidate.location ?? 'Unknown'}`,
      `  Visa: ${candidate.visa_status ?? 'Not provided'} | Experience: ${candidate.experience_years ?? 'N/A'} years | Salary expectation: ${candidate.salary_expectation ?? 'N/A'}`,
      candidate.skills_text ? `  Skills: ${candidate.skills_text}` : '',
      candidate.projects_text ? `  Projects: ${candidate.projects_text}` : '',
      '',
    );
  }

  lines.push(
    `Return up to ${limit} candidates with confidence scores (as a float between 0.0 and 1.0), detailed reasoning, action items, and an overall summary. Each shortlist entry must include the EXACT candidate_id (UUID) provided in parentheses, name, age, email, location, visa_status, experience_years, salary_expectation, match_summary, recommended_action, and confidence.`,
  );
  return lines.filter(Boolean).join('\n');
}

function extractOutput(response: Response) {
  for (const item of response.output ?? []) {
    if (item.type === 'message') {
      for (const content of item.content) {
        if (content.type === 'output_text' && content.text) {
          return content.text;
        }
      }
    }
  }
  return null;
}
