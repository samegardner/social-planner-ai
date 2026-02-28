import { queryEvents } from "./tools/query-events";
import { getCalendar } from "./tools/get-calendar";
import { createCalendarHold } from "./tools/create-calendar-hold";
import { getPreferences } from "./tools/get-preferences";
import { getFriends } from "./tools/get-friends";
import { sendTelegramMessage } from "./tools/send-imessage";
import { logInteraction } from "./tools/log-interaction";
import { searchWeb } from "./tools/search-web";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolInput = any;

export interface ToolContext {
  chatId: string;
}

export async function executeTool(
  name: string,
  input: ToolInput,
  ctx: ToolContext,
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
    case "send_message":
      return sendTelegramMessage(input, ctx.chatId);
    case "search_web":
      return searchWeb(input);
    case "log_interaction":
      return logInteraction(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
