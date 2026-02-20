import { NextResponse } from "next/server";
import { processUserMessage } from "@/lib/agent/conversation";
import { startAgent, isAgentInitialized } from "@/lib/agent";

export async function POST(request: Request) {
  const body = await request.json();

  // Telnyx sends various event types; we only care about inbound messages
  const eventType = body.data?.event_type;
  if (eventType !== "message.received") {
    return NextResponse.json({ ok: true });
  }

  const payload = body.data?.payload;
  if (!payload) {
    return NextResponse.json({ ok: true });
  }

  // Only process inbound (not outbound delivery status updates)
  const direction = payload.direction;
  if (direction !== "inbound") {
    return NextResponse.json({ ok: true });
  }

  const text = payload.text;
  const from = payload.from?.phone_number;

  if (!text || !from) {
    console.warn("[Webhook] Missing text or from number in payload");
    return NextResponse.json({ ok: true });
  }

  console.log(`[Webhook] Inbound SMS from ${from}: "${text}"`);

  // Ensure agent is initialized (idempotent)
  if (!isAgentInitialized()) {
    try {
      await startAgent();
    } catch (err) {
      console.error("[Webhook] Failed to initialize agent:", err);
      return NextResponse.json({ error: "Agent not ready" }, { status: 503 });
    }
  }

  // Process fire-and-forget so we return 200 quickly (Telnyx times out after 20s)
  processUserMessage(text).catch((err) => {
    console.error("[Webhook] processUserMessage error:", err);
  });

  return NextResponse.json({ ok: true });
}
