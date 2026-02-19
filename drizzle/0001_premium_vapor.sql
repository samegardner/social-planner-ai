CREATE TABLE `scrape_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`events_found` integer DEFAULT 0,
	`events_added` integer DEFAULT 0,
	`events_skipped` integer DEFAULT 0,
	`error` text,
	`started_at` text NOT NULL,
	`completed_at` text
);
