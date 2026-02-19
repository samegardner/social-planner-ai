import { RawScrapedEvent } from "./types";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

const RELEVANT_CLASSIFICATIONS = [
  { segmentName: "Music" },
  { segmentName: "Sports" },
  { segmentName: "Arts & Theatre", genreName: "Comedy" },
  { segmentName: "Arts & Theatre", genreName: "Theatre" },
  { segmentName: "Arts & Theatre", genreName: "Dance" },
  { segmentName: "Arts & Theatre", genreName: "Classical" },
];

export async function scrapeTicketmaster(apiKey: string): Promise<RawScrapedEvent[]> {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endDateTime = weekFromNow.toISOString().replace(/\.\d{3}Z$/, "Z");

  const results: RawScrapedEvent[] = [];

  for (const classification of RELEVANT_CLASSIFICATIONS) {
    const params = new URLSearchParams({
      apikey: apiKey,
      city: "New York",
      stateCode: "NY",
      startDateTime,
      endDateTime,
      size: "50",
      sort: "relevance,desc",
      segmentName: classification.segmentName,
    });

    if (classification.genreName) {
      params.set("genreName", classification.genreName);
    }

    const url = `${TM_BASE}?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Ticketmaster request failed for ${classification.segmentName}/${classification.genreName ?? "all"}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const events = data._embedded?.events ?? [];

      for (const event of events) {
        const venue = event._embedded?.venues?.[0];
        const priceRange = event.priceRanges?.[0];
        const classification0 = event.classifications?.[0];
        const genre = classification0?.genre?.name;
        const segment = classification0?.segment?.name;

        results.push({
          name: event.name,
          venue: venue?.name,
          address: venue?.address?.line1
            ? `${venue.address.line1}, ${venue.city?.name ?? "New York"}, ${venue.state?.stateCode ?? "NY"}`
            : undefined,
          eventDate: event.dates?.start?.dateTime ?? event.dates?.start?.localDate,
          source: "ticketmaster",
          sourceUrl: event.url,
          rawCategory: genre?.toLowerCase() ?? segment?.toLowerCase() ?? classification.segmentName.toLowerCase(),
          rawPrice: priceRange?.min,
          rawDescription: [
            `${event.name} at ${venue?.name ?? "TBD"}.`,
            genre ? `Genre: ${genre}.` : `Type: ${segment}.`,
            priceRange ? `Tickets from $${priceRange.min}.` : "",
          ]
            .filter(Boolean)
            .join(" "),
        });
      }

      // Respect rate limit (5 req/sec)
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.error(`Ticketmaster error for ${classification.segmentName}/${classification.genreName ?? "all"}:`, err);
    }
  }

  // Deduplicate within results (same event can appear in multiple classifications)
  const seen = new Set<string>();
  return results.filter((e) => {
    if (seen.has(e.sourceUrl)) return false;
    seen.add(e.sourceUrl);
    return true;
  });
}
