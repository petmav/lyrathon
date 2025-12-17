import { NextResponse } from 'next/server';
import { processNextVerificationRun } from '@/lib/verification';
import { logEvent } from '@/lib/logger';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as { limit?: number }));
  const limit = Math.max(1, Math.min(Number(body?.limit) || 1, 10));
  const processed: unknown[] = [];

  try {
    for (let i = 0; i < limit; i += 1) {
      const result = await processNextVerificationRun();
      if (!result.processed) break;
      processed.push(result.run);
    }

    await logEvent('info', 'verification.process.success', {
      processed: processed.length,
    });

    return NextResponse.json({ processed: processed.length, runs: processed });
  } catch (error) {
    await logEvent('error', 'verification.process.error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to process verification queue' },
      { status: 500 },
    );
  }
}
