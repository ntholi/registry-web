PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assigned_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`term_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`semester_module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_assigned_modules`("id", "term_id", "user_id", "semester_module_id", "created_at") SELECT "id", "term_id", "user_id", "semester_module_id", "created_at" FROM `assigned_modules`;--> statement-breakpoint
DROP TABLE `assigned_modules`;--> statement-breakpoint
ALTER TABLE `__new_assigned_modules` RENAME TO `assigned_modules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;