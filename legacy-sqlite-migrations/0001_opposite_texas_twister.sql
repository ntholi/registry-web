CREATE TABLE `sponsors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer
);
