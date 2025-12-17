/**
 * @jest-environment node
 */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createShortlist } from '@/lib/shortlist';
import type { CandidateResult } from '@/lib/candidate-search';
import OpenAI from 'openai';

describe('createShortlist fallback', () => {
  it('returns direct candidate info when no LLM client is available', async () => {
    const candidates: CandidateResult[] = [
      {
        candidate_id: 'candidate-1',
        name: 'Test Candidate',
        age: 30,
        email: 'test@example.com',
        current_position: 'Frontend Engineer',
        location: 'Toronto',
        visa_status: 'TN eligible',
        experience_years: 6,
        salary_expectation: 150000,
        availability_date: null,
        skills_text: 'React, GraphQL',
        projects_text: 'Built internal dashboards',
        profile_updated_at: new Date().toISOString(),
      },
    ];

    const result = await createShortlist(
      'Need a React engineer',
      candidates,
      { searchTerm: 'react' },
      null,
    );

    expect(result.shortlist).toHaveLength(1);
    expect(result.shortlist[0]).toMatchObject({
      candidate_id: 'candidate-1',
      email: 'test@example.com',
      location: 'Toronto',
    });
    expect(result.overall_summary).toContain('LLM unavailable');
  });
});

describe('createShortlist with OpenAI client', () => {
  let mockClient: OpenAI;
  let mockResponsesCreate: jest.Mock;

  beforeEach(() => {
    mockResponsesCreate = jest.fn().mockResolvedValue({
      output: [
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: JSON.stringify({
                shortlist: [
                  {
                    candidate_id: 'candidate-1',
                    name: 'Test Candidate',
                    age: 30,
                    email: 'test@example.com',
                    location: 'Toronto',
                    visa_status: 'TN',
                    experience_years: 6,
                    salary_expectation: 150000,
                    match_summary: 'Strong React experience.',
                    recommended_action: 'Schedule interview',
                    confidence: 0.9,
                  },
                ],
                overall_summary: 'Good fit for the role.',
              }),
            },
          ],
        },
      ],
    });

    mockClient = {
      responses: {
        create: mockResponsesCreate,
      },
    } as unknown as OpenAI;
  });

  it('returns LLM shortlist when OpenAI client is provided', async () => {
    const candidates: CandidateResult[] = [
      {
        candidate_id: 'candidate-1',
        name: 'Test Candidate',
        age: 30,
        email: 'test@example.com',
        current_position: 'Frontend Engineer',
        location: 'Toronto',
        visa_status: 'TN eligible',
        experience_years: 6,
        salary_expectation: 150000,
        availability_date: null,
        skills_text: 'React, GraphQL',
        projects_text: 'Built internal dashboards',
        profile_updated_at: new Date().toISOString(),
      },
    ];

    const result = await createShortlist(
      'Need a React engineer',
      candidates,
      { searchTerm: 'react' },
      mockClient,
    );

    expect(result.shortlist).toHaveLength(1);
    expect(result.shortlist[0].recommended_action).toBe('Schedule interview');
    expect(mockResponsesCreate).toHaveBeenCalled();
  });

  it('returns graceful failure when no output text returned', async () => {
    mockResponsesCreate.mockResolvedValueOnce({
      output: [],
    });
    const candidates: CandidateResult[] = [
      {
        candidate_id: 'candidate-1',
        name: 'Empty Result',
        age: null,
        email: 'empty@example.com',
        current_position: null,
        location: null,
        visa_status: null,
        experience_years: null,
        salary_expectation: null,
        availability_date: null,
        skills_text: null,
        projects_text: null,
        profile_updated_at: new Date().toISOString(),
      },
    ];

    const result = await createShortlist(
      'Need clarity',
      candidates,
      { searchTerm: 'react' },
      mockClient,
    );

    expect(result.shortlist).toHaveLength(1);
    expect(result.shortlist[0].email).toBe('empty@example.com');
    expect(result.overall_summary).toMatch(/raw candidate matches/i);
  });
});

describe('createShortlist slicing and normalization', () => {
  it('respects filter limit and normalizes nullables in fallback path', async () => {
    const candidates: CandidateResult[] = [
      {
        candidate_id: 'candidate-1',
        name: 'One',
        age: null,
        email: 'one@example.com',
        current_position: null,
        location: null,
        visa_status: null,
        experience_years: null,
        salary_expectation: null,
        availability_date: null,
        skills_text: null,
        projects_text: 'Did something',
        profile_updated_at: new Date().toISOString(),
      },
      {
        candidate_id: 'candidate-2',
        name: 'Two',
        age: 31,
        email: 'two@example.com',
        current_position: 'Engineer',
        location: 'Vancouver',
        visa_status: 'PR',
        experience_years: 7,
        salary_expectation: 150000,
        availability_date: null,
        skills_text: 'React',
        projects_text: null,
        profile_updated_at: new Date().toISOString(),
      },
    ];

    const result = await createShortlist(
      'Need fallback limit test',
      candidates,
      { searchTerm: 'test', limit: 1 },
      null,
    );

    expect(result.shortlist).toHaveLength(1);
    expect(result.shortlist[0]).toMatchObject({
      candidate_id: 'candidate-1',
      location: null,
      visa_status: null,
    });
  });
});
