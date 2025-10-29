PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE `assigned_modules`;--> statement-breakpoint
CREATE TABLE `assigned_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`semester_module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;