import "dotenv/config";
import { db } from "../src/lib/db";
import { preferences, activityPreferences, availability } from "../src/lib/schema";
import { startAgent } from "../src/lib/agent/index";

// Seed preferences if the database is empty (for fresh deployments)
function seedIfNeeded() {
  const existing = db.select().from(preferences).limit(1).get();
  if (existing) return;

  console.log("No preferences found, seeding defaults for deployment...");
  db.insert(preferences).values({
    socialFrequency: 2,
    hardNos: "nothing past 11 on weeknights unless its truly special",
    onboardingCompleted: true,
  }).run();

  const activities = ["outdoors", "nightlife", "low_key", "culture", "active", "drinks", "food"];
  for (const activity of activities) {
    db.insert(activityPreferences).values({ activity, enabled: true }).run();
  }

  const slots = ["weekend_nights", "weekend_days"];
  for (const slot of slots) {
    db.insert(availability).values({ slot, enabled: true }).run();
  }

  console.log("Seeded preferences, activities, and availability.");
}

// Keep process alive on uncaught errors (log but don't crash)
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

seedIfNeeded();

startAgent().catch((err) => {
  console.error("Agent failed to start:", err.message);
  process.exit(1);
});
