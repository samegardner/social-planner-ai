import cron, { type ScheduledTask } from "node-cron";
import { startProactiveSuggestion, resetWeeklyCount } from "./conversation";

let suggestionJob: ScheduledTask | null = null;
let resetJob: ScheduledTask | null = null;

export function startScheduler() {
  // Daily at 9am: proactive suggestion
  suggestionJob = cron.schedule("0 9 * * *", async () => {
    console.log("Proactive scheduler triggered (9am)");
    try {
      await startProactiveSuggestion();
    } catch (err) {
      console.error("Proactive suggestion failed:", err);
    }
  });

  // Monday at midnight: reset weekly social count
  resetJob = cron.schedule("0 0 * * 1", () => {
    console.log("Resetting weekly social count (Monday midnight)");
    resetWeeklyCount();
  });

  console.log("Scheduler started (proactive suggestions at 9am daily, weekly reset Mondays)");
}

export function stopScheduler() {
  if (suggestionJob) {
    suggestionJob.stop();
    suggestionJob = null;
  }
  if (resetJob) {
    resetJob.stop();
    resetJob = null;
  }
  console.log("Scheduler stopped.");
}
