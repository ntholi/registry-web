DROP INDEX `sponsored_students_sponsorId_stdNo_unique`;--> statement-breakpoint
DROP INDEX `sponsored_students_sponsorId_borrowerNo_unique`;--> statement-breakpoint
ALTER TABLE `sponsored_students` ADD `term_id` integer DEFAULT 1 REFERENCES terms(id);