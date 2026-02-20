import { queryEvents } from "./tools/query-events";
import { getCalendar } from "./tools/get-calendar";
import { createCalendarHold } from "./tools/create-calendar-hold";
import { getPreferences } from "./tools/get-preferences";
import { getFriends } from "./tools/get-friends";
import { sendEmailTool } from "./tools/send-email";
import { logInteraction } from "./tools/log-interaction";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolInput = any;

export async function executeTool(
  name: string,
  input: ToolInput,
): Promise<unknown> {
  switch (name) {
    case "query_events":
      return queryEvents(input);
    case "get_calendar":
      return getCalendar(input);
    case "create_calendar_hold":
      return createCalendarHold(input);
    case "get_preferences":
      return getPreferences();
    case "get_friends":
      return getFriends();
    case "send_email":
      return sendEmailTool(input);
    case "log_interaction":
      return logInteraction(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
