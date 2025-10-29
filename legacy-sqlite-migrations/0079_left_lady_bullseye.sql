CREATE TABLE `fortinet_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`std_no` integer NOT NULL,
	`school_id` integer NOT NULL,
	`level` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fortinet_registrations_stdNo_level_unique` ON `fortinet_registrations` (`std_no`,`level`);