CREATE TABLE `modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`timestamp` text
);
--> statement-breakpoint
ALTER TABLE `semester_modules` ADD `module_id` integer REFERENCES modules(id);--> statement-breakpoint
ALTER TABLE `semester_modules` DROP COLUMN `code`;--> statement-breakpoint
ALTER TABLE `semester_modules` DROP COLUMN `name`;