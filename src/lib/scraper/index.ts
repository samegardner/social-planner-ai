import { db } from "@/lib/db";
import { events, scrapeRuns } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { scrapeTicketmaster } from "./ticketmaster";
import { scrapeEater } from "./eater";
import { enrichEvents } from "./enrichment";
import { deduplicateEvents } from "./dedup";
import { cleanupExpiredEvents } from "./cleanup";
import { ScrapeResult } from "./types";

export async function runScraper(): Promise<ScrapeResult[]> {
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!ticketmasterApiKey) throw new Error("TICKETMASTER_API_KEY is required in .env");
  if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is required in .env");

  // Step 1: Clean up expired events
  const cleaned = cleanupExpiredEvents();
  console.log(`Cleaned up ${cleaned} expired events`);

  const results: ScrapeResult[] = [];

  // Step 2: Scrape Ticketmaster
  results.push(
    await scrapeSource("ticketmaster", async () => {
      console.log("Scraping Ticketmaster...");
      const raw = await scrapeTicketmaster(ticketmasterApiKey);
      console.log(`Ticketmaster: ${raw.length} raw events`);

      console.log("Enriching Ticketmaster events...");
      const enriched = await enrichEvents(raw, anthropicApiKey);

      const unique = deduplicateEvents(enriched);
      console.log(`Ticketmaster: ${unique.length} new events after dedup`);

      for (const event of unique) {
        db.insert(events).values(event).run();
      }

      return { found: raw.length, added: unique.length, skipped: raw.length - unique.length };
    })
  );

  // Step 3: Scrape Eater
  results.push(
    await scrapeSource("eater", async () => {
      console.log("Scraping Eater NY...");
      const raw = await scrapeEater();
      console.log(`Eater: ${raw.length} raw events`);

      console.log("Enriching Eater events...");
      const enriched = await enrichEvents(raw, anthropicApiKey);

      const unique = deduplicateEvents(enriched);
      console.log(`Eater: ${unique.length} new events after dedup`);

      for (const event of unique) {
        db.insert(events).values(event).run();
      }

      return { found: raw.length, added: unique.length, skipped: raw.length - unique.length };
    })
  );

  return results;
}

async function scrapeSource(
  source: string,
  scraper: () => Promise<{ found: number; added: number; skipped: number }>
): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();

  const run = db
    .insert(scrapeRuns)
    .values({ source, status: "running", startedAt })
    .returning()
    .get();

  try {
    const { found, added, skipped } = await scraper();

    db.update(scrapeRuns)
      .set({
        status: "completed",
        eventsFound: found,
        eventsAdded: added,
        eventsSkipped: skipped,
        completedAt: new Date().toISOString(),
      })
      .where(eq(scrapeRuns.id, run.id))
      .run();

    return { source, eventsFound: found, eventsAdded: added, eventsSkipped: skipped, errors: [] };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    db.update(scrapeRuns)
      .set({
        status: "failed",
        error: errorMsg,
        completedAt: new Date().toISOString(),
      })
      .where(eq(scrapeRuns.id, run.id))
      .run();

    console.error(`[${source}] Scrape failed:`, errorMsg);
    return { source, eventsFound: 0, eventsAdded: 0, eventsSkipped: 0, errors: [errorMsg] };
  }
}
