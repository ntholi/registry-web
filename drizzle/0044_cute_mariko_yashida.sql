PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_students` (
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
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_students`("std_no", "name", "national_id", "sem", "date_of_birth", "phone1", "phone2", "gender", "marital_status", "religion", "user_id", "created_at") SELECT "std_no", "name", "national_id", "sem", "date_of_birth", "phone1", "phone2", "gender", "marital_status", "religion", "user_id", "created_at" FROM `students`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
ALTER TABLE `__new_students` RENAME TO `students`;--> statement-breakpoint
PRAGMA foreign_keys=ON;