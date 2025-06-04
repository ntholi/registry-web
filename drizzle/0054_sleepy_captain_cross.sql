CREATE TABLE `assessments_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_id` integer NOT NULL,
	`action` text NOT NULL,
	`previous_assessment_number` text,
	`new_assessment_number` text,
	`previous_assessment_type` text,
	`new_assessment_type` text,
	`previous_total_marks` real,
	`new_total_marks` real,
	`previous_weight` real,
	`new_weight` real,
	`created_by` text NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
