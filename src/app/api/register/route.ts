import { NextResponse } from "next/server";
import { pool } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body ?? {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // Upsert candidate row using unique email constraint
    const result = await pool.query(
      `
      INSERT INTO candidate (name, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, profile_updated_at = NOW()
      RETURNING *
    `,
      [name, email.toLowerCase(), passwordHash],
    );

    const candidate = result.rows[0];
    if (!candidate) return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });

    // Remove password_hash from response
    const { password_hash: _pw, ...publicCandidate } = candidate as any;
    return NextResponse.json(publicCandidate, { status: 201 });
  } catch (e: any) {
    console.error("register error", e);
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}



