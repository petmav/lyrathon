import { NextResponse } from "next/server";
import { saveCandidate } from '@/lib/candidate-ingest';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body ?? {};

    if (!name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Use candidate table to create or update a candidate profile. Password is ignored.
    const candidate = await saveCandidate({ name, email });
    return NextResponse.json(candidate, { status: 201 });
  } catch (e: any) {
    console.error("register error", e);
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}



