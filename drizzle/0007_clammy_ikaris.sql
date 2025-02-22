PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`semester` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
INSERT INTO `__new_terms`("id", "name", "is_active", "semester", "created_at") SELECT "id", "name", "is_active", "semester", "created_at" FROM `terms`;--> statement-breakpoint
DROP TABLE `terms`;--> statement-breakpoint
ALTER TABLE `__new_terms` RENAME TO `terms`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `terms_name_unique` ON `terms` (`name`);