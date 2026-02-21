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

// Fetch the full email content from Resend API
async function fetchEmailContent(emailId: string): Promise<{ from: string; text: string; subject: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    console.error(`[Webhook] Failed to fetch email ${emailId}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return {
    from: data.from || "",
    text: data.text || data.html?.replace(/<[^>]*>/g, "") || "",
    subject: data.subject || "",
  };
}

export async function POST(request: Request) {
  const body = await request.json();

  // Resend inbound webhook sends { type: "email.received", data: { email_id, from, to, subject, ... } }
  // The body does NOT include the email text, so we fetch it via API
  const eventType = body.type;
  if (eventType !== "email.received") {
    return NextResponse.json({ ok: true });
  }

  const emailId = body.data?.email_id;
  const webhookFrom = body.data?.from || "";
  const webhookSubject = body.data?.subject || "";

  if (!emailId) {
    console.warn("[Webhook] No email_id in Resend inbound payload");
    return NextResponse.json({ ok: true });
  }

  console.log(`[Webhook] Received email.received event, email_id=${emailId} from=${webhookFrom}`);

  // Fetch full email content
  const email = await fetchEmailContent(emailId);
  if (!email || !email.text) {
    console.warn(`[Webhook] Could not fetch email content for ${emailId}`);
    return NextResponse.json({ ok: true });
  }

  const cleanedText = stripEmailQuotes(email.text);
  if (!cleanedText) {
    console.warn("[Webhook] Email reply was empty after stripping quotes");
    return NextResponse.json({ ok: true });
  }

  console.log(`[Webhook] Inbound email from ${email.from} (subject: "${email.subject}"): "${cleanedText.substring(0, 100)}"`);

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
