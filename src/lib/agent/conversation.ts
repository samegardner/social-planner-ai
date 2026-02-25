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
  weekSocialCount: number;
  activeThread: boolean;
  lastProactiveDate: string | null;
  lastActivityTimestamp: string | null;
}

const defaultState: ConversationState = {
  messages: [],
  lastSuggestionEventId: null,
  suggestedEventIds: [],
  weekSocialCount: 0,
  activeThread: false,
  lastProactiveDate: null,
  lastActivityTimestamp: null,
};

let state: ConversationState = { ...defaultState };
let anthropic: Anthropic;
let userEmail: string;
let socialGoal: number;

export function initConversation(email: string, socialFrequency: number) {
  anthropic = new Anthropic();
  userEmail = email;
  socialGoal = socialFrequency;
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
    const startDate = now.toISOString().split("T")[0];
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
          return endTime ? `${e.summary} (${startTime}-${endTime})` : `${e.summary} (${startTime})`;
        });
        lines.push(`- ${label}: ${items.join(", ")}`);
      }
      calendarSection = `\n- Calendar (next 2 weeks):\n${lines.join("\n")}`;
    }
  } catch (err) {
    console.warn("Failed to fetch calendar for system prompt:", err);
  }

  return `You are Sam's social planner, emailing event suggestions. Sound like a friend, not a bot.

Personality:
- Casual, concise, enthusiastic but not over the top
- Friendly tone, like a message from a friend
- Never say "I'm an AI" or "as your social planner"

Formatting rules (STRICT):
- ALWAYS use the send_email tool to deliver your message. Never just write text without sending it.
- ALWAYS reply in ONE single email. Never send multiple emails in a row.
- Keep it concise. A short paragraph for a suggestion, 1-2 sentences for a follow-up.
- Use markdown formatting: **bold** for event names, bullet points (- ) for details
- Give actual estimated costs in dollars (e.g. "$15 per person", "$40-60 for two"). Never use vague $/$$/$$$ symbols. Estimate from venue type, event category, and any price data available.
- Example suggestion format:
  "**Jason Isbell at Radio City**, Saturday night at 8pm
  - ~$45 per ticket, Midtown
  - Chill vibes, great live music
  Down?"

Context:
- Today is ${dayName}, ${dateStr}
- This week's social count: ${state.weekSocialCount} out of ${socialGoal} goal
- ${state.activeThread ? "Active suggestion being discussed." : "No active suggestion."}
- Already suggested event IDs (don't repeat): ${state.suggestedEventIds.join(", ") || "none yet"}${calendarSection}

Rules:
- Think carefully about what the calendar events mean for the user's availability and location before making any suggestions.
- Check preferences before suggesting (respect hard nos and availability)
- When suggesting plans (proactive or on request):
  1. RESEARCH PHASE: Query events and search the web across multiple categories to understand what's available. Do this BEFORE composing your email.
  2. FIRST EMAIL: Present 3-4 categories, each with one specific teaser from your research. Keep it scannable. Example format:
     "Few directions for this weekend:
     **Live music** - Jason Isbell is at Radio City Saturday
     **Try a new restaurant** - new tasting menu spot in Prospect Heights
     **Something active** - Brooklyn Boulders has open climb Sunday
     **Low-key night** - cook dinner together or movie night at home
     What sounds good? I'll find more options for whatever catches your eye."
  3. DRILL-DOWN: When the user picks a category, first call get_friends, then present the best 5 options in that category with full details (name, date/time, estimated cost, location, and source URL for web results). You already have the data from step 1. After the options, ask who they want to bring. List each friend by name and include "Just me" as an option. Example:
     "Who's coming?
     - Jake
     - Maria
     - Chris
     - Just me"
  4. COMMIT: When the user picks an event and who's coming, create a calendar hold and confirm.
- If user says yes to an event: create a calendar hold
- If user says no: ask why briefly, suggest something different
- Log every suggestion and outcome using log_interaction
- If user asks something unrelated to social plans, be helpful but brief
- Use query_events and search_web during the research phase. When presenting web search results, always include the source URL.`;
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

  if (state.weekSocialCount >= socialGoal) {
    console.log(`Social goal met (${state.weekSocialCount}/${socialGoal}), skipping proactive.`);
    return;
  }

  state.activeThread = true;
  state.lastProactiveDate = today;
  state.messages.push({
    role: "user",
    content:
      "[SYSTEM] It's morning and the user is under their social goal. Follow the suggestion flow: research what's available, then send the category email with 3-4 directions.",
  });

  await runToolLoop();
}

async function runToolLoop(): Promise<void> {
  let retries = 0;

  while (true) {
    let response;
    try {
      const systemPrompt = await buildSystemPrompt();
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 16000,
        thinking: {
          type: "enabled",
          budget_tokens: 10000,
        },
        system: systemPrompt,
        messages: state.messages,
        tools: agentTools,
      });
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
            { userEmail },
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

    // No tool use — the agent should have already sent the email via
    // the send_email tool. Just log the final text for debugging.
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

// Reset weekly count (called by scheduler on Monday mornings)
export function resetWeeklyCount() {
  state.weekSocialCount = 0;
  saveState();
}

export function incrementSocialCount() {
  state.weekSocialCount++;
  saveState();
}
