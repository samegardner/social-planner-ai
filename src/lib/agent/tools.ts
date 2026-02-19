import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const agentTools: Tool[] = [
  {
    name: "query_events",
    description:
      "Search the events database for upcoming things to do in NYC. You can filter by category, neighborhood, price, effort level, and date range. Returns up to 5 events.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "Event category: food, drinks, active, culture, low_key, nightlife, or outdoors",
        },
        neighborhood: {
          type: "string",
          description: "NYC neighborhood name to search in",
        },
        price_range: {
          type: "string",
          description: "Price range: free, $, $$, or $$$",
        },
        effort_level: {
          type: "string",
          description: "Effort level: low, medium, or high",
        },
        date_from: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        date_to: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
        exclude_ids: {
          type: "array",
          items: { type: "number" },
          description: "Event IDs to exclude (already suggested)",
        },
        limit: {
          type: "number",
          description: "Max results (default 5)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_calendar",
    description:
      "Check the user's Google Calendar and find open time slots based on their availability preferences. Returns existing events and available windows.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Start of range to check (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "End of range to check (YYYY-MM-DD)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "create_calendar_hold",
    description:
      "Create a tentative calendar hold for a planned social event. Only do this after the user confirms they want to go.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Event title for the calendar entry",
        },
        date: {
          type: "string",
          description: "Date of the event (YYYY-MM-DD)",
        },
        start_time: {
          type: "string",
          description: "Start time (HH:mm, 24h format)",
        },
        end_time: {
          type: "string",
          description: "End time (HH:mm, 24h format)",
        },
      },
      required: ["title", "date", "start_time", "end_time"],
    },
  },
  {
    name: "get_preferences",
    description:
      "Read the user's full preference profile: home address, budget, liked/avoided neighborhoods, activity types, hard nos, social frequency goal, and availability windows.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_friends",
    description:
      "Get the user's friend list with names and phone numbers. Use this to find who to invite to events.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "send_imessage",
    description:
      "Send an iMessage to a specific phone number. Use this to reach out to friends on the user's behalf (only after the user approves the message).",
    input_schema: {
      type: "object" as const,
      properties: {
        phone_number: {
          type: "string",
          description: "Phone number to text (e.g. +12125551234)",
        },
        message: {
          type: "string",
          description: "The message to send",
        },
      },
      required: ["phone_number", "message"],
    },
  },
  {
    name: "log_interaction",
    description:
      "Record a suggestion and the user's response for learning. Log every suggestion you make and the outcome (accepted, declined, modified).",
    input_schema: {
      type: "object" as const,
      properties: {
        event_id: {
          type: "number",
          description: "The event ID that was suggested",
        },
        suggestion: {
          type: "string",
          description: "What was suggested to the user",
        },
        response: {
          type: "string",
          description:
            "User's response: accepted, declined, modified, or no_response",
        },
        reason: {
          type: "string",
          description:
            "Why the user accepted/declined (if they gave a reason)",
        },
        friend_ids: {
          type: "array",
          items: { type: "number" },
          description: "IDs of friends involved in the plan",
        },
      },
      required: ["suggestion"],
    },
  },
];
