PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sponsored_students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sponsor_id` integer NOT NULL,
	`std_no` integer NOT NULL,
	`borrower_no` text,
	`term_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`sponsor_id`) REFERENCES `sponsors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sponsored_students`("id", "sponsor_id", "std_no", "borrower_no", "term_id", "created_at", "updated_at") SELECT "id", "sponsor_id", "std_no", "borrower_no", "term_id", "created_at", "updated_at" FROM `sponsored_students`;--> statement-breakpoint
DROP TABLE `sponsored_students`;--> statement-breakpoint
ALTER TABLE `__new_sponsored_students` RENAME TO `sponsored_students`;--> statement-breakpoint
PRAGMA foreign_keys=ON;