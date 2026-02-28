const TELEGRAM_API = "https://api.telegram.org";

export async function sendMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN in env");

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Telegram] Send failed (${res.status}):`, body);
    throw new Error(`Telegram send failed: ${res.status}`);
  }

  const data = await res.json();
  console.log(`[Telegram] sent to=${chatId} message_id=${data.result?.message_id}`);
}
