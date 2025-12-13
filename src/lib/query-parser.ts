import OpenAI from 'openai';
import type { Response } from 'openai/resources/responses/responses';
import type { CandidateFilters } from '@/lib/candidate-search';

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const schemaDefinition = {
  type: 'object',
  additionalProperties: false,
  properties: {
    searchTerm: { type: 'string', description: 'keywords describing skills or roles' },
    location: { type: 'string', description: 'location or region requirement' },
    visaRequired: { type: 'boolean', description: 'true if recruiter mentioned needing visa/sponsorship info' },
    visaStatus: { type: 'string', description: 'specific visa or permit required' },
    minExperience: { type: 'number', description: 'minimum years of experience' },
    maxSalary: { type: 'number', description: 'maximum salary expectation' },
    availabilityBefore: { type: 'string', description: 'ISO date by which candidate should be available' },
    limit: { type: 'number', description: 'desired number of returned candidates' }
  },
  required: [
    'searchTerm',
    'location',
    'visaRequired',
    'visaStatus',
    'minExperience',
    'maxSalary',
    'availabilityBefore',
    'limit',
  ],
} as const;

export async function extractFiltersFromQuery(
  query: string,
): Promise<CandidateFilters> {
  if (!client) {
    console.warn('OPENAI_API_KEY not set, falling back to keyword search only.');
    return { searchTerm: query };
  }

  try {
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You convert recruiter hiring prompts into JSON filters for a candidate search engine.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Recruiter query: """${query}"""\nReturn JSON.`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'CandidateFilterSchema',
          schema: schemaDefinition,
        },
      },
    });

    const jsonText = extractTextOutput(response) ?? '{}';
    const parsed = JSON.parse(jsonText) as CandidateFilters;
    return {
      ...parsed,
      searchTerm: parsed.searchTerm ?? query,
    };
  } catch (error) {
    console.error('Failed to extract filters via LLM', error);
    return { searchTerm: query };
  }
}

function extractTextOutput(response: Response) {
  const texts: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type === 'message') {
      for (const content of item.content) {
        if (content.type === 'output_text' && content.text) {
          texts.push(content.text);
        }
      }
    }
  }
  return texts.join('\n');
}
