import { NextResponse } from "next/server";
import { saveCandidate } from '@/lib/candidate-ingest';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, age, password_hash, ...rest } = body ?? {};

    if (!name || !email || typeof age !== 'number' || !password_hash) {
      return NextResponse.json(
        { error: 'Name, email, age, and password_hash are required.' },
        { status: 400 },
      );
    }

    const candidate = await saveCandidate({
      name,
      email,
      age,
      password_hash,
      ...rest,
    });
    return NextResponse.json(candidate, { status: 201 });
  } catch (e: any) {
    console.error('register error', e);
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 });
  }
}


