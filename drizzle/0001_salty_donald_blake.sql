ALTER TABLE `programs` ADD `level` text NOT NULL;--> statement-breakpoint
ALTER TABLE `student_programs` ADD `program_id` integer NOT NULL REFERENCES programs(id);--> statement-breakpoint
ALTER TABLE `student_programs` DROP COLUMN `code`;--> statement-breakpoint
ALTER TABLE `student_programs` DROP COLUMN `name`;