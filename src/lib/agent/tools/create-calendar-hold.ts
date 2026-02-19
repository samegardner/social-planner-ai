import { createCalendarHold as createHold } from "../calendar";

interface CreateCalendarHoldInput {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
}

export async function createCalendarHold(input: CreateCalendarHoldInput) {
  const eventId = await createHold(
    input.title,
    input.date,
    input.start_time,
    input.end_time,
  );

  return {
    event_id: eventId,
    created: true,
  };
}
