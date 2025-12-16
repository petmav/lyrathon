import { NextResponse } from "next/server";
import { getRecruiterQueries } from "@/lib/recruiter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recruiterId = searchParams.get("recruiter_id");

  if (!recruiterId) {
    return NextResponse.json({ error: "Missing recruiter_id" }, { status: 400 });
  }

  try {
    const queries = await getRecruiterQueries(recruiterId);
    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching recruiter queries:", error);
    return NextResponse.json({ error: "Failed to fetch recruiter queries" }, { status: 500 });
  }
}