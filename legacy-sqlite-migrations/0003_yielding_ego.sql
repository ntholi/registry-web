DROP INDEX IF EXISTS "authenticators_credentialID_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "module_prerequisites_moduleId_prerequisiteId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "programs_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "registration_clearances_registrationRequestId_department_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "registration_requests_std_no_term_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "schools_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "sponsors_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "structures_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "terms_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_unique";--> statement-breakpoint
ALTER TABLE `sponsors` ALTER COLUMN "name" TO "name" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `authenticators_credentialID_unique` ON `authenticators` (`credential_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `module_prerequisites_moduleId_prerequisiteId_unique` ON `module_prerequisites` (`module_id`,`prerequisite_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `programs_code_unique` ON `programs` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `registration_clearances_registrationRequestId_department_unique` ON `registration_clearances` (`registration_request_id`,`department`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `registration_requests_std_no_term_id_unique` ON `registration_requests` (`std_no`,`term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `schools_code_unique` ON `schools` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sponsors_name_unique` ON `sponsors` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `structures_code_unique` ON `structures` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `terms_name_unique` ON `terms` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);