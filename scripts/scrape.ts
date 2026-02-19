import "dotenv/config";
import { runScraper } from "../src/lib/scraper";

async function main() {
  console.log(`Starting scrape at ${new Date().toISOString()}`);
  console.log("---");

  try {
    const results = await runScraper();

    console.log("\n--- Scrape Summary ---");
    for (const r of results) {
      console.log(`${r.source}: ${r.eventsAdded} added, ${r.eventsSkipped} skipped`);
      if (r.errors.length > 0) {
        console.log(`  Errors: ${r.errors.join(", ")}`);
      }
    }

    const totalAdded = results.reduce((sum, r) => sum + r.eventsAdded, 0);
    console.log(`\nTotal: ${totalAdded} new events added`);
    console.log("Scrape complete.");
    process.exit(0);
  } catch (err) {
    console.error("Fatal scrape error:", err);
    process.exit(1);
  }
}

main();
