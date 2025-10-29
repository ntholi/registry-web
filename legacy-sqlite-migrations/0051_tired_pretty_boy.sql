CREATE TABLE `module_grades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`std_no` integer NOT NULL,
	`grade` text NOT NULL,
	`weighted_total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `module_grades_moduleId_stdNo_unique` ON `module_grades` (`module_id`,`std_no`);--> statement-breakpoint
DROP TABLE `assessment_grades`;