import { NextResponse } from "next/server";
import { runScraper } from "@/lib/scraper";

export async function POST() {
  try {
    const results = await runScraper();

    const totalAdded = results.reduce((sum, r) => sum + r.eventsAdded, 0);
    const totalErrors = results.flatMap((r) => r.errors);

    return NextResponse.json({
      success: totalErrors.length === 0,
      results,
      summary: {
        totalAdded,
        totalErrors: totalErrors.length,
      },
    });
  } catch (error) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: "Scrape failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
