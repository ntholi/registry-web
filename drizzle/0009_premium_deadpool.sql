PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_registration_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sponsor_id` integer NOT NULL,
	`std_no` integer NOT NULL,
	`term_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`semester_status` text NOT NULL,
	`semester_number` integer NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`date_approved` integer,
	FOREIGN KEY (`sponsor_id`) REFERENCES `sponsors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_registration_requests`("id", "sponsor_id", "std_no", "term_id", "status", "semester_status", "semester_number", "message", "created_at", "updated_at", "date_approved") SELECT "id", "sponsor_id", "std_no", "term_id", "status", "semester_status", "semester_number", "message", "created_at", "updated_at", "date_approved" FROM `registration_requests`;--> statement-breakpoint
DROP TABLE `registration_requests`;--> statement-breakpoint
ALTER TABLE `__new_registration_requests` RENAME TO `registration_requests`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `registration_requests_std_no_term_id_unique` ON `registration_requests` (`std_no`,`term_id`);