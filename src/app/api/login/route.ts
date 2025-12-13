import { NextResponse } from "next/server";
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body ?? {};
    if (!email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Find candidate by email in candidate table
    const result = await pool.query(`SELECT * FROM candidate WHERE email = $1 LIMIT 1`, [email.toLowerCase()]);
    if (!result.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const candidate = result.rows[0];
    return NextResponse.json(candidate, { status: 200 });
  } catch (e: any) {
    console.error("login error", e);
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
