PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_student_card_prints` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text DEFAULT 'Initial Print' NOT NULL,
	`std_no` integer NOT NULL,
	`printed_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`printed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_student_card_prints`("id", "reference", "std_no", "printed_by", "created_at") SELECT "id", "reference", "std_no", "printed_by", "created_at" FROM `student_card_prints`;--> statement-breakpoint
DROP TABLE `student_card_prints`;--> statement-breakpoint
ALTER TABLE `__new_student_card_prints` RENAME TO `student_card_prints`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `student_card_prints_reference_unique` ON `student_card_prints` (`reference`);