import { NextResponse } from "next/server";
import { pool } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body ?? {};
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Find candidate by email in candidate table
    const result = await pool.query(`SELECT * FROM candidate WHERE email = $1 LIMIT 1`, [email.toLowerCase()]);
    if (!result.rowCount) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const candidate = result.rows[0] as any;
    const stored = candidate.password_hash;
    if (!stored || !verifyPassword(password, stored)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password_hash: _pw, ...publicCandidate } = candidate;
    return NextResponse.json(publicCandidate, { status: 200 });
  } catch (e: any) {
    console.error("login error", e);
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
