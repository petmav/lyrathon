import { NextResponse } from "next/server";
import { getRecruiterConversations } from "@/lib/recruiter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recruiterId = searchParams.get("recruiter_id");

  if (!recruiterId) {
    return NextResponse.json({ error: "Missing recruiter_id" }, { status: 400 });
  }

  try {
    const conversations = await getRecruiterConversations(recruiterId);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching recruiter conversations:", error);
    return NextResponse.json({ error: "Failed to fetch recruiter conversations" }, { status: 500 });
  }
}