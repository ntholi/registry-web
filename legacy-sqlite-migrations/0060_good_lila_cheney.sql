CREATE TABLE `blocked_students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text DEFAULT 'blocked' NOT NULL,
	`by_department` text NOT NULL,
	`std_no` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade
);
