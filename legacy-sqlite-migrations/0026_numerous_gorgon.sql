ALTER TABLE `modules` RENAME TO `semester_modules`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_semester_modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`credits` real NOT NULL,
	`semester_id` integer,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`semester_id`) REFERENCES `structure_semesters`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_semester_modules`("id", "code", "name", "type", "credits", "semester_id", "hidden", "created_at") SELECT "id", "code", "name", "type", "credits", "semester_id", "hidden", "created_at" FROM `semester_modules`;--> statement-breakpoint
DROP TABLE `semester_modules`;--> statement-breakpoint
ALTER TABLE `__new_semester_modules` RENAME TO `semester_modules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_lecturer_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_lecturer_modules`("id", "user_id", "module_id", "created_at") SELECT "id", "user_id", "module_id", "created_at" FROM `lecturer_modules`;--> statement-breakpoint
DROP TABLE `lecturer_modules`;--> statement-breakpoint
ALTER TABLE `__new_lecturer_modules` RENAME TO `lecturer_modules`;--> statement-breakpoint
CREATE TABLE `__new_module_prerequisites` (
	`id` integer PRIMARY KEY NOT NULL,
	`module_id` integer NOT NULL,
	`prerequisite_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prerequisite_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_module_prerequisites`("id", "module_id", "prerequisite_id", "created_at") SELECT "id", "module_id", "prerequisite_id", "created_at" FROM `module_prerequisites`;--> statement-breakpoint
DROP TABLE `module_prerequisites`;--> statement-breakpoint
ALTER TABLE `__new_module_prerequisites` RENAME TO `module_prerequisites`;--> statement-breakpoint
CREATE UNIQUE INDEX `module_prerequisites_moduleId_prerequisiteId_unique` ON `module_prerequisites` (`module_id`,`prerequisite_id`);--> statement-breakpoint
CREATE TABLE `__new_requested_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_status` text DEFAULT 'Compulsory' NOT NULL,
	`registration_request_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_requested_modules`("id", "module_status", "registration_request_id", "module_id", "status", "created_at") SELECT "id", "module_status", "registration_request_id", "module_id", "status", "created_at" FROM `requested_modules`;--> statement-breakpoint
DROP TABLE `requested_modules`;--> statement-breakpoint
ALTER TABLE `__new_requested_modules` RENAME TO `requested_modules`;--> statement-breakpoint
CREATE TABLE `__new_student_modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`module_id` integer NOT NULL,
	`status` text NOT NULL,
	`marks` text NOT NULL,
	`grade` text NOT NULL,
	`student_semester_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `semester_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_semester_id`) REFERENCES `student_semesters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_student_modules`("id", "module_id", "status", "marks", "grade", "student_semester_id", "created_at") SELECT "id", "module_id", "status", "marks", "grade", "student_semester_id", "created_at" FROM `student_modules`;--> statement-breakpoint
DROP TABLE `student_modules`;--> statement-breakpoint
ALTER TABLE `__new_student_modules` RENAME TO `student_modules`;