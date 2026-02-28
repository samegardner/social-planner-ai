import { db } from "@/lib/db";
import { preferences } from "@/lib/schema";
import { initConversation } from "./conversation";
import { initCalendar } from "./calendar";
import { startScheduler, stopScheduler } from "./scheduler";
import { startTelegramPoller, stopTelegramPoller } from "./telegram-poller";

let initialized = false;

export function isAgentInitialized(): boolean {
  return initialized;
}

export async function startAgent() {
  if (initialized) return;

  console.log("Starting Social Planner Agent...\n");

  // 1. Validate onboarding is complete
  const prefs = db.select().from(preferences).limit(1).get();
  if (!prefs?.onboardingCompleted) {
    throw new Error(
      "Onboarding not complete. Finish onboarding at the web UI first.",
    );
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN in env");
  }
  if (!process.env.TELEGRAM_CHAT_ID) {
    throw new Error("Missing TELEGRAM_CHAT_ID in env");
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log(`Telegram chat ID: ${chatId}`);

  // 2. Initialize conversation manager
  initConversation(chatId);

  // 3. Initialize Google Calendar (optional)
  try {
    initCalendar();
    console.log("Google Calendar connected.");
  } catch (err) {
    console.warn(
      "Google Calendar not available.",
      err instanceof Error ? err.message : "",
    );
    console.warn("Agent will work without calendar features.\n");
  }

  // 4. Start proactive scheduler
  startScheduler();

  // 5. Start Telegram poller for inbound messages
  startTelegramPoller();

  initialized = true;
  console.log("\nAgent is running. Listening for Telegram messages.");

  // Graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down agent...");
    stopTelegramPoller();
    stopScheduler();
    initialized = false;
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
