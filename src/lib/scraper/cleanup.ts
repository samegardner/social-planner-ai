import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { lt, and, isNotNull } from "drizzle-orm";

export function cleanupExpiredEvents(): number {
  const now = new Date().toISOString();

  const result = db
    .delete(events)
    .where(
      and(
        isNotNull(events.expiresAt),
        lt(events.expiresAt, now)
      )
    )
    .run();

  return result.changes;
}
