import { getNewMessages } from "./imessage";
import {
  processUserMessage,
  getLastSeenRowId,
  updateLastSeenRowId,
} from "./conversation";

let intervalId: ReturnType<typeof setInterval> | null = null;
let processing = false;

export function startMessageListener(botPhoneNumber: string) {
  console.log(`Starting message listener on ${botPhoneNumber} conversation (polling every 5s)`);

  intervalId = setInterval(async () => {
    if (processing) return;
    processing = true;

    try {
      const messages = getNewMessages(botPhoneNumber, getLastSeenRowId());

      for (const msg of messages) {
        updateLastSeenRowId(msg.rowId);

        // Process is_from_me messages (user texting the bot's Telnyx number)
        // Skip is_from_me=false (bot's own Telnyx messages arriving as incoming)
        if (!msg.isFromMe) continue;

        console.log(`User message: "${msg.text}"`);
        await processUserMessage(msg.text);
      }
    } catch (err) {
      console.error("Message listener error:", err);
    } finally {
      processing = false;
    }
  }, 5000);
}

export function stopMessageListener() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Message listener stopped.");
  }
}
