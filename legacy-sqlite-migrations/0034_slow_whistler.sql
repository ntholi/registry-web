DROP TABLE `assigned_program_modules`;--> statement-breakpoint
ALTER TABLE `assigned_modules` ADD `structure_semester_id` integer NOT NULL REFERENCES structure_semesters(id);