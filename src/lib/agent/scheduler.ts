import cron, { type ScheduledTask } from "node-cron";
import { startProactiveSuggestion, resetWeeklyCount } from "./conversation";
import { runScraper } from "@/lib/scraper";

let suggestionJob: ScheduledTask | null = null;
let resetJob: ScheduledTask | null = null;
let scraperJob: ScheduledTask | null = null;

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

  // Daily at 3am: scrape for new events
  scraperJob = cron.schedule("0 3 * * *", async () => {
    console.log("Scraper cron triggered (3am)");
    try {
      const results = await runScraper();
      for (const r of results) {
        console.log(`[Scraper] ${r.source}: found=${r.eventsFound} added=${r.eventsAdded}`);
      }
    } catch (err) {
      console.error("Scraper cron failed:", err);
    }
  });

  console.log("Scheduler started (suggestions 9am, scraper 3am, weekly reset Mondays)");
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
  if (scraperJob) {
    scraperJob.stop();
    scraperJob = null;
  }
  console.log("Scheduler stopped.");
}
