CREATE TABLE `statement_of_results_prints` (
	`id` text PRIMARY KEY NOT NULL,
	`std_no` integer NOT NULL,
	`printed_by` text NOT NULL,
	`student_name` text NOT NULL,
	`program_name` text NOT NULL,
	`total_credits` integer NOT NULL,
	`total_modules` integer NOT NULL,
	`cgpa` real,
	`classification` text,
	`academic_status` text,
	`graduation_date` text,
	`printed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`printed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
