import { describe, expect, it } from '@jest/globals';
import {
  tokenizeSearchTerm,
  type CandidateFilters,
} from '@/lib/candidate-search';
import * as candidateSearch from '@/lib/candidate-search';
import { db } from '@/lib/db';

describe('tokenizeSearchTerm', () => {
  it('splits on whitespace and removes empty tokens', () => {
    expect(tokenizeSearchTerm(' senior   react engineer ')).toEqual([
      'senior',
      'react',
      'engineer',
    ]);
  });

  it('returns empty array for blank strings', () => {
    expect(tokenizeSearchTerm('     ')).toEqual([]);
  });
});

describe('searchCandidates', () => {
  it('returns empty array when no candidates match', async () => {
    const spy = jest.spyOn(db, 'query').mockResolvedValue({
      rows: [],
    } as any);

    const result = await candidateSearch.searchCandidates({ searchTerm: 'unknown' });
    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('orders by preference score when semantic embedding absent', async () => {
    const mockRows = [
      { candidate_id: '1', candidate: 'Alice', preference_score: 2 },
      { candidate_id: '2', candidate: 'Bob', preference_score: 1 },
    ];
    const spy = jest.spyOn(db, 'query').mockResolvedValue({
      rows: mockRows,
    } as any);

    const filters: CandidateFilters = { searchTerm: 'react', location: 'Canada' };
    const result = await candidateSearch.searchCandidates(filters);
    expect(result).toEqual(mockRows);
    spy.mockRestore();
  });

  it('clamps limit to 100 and applies location scoring aliases', async () => {
    const spy = jest.spyOn(db, 'query').mockResolvedValue({
      rows: [],
    } as any);

    await candidateSearch.searchCandidates({
      searchTerm: 'react',
      location: 'CA',
      limit: 500,
    });

    expect(spy).toHaveBeenCalled();
    const [, values] = spy.mock.calls[0];
    expect(values.at(-1)).toBe(100);
    expect(values).toEqual(expect.arrayContaining(['%canada%']));
    spy.mockRestore();
  });

  it('appends semantic embedding vector parameter before the limit', async () => {
    const spy = jest.spyOn(db, 'query').mockResolvedValue({
      rows: [],
    } as any);

    await candidateSearch.searchCandidates(
      { searchTerm: 'design systems', limit: 10 },
      [0.1, 0.2, 0.3],
    );

    const [, values] = spy.mock.calls[0];
    expect(values.at(-2)).toBe('[0.1,0.2,0.3]');
    expect(values.at(-1)).toBe(10);
    const queryText = spy.mock.calls[0][0] as string;
    expect(queryText).toContain('candidate_embeddings ce');
    expect(queryText).toContain('ce.embedding <->');
    spy.mockRestore();
  });
});
