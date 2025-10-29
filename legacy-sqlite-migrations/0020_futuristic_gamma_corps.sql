CREATE TABLE `assessment_marks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_id` integer NOT NULL,
	`std_no` integer NOT NULL,
	`marks` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_module_id` integer NOT NULL,
	`term_id` integer NOT NULL,
	`assessment_number` text NOT NULL,
	`assessment_type` integer NOT NULL,
	`total_marks` real NOT NULL,
	`weight` real NOT NULL,
	`code` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_module_id`) REFERENCES `student_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
