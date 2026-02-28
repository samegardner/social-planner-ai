import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import fs from "fs";
import path from "path";
import { agentTools } from "./tools";
import { executeTool } from "./tool-handlers";
import { getCalendarEvents } from "./calendar";

const STATE_PATH = path.join(process.cwd(), "data", "conversations.json");
const MAX_MESSAGES = 30;
const MAX_RETRIES = 3;

interface ConversationState {
  messages: MessageParam[];
  lastSuggestionEventId: number | null;
  suggestedEventIds: number[];
  activeThread: boolean;
  lastProactiveDate: string | null;
  lastActivityTimestamp: string | null;
}

const defaultState: ConversationState = {
  messages: [],
  lastSuggestionEventId: null,
  suggestedEventIds: [],
  activeThread: false,
  lastProactiveDate: null,
  lastActivityTimestamp: null,
};

let state: ConversationState = { ...defaultState };
let anthropic: Anthropic;
let chatId: string;

export function initConversation(telegramChatId: string) {
  anthropic = new Anthropic();
  chatId = telegramChatId;
  loadState();
}

export function getState(): ConversationState {
  return state;
}

async function buildSystemPrompt(): Promise<string> {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Fetch rolling 2-week calendar
  let calendarSection = "";
  try {
    const startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const events = await getCalendarEvents(startDate, endDate);

    if (events.length > 0) {
      // Group events by day
      const byDay = new Map<string, typeof events>();
      for (const event of events) {
        const eventDate = event.start.split("T")[0];
        if (!byDay.has(eventDate)) byDay.set(eventDate, []);
        byDay.get(eventDate)!.push(event);
      }

      const lines: string[] = [];
      for (const [date, dayEvents] of byDay) {
        const d = new Date(date + "T12:00:00");
        const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const items = dayEvents.map((e) => {
          const startTime = e.start.includes("T")
            ? new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "all day";
          const endTime = e.end.includes("T")
            ? new Date(e.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "";
          let line = endTime ? `${e.summary} (${startTime}-${endTime})` : `${e.summary} (${startTime})`;
          if (e.location) line += ` @ ${e.location}`;
          return line;
        });
        lines.push(`- ${label}: ${items.join(", ")}`);
      }
      calendarSection = `\n- Calendar (past 2 weeks + next 2 weeks):\n${lines.join("\n")}`;
    }
  } catch (err) {
    console.warn("Failed to fetch calendar for system prompt:", err);
  }

  return `You are Sam's social and calendar assistant. You communicate over text. Sound like a helpful friend, not a bot.

Personality:
- Casual, concise, enthusiastic but not over the top
- Friendly tone, like a message from a friend
- Never say "I'm an AI" or "as your assistant"

Messages:
- ALWAYS use the send_message tool to deliver your message. Never just write text without sending it.
- One message at a time. Never send multiple messages in a row.
- This is texting. Keep it SHORT. 1-2 sentences max unless listing options.
- Ask quick questions to narrow down what they want. Don't front-load info.
- No markdown formatting (no bold, no bullets, no asterisks). Plain text only. Use line breaks to separate items if listing.
- Show costs as ~$XX (estimate from venue type, event category, and any price data available). Never use vague $/$$/$$$ symbols.
- Only send a longer list when the user is clearly browsing for options. Default to 1-2 suggestions.
- Include a ticket/event link when the user commits to something.

Context:
- Today is ${dayName}, ${dateStr}
- Already suggested event IDs (don't repeat): ${state.suggestedEventIds.join(", ") || "none yet"}${calendarSection}

Guidelines:
- Before suggesting anything, study the full calendar carefully. Think about what the events tell you about where the user is, what they've been doing, and what makes sense to suggest right now.
- Research before suggesting. Use query_events and search_web to understand what's available BEFORE composing a message.
- Be conversational. Handle whatever the user asks: finding plans, managing their calendar, answering questions about their schedule.
- When the user tells you about an event or commitment (e.g. "I have brunch Sunday"), ask if they want it on the calendar.
- When the user locks in a plan, create a calendar hold.
- If the user says no to a suggestion, ask why briefly, then suggest something different.
- Log suggestions and outcomes with log_interaction.`;
}

export async function processUserMessage(text: string): Promise<void> {
  state.activeThread = true;
  state.lastActivityTimestamp = new Date().toISOString();
  state.messages.push({ role: "user", content: text });
  trimHistory();

  await runToolLoop();
}

export async function startProactiveSuggestion(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  if (state.lastProactiveDate === today) {
    console.log("Already sent proactive suggestion today, skipping.");
    return;
  }

  state.activeThread = true;
  state.lastProactiveDate = today;
  state.messages.push({
    role: "user",
    content:
      "[SYSTEM] Check the user's calendar and what's coming up this week. If there's something interesting happening that fits their taste, or their weekend looks open, send them a casual suggestion. Don't force it. If nothing stands out, don't message.",
  });

  await runToolLoop();
}

async function runToolLoop(): Promise<void> {
  let retries = 0;

  while (true) {
    let response;
    try {
      const systemPrompt = await buildSystemPrompt();
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-20250514",
        max_tokens: 16000,
        thinking: {
          type: "enabled",
          budget_tokens: 10000,
        },
        system: systemPrompt,
        messages: state.messages,
        tools: agentTools,
      });
      response = await stream.finalMessage();
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error.status === 429 && retries < MAX_RETRIES) {
        retries++;
        const delay = Math.pow(2, retries) * 1000;
        console.warn(`Rate limited, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error("Claude API error:", err);
      return;
    }

    retries = 0; // reset on success

    // Log thinking blocks for debugging
    for (const block of response.content) {
      if (block.type === "thinking") {
        console.log(`[Thinking] ${block.thinking.substring(0, 200)}...`);
      }
    }

    // Check if response contains tool use
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use",
    );
    const textBlocks = response.content.filter(
      (block) => block.type === "text",
    );

    // Add assistant response to history
    state.messages.push({ role: "assistant", content: response.content });

    if (toolUseBlocks.length > 0) {
      // Execute tools and collect results
      const toolResults: ContentBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;

        console.log(`Executing tool: ${block.name}`, block.input);

        let result: unknown;
        try {
          result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            { chatId },
          );
        } catch (err) {
          console.error(`Tool ${block.name} failed:`, err);
          result = {
            error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`,
          };
        }

        // Track suggested event IDs
        if (block.name === "query_events" && Array.isArray(result)) {
          for (const event of result) {
            if (
              event.id &&
              !state.suggestedEventIds.includes(event.id as number)
            ) {
              state.suggestedEventIds.push(event.id as number);
            }
          }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        } as ContentBlockParam);
      }

      // Add tool results and loop
      state.messages.push({ role: "user", content: toolResults });
      trimHistory();
      saveState();
      continue; // loop back for Claude to process tool results
    }

    // No tool use — the agent should have already sent the message via
    // the send_message tool. Just log the final text for debugging.
    if (textBlocks.length > 0) {
      const responseText = textBlocks
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim();

      if (responseText) {
        console.log(`[Agent final text] ${responseText.substring(0, 120)}...`);
      }
    }

    // Check if thread is resolved (stop_reason = end_turn with no tools)
    if (response.stop_reason === "end_turn") {
      // Thread stays active until explicitly resolved via log_interaction
    }

    saveState();
    break; // done with this turn
  }
}

function trimHistory() {
  if (state.messages.length > MAX_MESSAGES) {
    // Keep the most recent messages, drop older ones
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }
}

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    const loaded = JSON.parse(raw) as ConversationState;
    state = { ...defaultState, ...loaded };
    console.log(
      `Loaded conversation state (${state.messages.length} messages)`,
    );
  } catch {
    console.log("No existing conversation state, starting fresh.");
    state = { ...defaultState };
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed to save conversation state:", err);
  }
}

// Reset full conversation state (for testing / unsticking the agent)
export function resetConversation() {
  state = { ...defaultState };
  saveState();
  console.log("Conversation state reset.");
}

