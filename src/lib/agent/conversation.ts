import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import fs from "fs";
import path from "path";
import { agentTools } from "./tools";
import { executeTool } from "./tool-handlers";
import { sendEmail } from "./email";

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

function buildSystemPrompt(): string {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `You are Sam's social planner, emailing event suggestions. Sound like a friend, not a bot.

Personality:
- Casual, concise, enthusiastic but not over the top
- Friendly tone, like a message from a friend
- Never say "I'm an AI" or "as your social planner"

Formatting rules (STRICT):
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
- Already suggested event IDs (don't repeat): ${state.suggestedEventIds.join(", ") || "none yet"}

Rules:
- ALWAYS call get_calendar before suggesting events to check the user's actual availability. Never suggest times that conflict with existing calendar events.
- Check preferences before suggesting (respect hard nos and availability)
- For proactive morning messages: suggest ONE standout option
- When the user asks for options or says "what should I do": suggest exactly 3 options, each from a DIFFERENT category (food, drinks, culture, active, low_key, nightlife, outdoors). Always include one low-effort option (e.g. cook dinner together, movie night at home, order takeout and play games).
- If user says yes: create a calendar hold, ask if they want to invite friends
- If user says no: ask why briefly, suggest something different
- When messaging friends: show the draft first, wait for approval
- Log every suggestion and outcome using log_interaction
- If user asks something unrelated to social plans, be helpful but brief`;
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
      "[SYSTEM] It's morning. Look at the user's preferences and suggest one great event if they're under their social goal. Text them naturally, like you just thought of something cool.",
  });

  await runToolLoop();
}

async function runToolLoop(): Promise<void> {
  let retries = 0;

  while (true) {
    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: buildSystemPrompt(),
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

    // No tool use, extract text response and send via iMessage
    if (textBlocks.length > 0) {
      const responseText = textBlocks
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim();

      if (responseText) {
        // Generate a short subject from the first line of the response
        const subject = responseText.split("\n")[0].substring(0, 60) || "social plans";
        try {
          await sendEmail(userEmail, subject, responseText);
          console.log(`Sent email: ${responseText.substring(0, 80)}...`);
        } catch (err) {
          console.error("Failed to send email:", err);
        }
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
