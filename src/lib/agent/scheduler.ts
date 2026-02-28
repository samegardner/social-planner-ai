import cron, { type ScheduledTask } from "node-cron";
import { startProactiveSuggestion } from "./conversation";
import { runScraper } from "@/lib/scraper";

let suggestionJob: ScheduledTask | null = null;
let scraperJob: ScheduledTask | null = null;

export function startScheduler() {
  // Wednesday and Saturday at 9am: proactive suggestions
  suggestionJob = cron.schedule("0 9 * * 3,6", async () => {
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    console.log(`Proactive scheduler triggered (${day} 9am)`);
    try {
      await startProactiveSuggestion();
    } catch (err) {
      console.error("Proactive suggestion failed:", err);
    }
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

  console.log("Scheduler started (suggestions Wed/Sat 9am, scraper 3am)");
}

export function stopScheduler() {
  if (suggestionJob) {
    suggestionJob.stop();
    suggestionJob = null;
  }
  if (scraperJob) {
    scraperJob.stop();
    scraperJob = null;
  }
  console.log("Scheduler stopped.");
}
