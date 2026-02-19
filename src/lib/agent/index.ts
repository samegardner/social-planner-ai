import { db } from "@/lib/db";
import { preferences, availability } from "@/lib/schema";
import { initConversation, getLastSeenRowId, updateLastSeenRowId } from "./conversation";
import { initCalendar } from "./calendar";
import { startMessageListener, stopMessageListener } from "./message-listener";
import { startScheduler, stopScheduler } from "./scheduler";
import { getLatestRowId } from "./imessage";

export async function startAgent() {
  console.log("Starting Social Planner Agent...\n");

  // 1. Validate onboarding is complete
  const prefs = db.select().from(preferences).limit(1).get();
  if (!prefs?.onboardingCompleted) {
    throw new Error(
      "Onboarding not complete. Finish onboarding at http://localhost:3000/onboarding first.",
    );
  }

  if (!prefs.imessageNumber) {
    throw new Error("No iMessage number set. Update preferences first.");
  }

  const botNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!botNumber) {
    throw new Error("Missing TWILIO_PHONE_NUMBER in .env");
  }

  console.log(`User phone: ${prefs.imessageNumber} (sends TO this number via Twilio)`);
  console.log(`Bot phone: ${botNumber} (monitors chat.db for replies)`);
  console.log(`Social goal: ${prefs.socialFrequency} events/week`);
  console.log(`Budget: $${prefs.maxBudget}`);

  // 2. Initialize conversation manager (with user's real phone number for sending)
  initConversation(prefs.imessageNumber, prefs.socialFrequency ?? 2);

  // 3. Initialize Google Calendar (optional, agent works without it)
  try {
    initCalendar();
    console.log("Google Calendar connected.");
  } catch (err) {
    console.warn(
      "Google Calendar not available (run scripts/google-auth.ts to set up).",
      err instanceof Error ? err.message : "",
    );
    console.warn("Agent will work without calendar features.\n");
  }

  // 3.5. If first run, skip to latest message so we don't replay history
  // Monitor the Twilio number in chat.db (that's the conversation thread on the Mac)
  if (getLastSeenRowId() === 0) {
    const latestRowId = getLatestRowId(botNumber);
    if (latestRowId > 0) {
      updateLastSeenRowId(latestRowId);
      console.log(`Initialized message cursor to rowId ${latestRowId} (skipping history).`);
    }
  }

  // 4. Start proactive scheduler
  startScheduler();

  // 5. Start message listener (monitors Twilio number conversation in chat.db)
  startMessageListener(botNumber);

  console.log("\nAgent is running. Listening for messages and scheduling suggestions.");
  console.log("Press Ctrl+C to stop.\n");

  // Graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down agent...");
    stopMessageListener();
    stopScheduler();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
