import { google, calendar_v3 } from "googleapis";
import { getAuthenticatedClient } from "./google-tokens";

let calendarApi: calendar_v3.Calendar | null = null;

export function initCalendar(): void {
  const auth = getAuthenticatedClient();
  calendarApi = google.calendar({ version: "v3", auth });
}

function getCalendar(): calendar_v3.Calendar {
  if (!calendarApi) {
    throw new Error("Calendar not initialized. Call initCalendar() first.");
  }
  return calendarApi;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  status: string;
  location: string;
  description: string;
  attendees: string[];
}

const CALENDAR_IDS = ["primary", "gardner@stainless.com"];

export async function getCalendarEvents(
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const cal = getCalendar();
  const allEvents: CalendarEvent[] = [];

  for (const calendarId of CALENDAR_IDS) {
    const res = await cal.events.list({
      calendarId,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    for (const event of res.data.items || []) {
      allEvents.push({
        id: event.id || "",
        summary: event.summary || "(no title)",
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
        status: event.status || "confirmed",
        location: event.location || "",
        description: event.description || "",
        attendees: (event.attendees || []).map((a) => a.email || "").filter(Boolean),
      });
    }
  }

  allEvents.sort((a, b) => a.start.localeCompare(b.start));
  return allEvents;
}

// Availability windows mapped to day/time ranges
const SLOT_WINDOWS: Record<string, { days: number[]; startHour: number; endHour: number }> = {
  weeknight_evenings: { days: [1, 2, 3, 4], startHour: 18, endHour: 22 }, // Mon-Thu 6-10pm
  weekend_days: { days: [0, 6], startHour: 10, endHour: 17 },             // Sat-Sun 10am-5pm
  weekend_nights: { days: [5, 6], startHour: 19, endHour: 24 },           // Fri-Sat 7pm-12am
};

export interface OpenSlot {
  date: string;       // YYYY-MM-DD
  dayOfWeek: string;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  slotType: string;
}

export async function findOpenSlots(
  startDate: string,
  endDate: string,
  availableSlots: string[],
): Promise<OpenSlot[]> {
  const events = await getCalendarEvents(startDate, endDate);
  const openSlots: OpenSlot[] = [];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dateStr = d.toISOString().split("T")[0];

    for (const slotName of availableSlots) {
      const window = SLOT_WINDOWS[slotName];
      if (!window || !window.days.includes(dayOfWeek)) continue;

      const windowStart = new Date(d);
      windowStart.setHours(window.startHour, 0, 0, 0);
      const windowEnd = new Date(d);
      windowEnd.setHours(window.endHour === 24 ? 23 : window.endHour, window.endHour === 24 ? 59 : 0, 0, 0);

      // Check if any calendar event overlaps this window
      const hasConflict = events.some((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventStart < windowEnd && eventEnd > windowStart;
      });

      if (!hasConflict) {
        openSlots.push({
          date: dateStr,
          dayOfWeek: days[dayOfWeek],
          startTime: `${String(window.startHour).padStart(2, "0")}:00`,
          endTime: window.endHour === 24 ? "23:59" : `${String(window.endHour).padStart(2, "0")}:00`,
          slotType: slotName,
        });
      }
    }
  }

  return openSlots;
}

export async function createCalendarHold(
  title: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<string> {
  const cal = getCalendar();

  const startDateTime = `${date}T${startTime}:00`;
  const endDateTime = `${date}T${endTime}:00`;

  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: { dateTime: startDateTime, timeZone: "America/New_York" },
      end: { dateTime: endDateTime, timeZone: "America/New_York" },
      status: "tentative",
      description: "Created by Social Planner AI",
    },
  });

  return res.data.id || "";
}
