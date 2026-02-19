import { getCalendarEvents, findOpenSlots } from "../calendar";
import { db } from "@/lib/db";
import { availability } from "@/lib/schema";

interface GetCalendarInput {
  start_date: string;
  end_date: string;
}

export async function getCalendar(input: GetCalendarInput) {
  const events = await getCalendarEvents(input.start_date, input.end_date);

  // Get user's available slots from preferences
  const availSlots = db
    .select()
    .from(availability)
    .all()
    .filter((a) => a.enabled)
    .map((a) => a.slot);

  const openSlots = await findOpenSlots(
    input.start_date,
    input.end_date,
    availSlots,
  );

  return {
    calendar_events: events,
    open_slots: openSlots,
  };
}
