import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { saveRecruiter } from '@/lib/recruiter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, ...rest } = body ?? {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password_hash are required.' },
        { status: 400 },
      );
    }

    const password_hash = hashPassword(password);

    // Upsert recruiter row using unique email constraint
    const recruiter = await saveRecruiter({
      name,
      email,
      password_hash,
      ...rest,
    });

    // Remove password_hash from response
    const { password_hash: _pw, ...recruiterDetails } = recruiter as any;
    return NextResponse.json(recruiterDetails, { status: 201 });
  } catch (e: any) {
    console.error('register error', e);
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 });
  }
}


