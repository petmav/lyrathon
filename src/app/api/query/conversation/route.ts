import { NextResponse } from "next/server";
import { getConversationQueries } from "@/lib/recruiter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversation_id" }, { status: 400 });
  }

  try {
    const queries = await getConversationQueries(conversationId);
    return NextResponse.json(queries);
  } catch (error) {
    console.error("Error fetching conversation queries:", error);
    return NextResponse.json({ error: "Failed to fetch conversation queries" }, { status: 500 });
  }
}