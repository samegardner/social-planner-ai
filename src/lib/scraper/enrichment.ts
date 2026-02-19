import Anthropic from "@anthropic-ai/sdk";
import { RawScrapedEvent, EnrichedEvent } from "./types";
import { NYC_NEIGHBORHOODS, ACTIVITY_TYPES } from "@/lib/constants";

const BATCH_SIZE = 10;

const VALID_CATEGORIES = ACTIVITY_TYPES.map((a) => a.id);
const VALID_EFFORT = ["low", "medium", "high"];
const VALID_BEST_TIME = ["weeknight", "weekend_day", "weekend_night", "any"];
const VALID_PRICE = ["free", "$", "$$", "$$$", "$$$$"];
const VALID_GROUP_SIZE = ["solo", "pairs", "groups"];

export async function enrichEvents(
  rawEvents: RawScrapedEvent[],
  apiKey: string
): Promise<EnrichedEvent[]> {
  if (rawEvents.length === 0) return [];

  const client = new Anthropic({ apiKey });
  const enriched: EnrichedEvent[] = [];

  for (let i = 0; i < rawEvents.length; i += BATCH_SIZE) {
    const batch = rawEvents.slice(i, i + BATCH_SIZE);
    console.log(`  Enriching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rawEvents.length / BATCH_SIZE)} (${batch.length} events)`);
    const batchResults = await enrichBatch(client, batch);
    enriched.push(...batchResults);
  }

  return enriched;
}

async function enrichBatch(
  client: Anthropic,
  batch: RawScrapedEvent[]
): Promise<EnrichedEvent[]> {
  const eventsForPrompt = batch.map((e, idx) => ({
    index: idx,
    name: e.name,
    venue: e.venue,
    address: e.address,
    eventDate: e.eventDate,
    source: e.source,
    rawCategory: e.rawCategory,
    rawPrice: e.rawPrice,
    rawDescription: e.rawDescription,
  }));

  const systemPrompt = `You categorize NYC events for a social planning app. For each event, return a JSON array with one object per event. Each object must have these exact fields:

- category: one of ${JSON.stringify(VALID_CATEGORIES)}
- effortLevel: one of ${JSON.stringify(VALID_EFFORT)}
- bestTime: one of ${JSON.stringify(VALID_BEST_TIME)}
- priceRange: one of ${JSON.stringify(VALID_PRICE)}
- groupSize: one of ${JSON.stringify(VALID_GROUP_SIZE)}
- neighborhood: one of ${JSON.stringify(NYC_NEIGHBORHOODS)} (infer from venue/address, use closest match)
- description: a casual 1-2 sentence pitch for texting a friend about this event. Sound like a real person, not a bot. Example: "New ramen spot in the East Village that's getting great buzz. Perfect for a weeknight dinner."

Rules:
- For priceRange: free events = "free", under $30 = "$", $30-75 = "$$", $75-150 = "$$$", over $150 = "$$$$"
- For restaurants/bars without explicit pricing, infer from neighborhood and type
- For bestTime: use the event date/time if available, otherwise infer
- Return ONLY a valid JSON array, no other text`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Categorize these ${batch.length} events:\n\n${JSON.stringify(eventsForPrompt, null, 2)}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      category: string;
      effortLevel: string;
      bestTime: string;
      priceRange: string;
      groupSize: string;
      neighborhood: string;
      description: string;
    }>;

    return batch.map((raw, idx) => {
      const ai = parsed[idx] ?? parsed[0];
      return {
        name: raw.name,
        description: ai.description ?? "",
        category: VALID_CATEGORIES.includes(ai.category) ? ai.category : "culture",
        effortLevel: VALID_EFFORT.includes(ai.effortLevel) ? ai.effortLevel : "medium",
        bestTime: VALID_BEST_TIME.includes(ai.bestTime) ? ai.bestTime : "any",
        neighborhood: NYC_NEIGHBORHOODS.includes(ai.neighborhood) ? ai.neighborhood : "",
        priceRange: VALID_PRICE.includes(ai.priceRange) ? ai.priceRange : "$$",
        groupSize: VALID_GROUP_SIZE.includes(ai.groupSize) ? ai.groupSize : "pairs",
        venue: raw.venue,
        address: raw.address,
        eventDate: raw.eventDate,
        expiresAt: computeExpiry(raw),
        source: raw.source,
        sourceUrl: raw.sourceUrl,
      };
    });
  } catch (err) {
    console.error("Failed to parse AI enrichment response:", err);
    return batch.map((raw) => ({
      name: raw.name,
      description: raw.rawDescription ?? "",
      category: raw.rawCategory === "food" ? "food" : "culture",
      effortLevel: "medium",
      bestTime: "any",
      neighborhood: "",
      priceRange: "$$",
      groupSize: "pairs",
      venue: raw.venue,
      address: raw.address,
      eventDate: raw.eventDate,
      expiresAt: computeExpiry(raw),
      source: raw.source,
      sourceUrl: raw.sourceUrl,
    }));
  }
}

function computeExpiry(event: RawScrapedEvent): string {
  if (event.eventDate) {
    const d = new Date(event.eventDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  // Eater restaurants (no specific date) expire in 14 days
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
}
