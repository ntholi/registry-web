CREATE TABLE `academic_user_schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`academic_user_id` integer NOT NULL,
	`school_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academic_user_id`) REFERENCES `academic_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `academic_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'lecturer' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assigned_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`structure_semester_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`structure_semester_id`) REFERENCES `structure_semesters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_assigned_modules`("id", "module_id", "structure_semester_id", "created_at") SELECT "id", "module_id", "structure_semester_id", "created_at" FROM `assigned_modules`;--> statement-breakpoint
DROP TABLE `assigned_modules`;--> statement-breakpoint
ALTER TABLE `__new_assigned_modules` RENAME TO `assigned_modules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;