import { NextResponse } from "next/server";
import { processUserMessage } from "@/lib/agent/conversation";
import { startAgent, isAgentInitialized } from "@/lib/agent";

// Strip email reply quotes to get just the user's new reply text
function stripEmailQuotes(text: string): string {
  const lines = text.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    // Stop at "On ... wrote:" reply headers
    if (/^On .+ wrote:$/.test(line.trim())) break;
    // Skip quoted lines
    if (line.trimStart().startsWith(">")) continue;
    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

export async function POST(request: Request) {
  const body = await request.json();

  const from = body.from;
  const text = body.text || body.plain_text || "";
  const subject = body.subject || "";

  if (!text || !from) {
    console.warn("[Webhook] Missing text or from in Resend inbound payload");
    return NextResponse.json({ ok: true });
  }

  const cleanedText = stripEmailQuotes(text);
  if (!cleanedText) {
    console.warn("[Webhook] Email reply was empty after stripping quotes");
    return NextResponse.json({ ok: true });
  }

  console.log(`[Webhook] Inbound email from ${from} (subject: "${subject}"): "${cleanedText.substring(0, 100)}"`);

  // Ensure agent is initialized (idempotent)
  if (!isAgentInitialized()) {
    try {
      await startAgent();
    } catch (err) {
      console.error("[Webhook] Failed to initialize agent:", err);
      return NextResponse.json({ error: "Agent not ready" }, { status: 503 });
    }
  }

  // Process fire-and-forget so we return 200 quickly
  processUserMessage(cleanedText).catch((err) => {
    console.error("[Webhook] processUserMessage error:", err);
  });

  return NextResponse.json({ ok: true });
}
