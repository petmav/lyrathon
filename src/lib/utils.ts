/**
 * Utility functions for the Lyrathon application
 * This file demonstrates where to place helper functions and utilities
 */

/**
 * Format a date to a readable string
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Truncate text to a specified length
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Example function for future RAG pipeline utilities
 * This is a placeholder for RAG-related helper functions
 */
export const ragUtils = {
  // Placeholder for embedding generation
  generateEmbedding: async (text: string): Promise<number[]> => {
    // Implementation will be added when RAG pipeline is integrated
    throw new Error('RAG pipeline not yet implemented');
  },
  
  // Placeholder for semantic search
  semanticSearch: async (query: string, topK: number = 5): Promise<any[]> => {
    // Implementation will be added when RAG pipeline is integrated
    throw new Error('RAG pipeline not yet implemented');
  },
};
