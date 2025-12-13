import OpenAI from 'openai';

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!client) {
    console.warn('OPENAI_API_KEY not configured, skipping embedding generation.');
    return null;
  }

  if (!text.trim()) {
    return null;
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data?.[0]?.embedding ?? null;
}

export function getEmbeddingModel() {
  return EMBEDDING_MODEL;
}
