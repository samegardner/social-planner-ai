import { db } from "@/lib/db";
import { preferences } from "@/lib/schema";
import { initConversation } from "./conversation";
import { initCalendar } from "./calendar";
import { startScheduler, stopScheduler } from "./scheduler";

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

  if (!prefs.imessageNumber) {
    throw new Error("No iMessage number set. Update preferences first.");
  }

  const botNumber = process.env.TELNYX_PHONE_NUMBER;
  if (!botNumber) {
    throw new Error("Missing TELNYX_PHONE_NUMBER in env");
  }

  console.log(`User phone: ${prefs.imessageNumber}`);
  console.log(`Bot phone: ${botNumber}`);
  console.log(`Social goal: ${prefs.socialFrequency} events/week`);

  // 2. Initialize conversation manager
  initConversation(prefs.imessageNumber, prefs.socialFrequency ?? 2);

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

  initialized = true;
  console.log("\nAgent is running. Webhook ready for inbound messages.");

  // Graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down agent...");
    stopScheduler();
    initialized = false;
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
