CREATE TABLE `sponsored_students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sponsor_id` integer NOT NULL,
	`std_no` integer NOT NULL,
	`borrower_no` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`sponsor_id`) REFERENCES `sponsors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sponsored_students_sponsorId_stdNo_unique` ON `sponsored_students` (`sponsor_id`,`std_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `sponsored_students_sponsorId_borrowerNo_unique` ON `sponsored_students` (`sponsor_id`,`borrower_no`);