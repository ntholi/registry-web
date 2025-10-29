DROP INDEX `graduation_requests_std_no_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `graduation_requests_stdNo_unique` ON `graduation_requests` (`std_no`);--> statement-breakpoint
DROP INDEX `registration_requests_std_no_term_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `registration_requests_stdNo_termId_unique` ON `registration_requests` (`std_no`,`term_id`);