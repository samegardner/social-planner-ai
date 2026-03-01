import "dotenv/config";

// Send real emails by default; set SEND_EMAILS=false to suppress
process.env.SEND_EMAILS ??= "true";

import { db } from "../src/lib/db";
import { preferences } from "../src/lib/schema";
import { eq } from "drizzle-orm";
import { initConversation, startProactiveSuggestion, resetConversation } from "../src/lib/agent/conversation";
import { initCalendar } from "../src/lib/agent/calendar";

const TEST_EMAIL = "samegard@gmail.com";

async function main() {
  // Ensure a preferences row exists
  let prefs = db.select().from(preferences).limit(1).get();
  if (!prefs) {
    db.insert(preferences).values({
      email: TEST_EMAIL,
      zipCode: "10001",
      socialFrequency: 2,
      onboardingCompleted: true,
    }).run();
    console.log("Seeded preferences row.");
    prefs = db.select().from(preferences).limit(1).get();
  } else if (!prefs.email) {
    db.update(preferences).set({ email: TEST_EMAIL }).where(eq(preferences.id, prefs.id)).run();
    prefs.email = TEST_EMAIL;
    console.log("Updated preferences with email.");
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error("Missing TELEGRAM_CHAT_ID in .env");
  }

  console.log(`Sending proactive suggestion via Telegram (chat ${chatId})...`);

  initConversation(chatId);

  try {
    initCalendar();
    console.log("Google Calendar connected.");
  } catch (err) {
    console.warn("Google Calendar not available, continuing without it.");
  }

  // Reset so lastProactiveDate doesn't block us
  resetConversation();

  await startProactiveSuggestion();
  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
