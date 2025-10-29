CREATE TABLE `student_card_prints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text DEFAULT 'Initial Print' NOT NULL,
	`std_no` integer NOT NULL,
	`printed_by` text NOT NULL,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`printed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_card_prints_reference_unique` ON `student_card_prints` (`reference`);