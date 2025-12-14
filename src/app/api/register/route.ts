import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { saveCandidate } from '@/lib/candidate-ingest';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, age, password, ...rest } = body ?? {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, age, and password_hash are required.' },
        { status: 400 },
      );
    }

    const password_hash = hashPassword(password);

    // Upsert candidate row using unique email constraint
    const candidate = await saveCandidate({
      name,
      email,
      age,
      password_hash,
      ...rest,
    });

    // Remove password_hash from response
    const { password_hash: _pw, ...publicCandidate } = candidate as any;
    return NextResponse.json(publicCandidate, { status: 201 });
  } catch (e: any) {
    console.error('register error', e);
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 });
  }
}


