-- Create the new sponsored_terms table
CREATE TABLE `sponsored_terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sponsored_student_id` integer NOT NULL,
	`term_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`sponsored_student_id`) REFERENCES `sponsored_students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Create unique index for sponsored_terms
CREATE UNIQUE INDEX `sponsored_terms_sponsoredStudentId_termId_unique` ON `sponsored_terms` (`sponsored_student_id`,`term_id`);
--> statement-breakpoint

-- Migrate existing data from sponsored_students to sponsored_terms
INSERT INTO `sponsored_terms` (`sponsored_student_id`, `term_id`, `created_at`, `updated_at`)
SELECT `id`, `term_id`, `created_at`, `updated_at` FROM `sponsored_students`;
--> statement-breakpoint

-- Remove the term_id column from sponsored_students using PRAGMA approach
PRAGMA foreign_keys=OFF;
--> statement-breakpoint

-- Drop the old unique index
DROP INDEX `sponsored_students_stdNo_termId_unique`;
--> statement-breakpoint

CREATE TABLE `__new_sponsored_students` (
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

INSERT INTO `__new_sponsored_students`(`id`, `sponsor_id`, `std_no`, `borrower_no`, `created_at`, `updated_at`) 
SELECT `id`, `sponsor_id`, `std_no`, `borrower_no`, `created_at`, `updated_at` FROM `sponsored_students`;
--> statement-breakpoint

DROP TABLE `sponsored_students`;
--> statement-breakpoint

ALTER TABLE `__new_sponsored_students` RENAME TO `sponsored_students`;
--> statement-breakpoint

CREATE UNIQUE INDEX `sponsored_students_sponsorId_stdNo_unique` ON `sponsored_students` (`sponsor_id`,`std_no`);
--> statement-breakpoint

PRAGMA foreign_keys=ON;