/**
 * @jest-environment node
 */
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

function mockOpenAIResponse(outputText: string | null, reject = false) {
  const mockResponses = {
    create: reject
      ? jest.fn().mockRejectedValue(new Error('LLM failure'))
      : jest.fn().mockResolvedValue({
        output: outputText === null ? [] : [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: outputText,
              },
            ],
          },
        ],
      }),
  };

  const mockClient = {
    responses: mockResponses,
  };

  jest.doMock('openai', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockClient),
  }));

  return mockResponses;
}

describe('extractFiltersFromQuery', () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    jest.restoreAllMocks();
  });

  it('falls back to keyword-only filters when OPENAI_API_KEY is missing', async () => {
    const { extractFiltersFromQuery } = await import('@/lib/query-parser');
    const query = 'Need a React engineer in Canada';
    const filters = await extractFiltersFromQuery(query);
    expect(filters.searchTerm).toBe(query);
  });

  it('passes through inferred filters when LLM returns JSON', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    jest.resetModules();
    mockOpenAIResponse(
      JSON.stringify({
        searchTerm: 'react engineer',
        location: 'Canada',
        visaRequired: true,
      }),
    );

    const { extractFiltersFromQuery } = await import('@/lib/query-parser');
    const filters = await extractFiltersFromQuery('Need a React engineer in Canada');
    expect(filters.location).toBe('Canada');
    expect(filters.visaRequired).toBe(true);
  });

  it('falls back to raw query when LLM output is invalid JSON', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    jest.resetModules();
    mockOpenAIResponse('not valid json');

    const { extractFiltersFromQuery } = await import('@/lib/query-parser');
    const query = 'Need a platform engineer';
    const filters = await extractFiltersFromQuery(query);
    expect(filters.searchTerm).toBe(query);
    expect(filters.location).toBeUndefined();
  });

  it('handles OpenAI API failures gracefully', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    jest.resetModules();
    mockOpenAIResponse('', true);

    const { extractFiltersFromQuery } = await import('@/lib/query-parser');
    const filters = await extractFiltersFromQuery('Need a product designer');
    expect(filters.searchTerm).toBe('Need a product designer');
  });
});
