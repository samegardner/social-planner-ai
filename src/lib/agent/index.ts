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

  if (!prefs.email) {
    throw new Error("No email set. Update preferences first.");
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY in env");
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error("Missing RESEND_FROM_EMAIL in env");
  }

  console.log(`User email: ${prefs.email}`);
  console.log(`Social goal: ${prefs.socialFrequency} events/week`);

  // 2. Initialize conversation manager
  initConversation(prefs.email, prefs.socialFrequency ?? 2);

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
