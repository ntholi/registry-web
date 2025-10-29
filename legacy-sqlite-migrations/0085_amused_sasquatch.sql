CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`std_no` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade
);
