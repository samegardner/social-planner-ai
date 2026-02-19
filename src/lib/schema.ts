import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Single-user preferences (one row, upserted)
export const preferences = sqliteTable("preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  homeAddress: text("home_address"),
  maxBudget: integer("max_budget"),
  hardNos: text("hard_nos"),
  socialFrequency: integer("social_frequency").default(2),
  imessageNumber: text("imessage_number"),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("(datetime('now'))"),
  updatedAt: text("updated_at").default("(datetime('now'))"),
});

// Liked/avoided neighborhoods
export const neighborhoods = sqliteTable("neighborhoods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["like", "avoid"] }).notNull(),
});

// Activity preferences
export const activityPreferences = sqliteTable("activity_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activity: text("activity").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
});

// Availability slots
export const availability = sqliteTable("availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slot: text("slot").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
});

// Friends list
export const friends = sqliteTable("friends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: text("created_at").default("(datetime('now'))"),
});

// --- Future tables (defined now so the schema is ready for the agent) ---

// Events scraped from various sources
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  effortLevel: text("effort_level"),
  bestTime: text("best_time"),
  neighborhood: text("neighborhood"),
  priceRange: text("price_range"),
  groupSize: text("group_size"),
  venue: text("venue"),
  address: text("address"),
  eventDate: text("event_date"),
  expiresAt: text("expires_at"),
  source: text("source"),
  sourceUrl: text("source_url"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

// Interaction log for learning
export const interactionLogs = sqliteTable("interaction_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id"),
  suggestion: text("suggestion").notNull(),
  response: text("response"),
  reason: text("reason"),
  friendIds: text("friend_ids"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

// Scrape run logs
export const scrapeRuns = sqliteTable("scrape_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  status: text("status").notNull(),
  eventsFound: integer("events_found").default(0),
  eventsAdded: integer("events_added").default(0),
  eventsSkipped: integer("events_skipped").default(0),
  error: text("error"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
});

// Venue history
export const venueHistory = sqliteTable("venue_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  venueName: text("venue_name").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),
  visitedAt: text("visited_at"),
  rating: text("rating"),
  notes: text("notes"),
  createdAt: text("created_at").default("(datetime('now'))"),
});
