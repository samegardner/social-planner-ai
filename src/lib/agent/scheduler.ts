import cron, { type ScheduledTask } from "node-cron";
import { startProactiveSuggestion } from "./conversation";
import { runScraper } from "@/lib/scraper";

let suggestionTimer: ReturnType<typeof setTimeout> | null = null;
let scraperJob: ScheduledTask | null = null;

export function startScheduler() {
  // Weekdays: pick a random time between 9am and 3:30pm EST to send a proactive suggestion
  const scheduleNextSuggestion = () => {
    const now = new Date();
    // Work in EST (UTC-5)
    const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

    // Find the next weekday target in EST
    let targetDate = new Date(estNow);
    const today = estNow.getDay();

    if (today === 0) targetDate.setDate(targetDate.getDate() + 1);
    else if (today === 6) targetDate.setDate(targetDate.getDate() + 2);
    else if (estNow.getHours() > 15 || (estNow.getHours() === 15 && estNow.getMinutes() >= 30)) {
      targetDate.setDate(targetDate.getDate() + (today === 5 ? 3 : 1));
    }

    // Random time between 9:00 and 15:30 (9am - 3:30pm)
    const minMinutes = 9 * 60;
    const maxMinutes = 15 * 60 + 30;
    const randomMinutes = minMinutes + Math.floor(Math.random() * (maxMinutes - minMinutes));
    targetDate.setHours(Math.floor(randomMinutes / 60), randomMinutes % 60, 0, 0);

    // If target is in the past, push to next weekday
    if (targetDate <= estNow) {
      const day = targetDate.getDay();
      targetDate.setDate(targetDate.getDate() + (day === 5 ? 3 : 1));
      const newRandom = minMinutes + Math.floor(Math.random() * (maxMinutes - minMinutes));
      targetDate.setHours(Math.floor(newRandom / 60), newRandom % 60, 0, 0);
    }

    // Convert EST target back to a real delay from now
    // targetDate was constructed from estNow, so compute the EST offset
    const estOffset = estNow.getTime() - now.getTime();
    const realTarget = new Date(targetDate.getTime() - estOffset);
    const delay = realTarget.getTime() - now.getTime();

    const timeStr = targetDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const dayStr = targetDate.toLocaleDateString("en-US", { weekday: "long" });
    console.log(`Next proactive suggestion scheduled for ${dayStr} at ${timeStr} EST`);

    suggestionTimer = setTimeout(async () => {
      console.log(`Proactive suggestion triggered (${dayStr} ${timeStr} EST)`);
      try {
        await startProactiveSuggestion();
      } catch (err) {
        console.error("Proactive suggestion failed:", err);
      }
      scheduleNextSuggestion();
    }, delay);
  };

  scheduleNextSuggestion();

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

  console.log("Scheduler started (suggestions weekdays 9am-3:30pm EST, scraper 3am)");
}

export function stopScheduler() {
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
    suggestionTimer = null;
  }
  if (scraperJob) {
    scraperJob.stop();
    scraperJob = null;
  }
  console.log("Scheduler stopped.");
}
