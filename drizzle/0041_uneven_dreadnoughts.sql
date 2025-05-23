DROP INDEX `assessments_moduleId_termId_assessmentNumber_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_moduleId_termId_unique` ON `assessments` (`module_id`,`term_id`);--> statement-breakpoint
ALTER TABLE `student_programs` ADD `intake_date` text;--> statement-breakpoint
ALTER TABLE `student_programs` ADD `reg_date` text;--> statement-breakpoint
ALTER TABLE `student_programs` ADD `graduation_date` text;