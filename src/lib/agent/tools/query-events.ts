import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { and, eq, gte, lte, notInArray, like, sql } from "drizzle-orm";

interface QueryEventsInput {
  category?: string;
  neighborhood?: string;
  price_range?: string;
  effort_level?: string;
  date_from?: string;
  date_to?: string;
  exclude_ids?: number[];
  limit?: number;
}

export function queryEvents(input: QueryEventsInput) {
  const conditions = [];
  const now = new Date().toISOString();

  // Always filter out expired events
  conditions.push(
    sql`(${events.expiresAt} IS NULL OR ${events.expiresAt} > ${now})`,
  );

  if (input.category) {
    conditions.push(eq(events.category, input.category));
  }
  if (input.neighborhood) {
    conditions.push(like(events.neighborhood, `%${input.neighborhood}%`));
  }
  if (input.price_range) {
    conditions.push(eq(events.priceRange, input.price_range));
  }
  if (input.effort_level) {
    conditions.push(eq(events.effortLevel, input.effort_level));
  }
  if (input.date_from) {
    // Normalize: if just a date like "2026-02-20", keep as-is (works for gte)
    conditions.push(gte(events.eventDate, input.date_from));
  }
  if (input.date_to) {
    // Normalize: if just a date like "2026-02-20", append end-of-day so
    // timestamps like "2026-02-20T23:59:00Z" are included
    const dateTo = input.date_to.includes("T")
      ? input.date_to
      : `${input.date_to}T23:59:59Z`;
    conditions.push(lte(events.eventDate, dateTo));
  }
  if (input.exclude_ids && input.exclude_ids.length > 0) {
    conditions.push(notInArray(events.id, input.exclude_ids));
  }

  const results = db
    .select()
    .from(events)
    .where(and(...conditions))
    .limit(input.limit || 5)
    .all();

  return results;
}
