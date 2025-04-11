PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lecturer_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`semester_module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_lecturer_modules`("id", "user_id", "semester_module_id", "created_at") SELECT "id", "user_id", "module_id", "created_at" FROM `lecturer_modules`;--> statement-breakpoint
DROP TABLE `lecturer_modules`;--> statement-breakpoint
ALTER TABLE `__new_lecturer_modules` RENAME TO `lecturer_modules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_module_prerequisites` (
	`id` integer PRIMARY KEY NOT NULL,
	`semester_module_id` integer NOT NULL,
	`prerequisite_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prerequisite_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_module_prerequisites`("id", "semester_module_id", "prerequisite_id", "created_at") SELECT "id", "module_id", "prerequisite_id", "created_at" FROM `module_prerequisites`;--> statement-breakpoint
DROP TABLE `module_prerequisites`;--> statement-breakpoint
ALTER TABLE `__new_module_prerequisites` RENAME TO `module_prerequisites`;--> statement-breakpoint
CREATE UNIQUE INDEX `module_prerequisites_semesterModuleId_prerequisiteId_unique` ON `module_prerequisites` (`semester_module_id`,`prerequisite_id`);--> statement-breakpoint
CREATE TABLE `__new_requested_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_status` text DEFAULT 'Compulsory' NOT NULL,
	`registration_request_id` integer NOT NULL,
	`semester_module_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_requested_modules`("id", "module_status", "registration_request_id", "semester_module_id", "status", "created_at") SELECT "id", "module_status", "registration_request_id", "module_id", "status", "created_at" FROM `requested_modules`;--> statement-breakpoint
DROP TABLE `requested_modules`;--> statement-breakpoint
ALTER TABLE `__new_requested_modules` RENAME TO `requested_modules`;--> statement-breakpoint
CREATE TABLE `__new_student_modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`semester_module_id` integer NOT NULL,
	`status` text NOT NULL,
	`marks` text NOT NULL,
	`grade` text NOT NULL,
	`student_semester_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`semester_module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_semester_id`) REFERENCES `student_semesters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_student_modules`("id", "semester_module_id", "status", "marks", "grade", "student_semester_id", "created_at") SELECT "id", "module_id", "status", "marks", "grade", "module_id", "created_at" FROM `student_modules`;--> statement-breakpoint
DROP TABLE `student_modules`;--> statement-breakpoint
ALTER TABLE `__new_student_modules` RENAME TO `student_modules`;