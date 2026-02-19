import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { RawScrapedEvent } from "./types";

const EATER_RSS = "https://ny.eater.com/rss/index.xml";

const RELEVANT_PATTERNS = [
  /new\s+restaurant/i,
  /openings?/i,
  /where\s+to\s+eat/i,
  /hot\s+list/i,
  /best\s+new/i,
  /just\s+opened/i,
  /now\s+open/i,
  /heatmap/i,
  /essential/i,
];

function isRelevantArticle(title: string, link: string): boolean {
  const text = `${title} ${link}`;
  return RELEVANT_PATTERNS.some((p) => p.test(text));
}

export async function scrapeEater(): Promise<RawScrapedEvent[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(EATER_RSS);
  const results: RawScrapedEvent[] = [];

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const relevantItems = (feed.items ?? []).filter((item) => {
    const pubDate = item.pubDate ? new Date(item.pubDate) : null;
    if (pubDate && pubDate < cutoff) return false;
    return isRelevantArticle(item.title ?? "", item.link ?? "");
  });

  console.log(`Eater: found ${relevantItems.length} relevant articles from ${feed.items?.length ?? 0} total`);

  for (const item of relevantItems) {
    if (!item.link) continue;

    try {
      const html = await fetch(item.link).then((r) => r.text());
      const restaurants = parseEaterArticle(html, item.link, item.title ?? "");
      console.log(`  Article "${item.title}": extracted ${restaurants.length} restaurants`);
      results.push(...restaurants);
    } catch (err) {
      console.error(`Failed to parse Eater article: ${item.link}`, err);
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

function parseEaterArticle(
  html: string,
  articleUrl: string,
  articleTitle: string
): RawScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: RawScrapedEvent[] = [];

  const articleBody = $(".c-entry-content, .l-main-content, article");

  // Pattern 1: h2 headers in list articles
  articleBody.find("h2").each((_, el) => {
    const name = $(el).text().trim();
    if (!name || name.length < 3 || name.length > 100) return;
    // Skip common non-restaurant h2s
    if (/related|newsletter|sign up|read more/i.test(name)) return;

    let description = "";
    let current = $(el).next();
    while (current.length && !current.is("h2")) {
      if (current.is("p")) {
        description += current.text().trim() + " ";
      }
      current = current.next();
    }

    const addressEl = $(el).parent().find(".c-mapstack__address, address");
    const address = addressEl.length ? addressEl.first().text().trim() : undefined;

    events.push({
      name: cleanRestaurantName(name),
      address,
      source: "eater",
      sourceUrl: articleUrl,
      rawCategory: "food",
      rawDescription: `${name}. From Eater article: "${articleTitle}". ${description.slice(0, 500)}`,
    });
  });

  // Pattern 2: mapstack entries (used in Heatmap articles)
  if (events.length === 0) {
    articleBody.find(".c-mapstack__card, [data-venue-id]").each((_, el) => {
      const name = $(el).find("h1, h2, h3, .c-mapstack__card-hed").first().text().trim();
      const desc = $(el).find("p, .c-mapstack__card-dek").first().text().trim();
      const address = $(el).find(".c-mapstack__address, address").first().text().trim();

      if (name && name.length >= 3) {
        events.push({
          name: cleanRestaurantName(name),
          address: address || undefined,
          source: "eater",
          sourceUrl: articleUrl,
          rawCategory: "food",
          rawDescription: `${name}. ${desc}. From: "${articleTitle}"`,
        });
      }
    });
  }

  return events;
}

function cleanRestaurantName(name: string): string {
  return name.replace(/^\d+[\.\)]\s*/, "").trim();
}
