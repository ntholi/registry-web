ALTER TABLE `lectures_modules` RENAME TO `lecturer_modules`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lecturer_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_lecturer_modules`("id", "user_id", "module_id", "created_at") SELECT "id", "user_id", "module_id", "created_at" FROM `lecturer_modules`;--> statement-breakpoint
DROP TABLE `lecturer_modules`;--> statement-breakpoint
ALTER TABLE `__new_lecturer_modules` RENAME TO `lecturer_modules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;