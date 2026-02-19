import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { eq, and, like } from "drizzle-orm";
import { EnrichedEvent } from "./types";

export function deduplicateEvents(enrichedEvents: EnrichedEvent[]): EnrichedEvent[] {
  const toInsert: EnrichedEvent[] = [];

  for (const event of enrichedEvents) {
    // Primary: exact source URL match
    const byUrl = db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.sourceUrl, event.sourceUrl))
      .get();

    // Eater: multiple restaurants from same article URL, check name too
    if (event.source === "eater" && byUrl) {
      const byUrlAndName = db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.sourceUrl, event.sourceUrl),
            eq(events.name, event.name)
          )
        )
        .get();

      if (byUrlAndName) continue;
      // Different restaurant from same article, allow it
    } else if (byUrl) {
      continue;
    }

    // Secondary: fuzzy cross-source match on name + date
    if (event.eventDate) {
      const datePrefix = event.eventDate.slice(0, 10);
      const nameLower = event.name.toLowerCase();

      const potentialDupes = db
        .select({ id: events.id, name: events.name })
        .from(events)
        .where(like(events.eventDate, `${datePrefix}%`))
        .all();

      const isDupe = potentialDupes.some((existing) => {
        const existingLower = (existing.name ?? "").toLowerCase();
        return (
          existingLower === nameLower ||
          existingLower.includes(nameLower) ||
          nameLower.includes(existingLower)
        );
      });

      if (isDupe) continue;
    }

    toInsert.push(event);
  }

  return toInsert;
}
