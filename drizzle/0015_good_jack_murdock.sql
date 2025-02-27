DROP INDEX `sponsored_students_sponsorId_stdNo_termId_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `sponsored_students_stdNo_termId_unique` ON `sponsored_students` (`std_no`,`term_id`);