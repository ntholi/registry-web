PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`semester_module_id` integer NOT NULL,
	`term_id` integer NOT NULL,
	`assessment_number` text NOT NULL,
	`assessment_type` text NOT NULL,
	`total_marks` real NOT NULL,
	`weight` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_assessments`("id", "semester_module_id", "term_id", "assessment_number", "assessment_type", "total_marks", "weight", "created_at") SELECT "id", "student_module_id", "term_id", "assessment_number", "assessment_type", "total_marks", "weight", "created_at" FROM `assessments`;--> statement-breakpoint
DROP TABLE `assessments`;--> statement-breakpoint
ALTER TABLE `__new_assessments` RENAME TO `assessments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;