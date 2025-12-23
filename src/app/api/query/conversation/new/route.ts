import { NextResponse } from "next/server";
import { newConversation } from "@/lib/recruiter";
import z from "zod";
import { parseRequestPayload } from "@/lib/validation";

export async function POST(request: Request) {
  const body = parseRequestPayload(
    z.object({
      recruiter_id: z.string().uuid(),
    }),
    await request.json()
  );

  if (!body.recruiter_id) {
    return NextResponse.json(
      { error: "Missing recruiter_id" },
      { status: 400 }
    );
  }

  try {
    const conversation = await newConversation(
      body.recruiter_id,
      "New Conversation"
    );
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation queries:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation queries" },
      { status: 500 }
    );
  }
}
