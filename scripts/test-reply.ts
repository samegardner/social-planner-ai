import "dotenv/config";

process.env.SEND_EMAILS ??= "true";

import { initConversation, processUserMessage } from "../src/lib/agent/conversation";
import { initCalendar } from "../src/lib/agent/calendar";

const TEST_EMAIL = "samegard@gmail.com";
const REPLY_TEXT = process.argv[2] || "Live music";

async function main() {
  console.log(`Simulating reply: "${REPLY_TEXT}"`);

  // initConversation loads persisted state (messages from the proactive email)
  initConversation(TEST_EMAIL, 2);

  try {
    initCalendar();
    console.log("Google Calendar connected.");
  } catch {
    console.warn("Google Calendar not available, continuing without it.");
  }

  await processUserMessage(REPLY_TEXT);
  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
