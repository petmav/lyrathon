import pdfParse from 'pdf-parse';

const DEFAULT_MAX_BYTES = Number(process.env.VERIFICATION_MAX_DOC_BYTES ?? 2_000_000); // ~2MB
const MAX_PREVIEW_CHARS = 2400;

type FetchResult = {
  text: string;
  bytes: number;
  contentType?: string;
};

function isPdf(contentType?: string | null, url?: string) {
  if (contentType?.toLowerCase().includes('pdf')) return true;
  return Boolean(url && url.toLowerCase().endsWith('.pdf'));
}

function truncate(text: string, limit = MAX_PREVIEW_CHARS) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)} …`;
}

async function readWithLimit(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error('Document exceeds max size');
    }
    return buffer;
  }

  const chunks: Buffer[] = [];
  let total = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        throw new Error('Document exceeds max size');
      }
      chunks.push(Buffer.from(value));
    }
  }

  return Buffer.concat(chunks);
}

export async function fetchDocumentText(
  url?: string | null,
  options?: { maxBytes?: number },
): Promise<FetchResult | null> {
  if (!url) return null;

  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    const buffer = await readWithLimit(response, maxBytes);

    if (isPdf(contentType, url)) {
      const parsed = await pdfParse(buffer);
      const text = parsed?.text?.trim();
      if (!text) return null;
      return { text: truncate(text), bytes: buffer.byteLength, contentType };
    }

    const decoded = buffer.toString('utf-8').trim();
    if (!decoded) return null;
    return { text: truncate(decoded), bytes: buffer.byteLength, contentType };
  } catch (error) {
    // Caller will handle logging; return null on any failure to avoid blocking verification.
    return null;
  }
}

export function formatDocumentSummaries(
  docs: { document_id: string; type: string; file_url: string | null; text?: string | null }[],
) {
  if (!docs.length) return 'Resume/Portfolio files: none';

  const parts = docs.map((doc) => {
    const summary = doc.text ? truncate(doc.text, 320) : 'no text extracted';
    return `${doc.type}: ${doc.file_url ?? 'n/a'} — ${summary}`;
  });

  return `Resume/Portfolio files:\n${parts.join('\n')}`;
}

export const __testables = { isPdf, truncate };
