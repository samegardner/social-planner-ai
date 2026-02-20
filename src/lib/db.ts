import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "social-planner.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist (replaces drizzle-kit push for production)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_address TEXT,
    zip_code TEXT,
    max_budget INTEGER,
    hard_nos TEXT,
    social_frequency INTEGER DEFAULT 2,
    imessage_number TEXT,
    email TEXT,
    onboarding_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS neighborhoods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS activity_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity TEXT NOT NULL,
    enabled INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot TEXT NOT NULL,
    enabled INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    effort_level TEXT,
    best_time TEXT,
    neighborhood TEXT,
    price_range TEXT,
    group_size TEXT,
    venue TEXT,
    address TEXT,
    event_date TEXT,
    expires_at TEXT,
    source TEXT,
    source_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS interaction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    suggestion TEXT NOT NULL,
    response TEXT,
    reason TEXT,
    friend_ids TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    events_found INTEGER DEFAULT 0,
    events_added INTEGER DEFAULT 0,
    events_skipped INTEGER DEFAULT 0,
    error TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS venue_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_name TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    visited_at TEXT,
    rating TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrate: add email column if missing (for existing databases)
const cols = sqlite.prepare(`PRAGMA table_info(preferences)`).all() as { name: string }[];
const hasEmail = cols.some((col) => col.name === "email");
if (!hasEmail) {
  sqlite.exec(`ALTER TABLE preferences ADD COLUMN email TEXT`);
}

export const db = drizzle(sqlite, { schema });
