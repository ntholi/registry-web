DROP TABLE `academic_users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_academic_user_schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`academic_user_id` integer NOT NULL,
	`school_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academic_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_academic_user_schools`("id", "academic_user_id", "school_id", "created_at") SELECT "id", "academic_user_id", "school_id", "created_at" FROM `academic_user_schools`;--> statement-breakpoint
DROP TABLE `academic_user_schools`;--> statement-breakpoint
ALTER TABLE `__new_academic_user_schools` RENAME TO `academic_user_schools`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_assigned_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`academic_user_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`structure_semester_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`academic_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`structure_semester_id`) REFERENCES `structure_semesters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_assigned_modules`("id", "academic_user_id", "module_id", "structure_semester_id", "created_at") SELECT "id", "academic_user_id", "module_id", "structure_semester_id", "created_at" FROM `assigned_modules`;--> statement-breakpoint
DROP TABLE `assigned_modules`;--> statement-breakpoint
ALTER TABLE `__new_assigned_modules` RENAME TO `assigned_modules`;--> statement-breakpoint
ALTER TABLE `users` ADD `academic_role` text;