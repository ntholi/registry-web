CREATE TABLE `assessment_marks_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_mark_id` integer NOT NULL,
	`action` text NOT NULL,
	`previous_marks` real,
	`new_marks` real,
	`created_by` text NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	`message` text,
	FOREIGN KEY (`assessment_mark_id`) REFERENCES `assessment_marks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
