CREATE TABLE `graduation_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Graduation List' NOT NULL,
	`spreadsheet_id` text,
	`spreadsheet_url` text,
	`status` text DEFAULT 'created' NOT NULL,
	`created_by` text,
	`populated_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
