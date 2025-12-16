import { extractLinksFromText } from '@/lib/verification';

describe('verification helpers', () => {
  describe('extractLinksFromText', () => {
    it('normalizes and deduplicates links', () => {
      const links = extractLinksFromText(
        'See https://Example.com/path and also https://example.com/path#fragment plus http://other.example.com.',
      );

      expect(links).toEqual([
        'https://example.com/path',
        'http://other.example.com/',
      ]);
    });

    it('returns empty array when no links present', () => {
      expect(extractLinksFromText('no urls here')).toEqual([]);
      expect(extractLinksFromText(undefined)).toEqual([]);
    });
  });
});
