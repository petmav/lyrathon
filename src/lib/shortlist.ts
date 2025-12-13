import OpenAI from 'openai';
import type {
  CandidateFilters,
  CandidateResult,
} from '@/lib/candidate-search';

const SHORTLIST_MODEL =
  process.env.OPENAI_SHORTLIST_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

const shortlistClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type ShortlistEntry = {
  candidate_id: string;
  name: string;
  age: number | null;
  email: string;
  location: string | null;
  visa_status: string | null;
  experience_years: number | null;
  salary_expectation: number | null;
  match_summary: string;
  recommended_action: string;
  confidence: number;
};

export type ShortlistPayload = {
  shortlist: ShortlistEntry[];
  overall_summary: string;
  filters: CandidateFilters;
};

const shortlistSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    shortlist: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
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
): Promise<Omit<ShortlistPayload, 'filters'>> {
  const limitedCandidates = candidates.slice(0, filters.limit ?? 5);

  if (!shortlistClient || !limitedCandidates.length) {
    return {
      shortlist: limitedCandidates.map((candidate) => ({
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
      })),
      overall_summary: 'LLM unavailable; returning raw candidate matches.',
    };
  }

  const response = await shortlistClient.responses.create({
    model: SHORTLIST_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'You are a recruiting assistant. Select and justify the best candidates based on the recruiter query and provided candidate data. Please also provide their information in the shortlist so that the recruiter can contact them.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildPrompt(recruiterQuery, limitedCandidates),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'ShortlistResult',
        schema: shortlistSchema,
      },
    },
    temperature: 0.2,
  });

  const outputText = extractOutput(response);
  if (!outputText) {
    return {
      shortlist: [],
      overall_summary: 'Unable to generate shortlist.',
    };
  }

  const parsed = JSON.parse(outputText) as Omit<ShortlistPayload, 'filters'>;
  return parsed;
}

function buildPrompt(query: string, candidates: CandidateResult[]) {
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
    'Return up to five candidates with confidence scores, action items, and an overall summary. Each shortlist entry must include candidate_id, name, age, email, location, visa_status, experience_years, salary_expectation, match_summary, recommended_action, and confidence.',
  );
  return lines.filter(Boolean).join('\n');
}

function extractOutput(response: OpenAI.Beta.Responses.Response) {
  for (const item of response.output ?? []) {
    if (item.type === 'message') {
      for (const content of item.content) {
        if (content.type === 'output_text' && content.text) {
          return content.text;
        }
      }
    } else if (item.type === 'output_text' && item.text) {
      return item.text;
    }
  }
  return null;
}
