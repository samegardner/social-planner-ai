CREATE TABLE `activity_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity` text NOT NULL,
	`enabled` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slot` text NOT NULL,
	`enabled` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`effort_level` text,
	`best_time` text,
	`neighborhood` text,
	`price_range` text,
	`group_size` text,
	`venue` text,
	`address` text,
	`event_date` text,
	`expires_at` text,
	`source` text,
	`source_url` text,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `friends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone_number` text NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `interaction_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer,
	`suggestion` text NOT NULL,
	`response` text,
	`reason` text,
	`friend_ids` text,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `neighborhoods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`home_address` text,
	`max_budget` integer,
	`hard_nos` text,
	`social_frequency` integer DEFAULT 2,
	`imessage_number` text,
	`onboarding_completed` integer DEFAULT false,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `venue_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`venue_name` text NOT NULL,
	`address` text,
	`neighborhood` text,
	`visited_at` text,
	`rating` text,
	`notes` text,
	`created_at` text DEFAULT '(datetime(''now''))'
);
