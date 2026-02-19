import { db } from "@/lib/db";
import { interactionLogs } from "@/lib/schema";

interface LogInteractionInput {
  event_id?: number;
  suggestion: string;
  response?: string;
  reason?: string;
  friend_ids?: number[];
}

export function logInteraction(input: LogInteractionInput) {
  const result = db
    .insert(interactionLogs)
    .values({
      eventId: input.event_id ?? null,
      suggestion: input.suggestion,
      response: input.response ?? null,
      reason: input.reason ?? null,
      friendIds: input.friend_ids ? JSON.stringify(input.friend_ids) : null,
    })
    .run();

  return { logged: true, id: result.lastInsertRowid };
}
