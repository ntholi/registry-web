CREATE TABLE `accounts` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `authenticators` (
	`credential_id` text NOT NULL,
	`user_id` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`credential_public_key` text NOT NULL,
	`counter` integer NOT NULL,
	`credential_device_type` text NOT NULL,
	`credential_backed_up` integer NOT NULL,
	`transports` text,
	PRIMARY KEY(`user_id`, `credential_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authenticators_credentialID_unique` ON `authenticators` (`credential_id`);--> statement-breakpoint
CREATE TABLE `module_prerequisites` (
	`id` integer PRIMARY KEY NOT NULL,
	`module_id` integer NOT NULL,
	`prerequisite_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prerequisite_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `module_prerequisites_moduleId_prerequisiteId_unique` ON `module_prerequisites` (`module_id`,`prerequisite_id`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`credits` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`school_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `programs_code_unique` ON `programs` (`code`);--> statement-breakpoint
CREATE TABLE `registration_clearance_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_clearance_id` integer NOT NULL,
	`previous_status` text,
	`new_status` text NOT NULL,
	`created_by` text NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	`message` text,
	`modules` text DEFAULT (json_array()) NOT NULL,
	FOREIGN KEY (`registration_clearance_id`) REFERENCES `registration_clearances`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `registration_clearances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_request_id` integer NOT NULL,
	`department` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`responded_by` text,
	`response_date` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`responded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_clearances_registrationRequestId_department_unique` ON `registration_clearances` (`registration_request_id`,`department`);--> statement-breakpoint
CREATE TABLE `registration_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`std_no` integer NOT NULL,
	`term_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_requests_std_no_term_id_unique` ON `registration_requests` (`std_no`,`term_id`);--> statement-breakpoint
CREATE TABLE `requested_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_status` text DEFAULT 'Compulsory' NOT NULL,
	`registration_request_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_code_unique` ON `schools` (`code`);--> statement-breakpoint
CREATE TABLE `semester_modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`semester_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`semester_id`) REFERENCES `structure_semesters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `signups` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`std_no` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text DEFAULT 'Pending approval',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `structure_semesters` (
	`id` integer PRIMARY KEY NOT NULL,
	`structure_id` integer NOT NULL,
	`semester_number` integer NOT NULL,
	`name` text NOT NULL,
	`total_credits` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`structure_id`) REFERENCES `structures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `structures` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`program_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `structures_code_unique` ON `structures` (`code`);--> statement-breakpoint
CREATE TABLE `student_modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`module_id` integer NOT NULL,
	`status` text NOT NULL,
	`marks` text NOT NULL,
	`grade` text NOT NULL,
	`student_semester_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_semester_id`) REFERENCES `student_semesters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_programs` (
	`id` integer PRIMARY KEY NOT NULL,
	`std_no` integer NOT NULL,
	`start_term` text,
	`structure_id` integer NOT NULL,
	`stream` text,
	`status` text NOT NULL,
	`assist_provider` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`structure_id`) REFERENCES `structures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_semesters` (
	`id` integer PRIMARY KEY NOT NULL,
	`term` text NOT NULL,
	`semester_number` integer,
	`status` text NOT NULL,
	`student_program_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_program_id`) REFERENCES `student_programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `students` (
	`std_no` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`national_id` text NOT NULL,
	`sem` integer NOT NULL,
	`date_of_birth` integer,
	`phone1` text,
	`phone2` text,
	`gender` text,
	`marital_status` text,
	`religion` text,
	`structure_id` integer,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`structure_id`) REFERENCES `structures`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `terms_name_unique` ON `terms` (`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`email` text,
	`email_verified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
