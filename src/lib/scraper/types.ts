export interface RawScrapedEvent {
  name: string;
  venue?: string;
  address?: string;
  eventDate?: string;
  source: "ticketmaster" | "eater";
  sourceUrl: string;
  rawCategory?: string;
  rawPrice?: number;
  rawDescription?: string;
}

export interface EnrichedEvent {
  name: string;
  description: string;
  category: string;
  effortLevel: string;
  bestTime: string;
  neighborhood: string;
  priceRange: string;
  groupSize: string;
  venue?: string;
  address?: string;
  eventDate?: string;
  expiresAt: string;
  source: string;
  sourceUrl: string;
}

export interface ScrapeResult {
  source: string;
  eventsFound: number;
  eventsAdded: number;
  eventsSkipped: number;
  errors: string[];
}
