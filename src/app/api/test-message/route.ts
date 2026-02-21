import { NextResponse } from "next/server";
import { processUserMessage, resetConversation } from "@/lib/agent/conversation";
import { startAgent, isAgentInitialized } from "@/lib/agent";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.TEST_API_KEY;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text) {
    return NextResponse.json({ error: "Missing 'text' field" }, { status: 400 });
  }

  if (!isAgentInitialized()) {
    try {
      await startAgent();
    } catch (err) {
      console.error("[Test] Failed to initialize agent:", err);
      return NextResponse.json({ error: "Agent not ready" }, { status: 503 });
    }
  }

  processUserMessage(text).catch((err) => {
    console.error("[Test] processUserMessage error:", err);
  });

  return NextResponse.json({ ok: true, message: "Processing, check email shortly" });
}

export async function DELETE() {
  resetConversation();
  return NextResponse.json({ ok: true, message: "Conversation state reset" });
}
