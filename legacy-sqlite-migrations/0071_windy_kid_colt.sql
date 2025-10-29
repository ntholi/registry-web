CREATE TABLE `graduation_clearance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`graduation_request_id` integer NOT NULL,
	`clearance_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`graduation_request_id`) REFERENCES `graduation_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clearance_id`) REFERENCES `clearance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `graduation_clearance_clearanceId_unique` ON `graduation_clearance` (`clearance_id`);--> statement-breakpoint
CREATE TABLE `graduation_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`std_no` integer NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	FOREIGN KEY (`std_no`) REFERENCES `students`(`std_no`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `graduation_requests_std_no_unique` ON `graduation_requests` (`std_no`);--> statement-breakpoint
CREATE TABLE `payment_receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`graduation_request_id` integer NOT NULL,
	`payment_type` text NOT NULL,
	`receipt_no` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`graduation_request_id`) REFERENCES `graduation_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
