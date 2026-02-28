import { processUserMessage } from "./conversation";
import { startAgent, isAgentInitialized } from "./index";

const POLL_INTERVAL = 3000; // 3 seconds
let polling = false;
let lastUpdateId = 0;

export function startTelegramPoller() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const expectedChatId = process.env.TELEGRAM_CHAT_ID;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN in env");

  polling = true;
  console.log("Telegram poller started (polling every 3s)");

  async function poll() {
    if (!polling) return;

    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
      const res = await fetch(url, { signal: AbortSignal.timeout(35000) });

      if (!res.ok) {
        console.error(`[Telegram] Poll failed (${res.status})`);
        setTimeout(poll, POLL_INTERVAL);
        return;
      }

      const data = await res.json();
      const updates = data.result || [];

      for (const update of updates) {
        lastUpdateId = update.update_id;

        const message = update.message;
        if (!message || !message.text) continue;

        const incomingChatId = String(message.chat.id);
        if (expectedChatId && incomingChatId !== expectedChatId) {
          console.warn(`[Telegram] Ignoring message from unknown chat ${incomingChatId}`);
          continue;
        }

        const from = message.from?.first_name || "unknown";
        console.log(`[Telegram] Inbound from ${from}: "${message.text.substring(0, 100)}"`);

        if (!isAgentInitialized()) {
          try {
            await startAgent();
          } catch (err) {
            console.error("[Telegram] Failed to initialize agent:", err);
            continue;
          }
        }

        // Fire-and-forget
        processUserMessage(message.text).catch((err) => {
          console.error("[Telegram] processUserMessage error:", err);
        });
      }
    } catch (err) {
      if (polling) {
        console.error("[Telegram] Poll error:", err);
      }
    }

    if (polling) {
      setTimeout(poll, POLL_INTERVAL);
    }
  }

  poll();
}

export function stopTelegramPoller() {
  polling = false;
  console.log("Telegram poller stopped.");
}
