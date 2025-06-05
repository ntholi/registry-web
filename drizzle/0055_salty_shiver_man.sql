PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assessment_marks_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_mark_id` integer,
	`action` text NOT NULL,
	`previous_marks` real,
	`new_marks` real,
	`created_by` text NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`assessment_mark_id`) REFERENCES `assessment_marks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_assessment_marks_audit`("id", "assessment_mark_id", "action", "previous_marks", "new_marks", "created_by", "date") SELECT "id", "assessment_mark_id", "action", "previous_marks", "new_marks", "created_by", "date" FROM `assessment_marks_audit`;--> statement-breakpoint
DROP TABLE `assessment_marks_audit`;--> statement-breakpoint
ALTER TABLE `__new_assessment_marks_audit` RENAME TO `assessment_marks_audit`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_assessments_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_id` integer,
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
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_assessments_audit`("id", "assessment_id", "action", "previous_assessment_number", "new_assessment_number", "previous_assessment_type", "new_assessment_type", "previous_total_marks", "new_total_marks", "previous_weight", "new_weight", "created_by", "date") SELECT "id", "assessment_id", "action", "previous_assessment_number", "new_assessment_number", "previous_assessment_type", "new_assessment_type", "previous_total_marks", "new_total_marks", "previous_weight", "new_weight", "created_by", "date" FROM `assessments_audit`;--> statement-breakpoint
DROP TABLE `assessments_audit`;--> statement-breakpoint
ALTER TABLE `__new_assessments_audit` RENAME TO `assessments_audit`;