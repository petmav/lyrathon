import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from '@/lib/db';
import {
  ensureVerificationRunsForCandidate,
  queueVerificationForCandidate,
  processQueuedVerifications,
  type VerificationRunType,
} from '@/lib/verification';

const MAX_UPLOAD_BYTES = Number(process.env.VERIFICATION_MAX_DOC_BYTES ?? 2_000_000);
const ALLOWED_TYPES = new Set(['resume', 'portfolio', 'cover_letter', 'other', 'transcript']);
const RUN_TYPE_BY_DOC: Record<string, VerificationRunType> = {
  resume: 'resume',
  portfolio: 'project_links',
  cover_letter: 'resume',
  other: 'transcript',
  transcript: 'transcript',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const candidateId = String(formData.get('candidate_id') ?? '');
    const type = String(formData.get('type') ?? 'resume');

    if (!candidateId) {
      return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', candidateId);
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName || 'upload'}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, buffer);

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const base =
      process.env.PUBLIC_UPLOAD_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const fileUrl = new URL(`/uploads/${candidateId}/${filename}`, base).toString();

    await db.query(
      `INSERT INTO candidate_documents (candidate_id, type, file_url, checksum, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [candidateId, type, fileUrl, checksum, type === 'resume'],
    );

    try {
      const runType = RUN_TYPE_BY_DOC[type] ?? 'full_profile';
      const queued = await queueVerificationForCandidate(candidateId, runType);
      if (queued) {
        setTimeout(() => {
          processQueuedVerifications().catch((err) =>
            console.error('Verification task failed after upload', err),
          );
        }, 0);
      }
    } catch (err) {
      console.error('Failed to queue verification after upload', err);
    }

    ensureVerificationRunsForCandidate(candidateId).catch((err) =>
      console.error('Failed to ensure verification runs after upload', err),
    );

    return NextResponse.json({ file_url: fileUrl, checksum });
  } catch (error) {
    console.error('Document upload failed', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
