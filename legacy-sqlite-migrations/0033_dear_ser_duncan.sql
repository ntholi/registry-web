CREATE TABLE `assigned_program_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assigned_module_id` integer NOT NULL,
	`program_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`assigned_module_id`) REFERENCES `assigned_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);
