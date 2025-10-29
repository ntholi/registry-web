DROP INDEX IF EXISTS "assessments_moduleId_assessmentNumber_termId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "authenticators_credentialID_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "blocked_students_std_no_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "fortinet_registrations_stdNo_level_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "graduation_clearance_clearanceId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "graduation_requests_studentProgramId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "module_grades_moduleId_stdNo_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "module_prerequisites_semesterModuleId_prerequisiteId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "payment_receipts_receiptNo_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "programs_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "registration_clearance_registrationRequestId_clearanceId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "registration_requests_stdNo_termId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "schools_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "sponsored_students_sponsorId_stdNo_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "sponsored_terms_sponsoredStudentId_termId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "sponsors_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "structures_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "student_card_prints_receiptNo_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "terms_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "user_schools_userId_schoolId_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_unique";--> statement-breakpoint
ALTER TABLE `student_card_prints` ALTER COLUMN "receipt_no" TO "receipt_no" text NOT NULL DEFAULT 'initial';--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_moduleId_assessmentNumber_termId_unique` ON `assessments` (`module_id`,`assessment_number`,`term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `authenticators_credentialID_unique` ON `authenticators` (`credential_id`);--> statement-breakpoint
CREATE INDEX `blocked_students_std_no_idx` ON `blocked_students` (`std_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `fortinet_registrations_stdNo_level_unique` ON `fortinet_registrations` (`std_no`,`level`);--> statement-breakpoint
CREATE UNIQUE INDEX `graduation_clearance_clearanceId_unique` ON `graduation_clearance` (`clearance_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `graduation_requests_studentProgramId_unique` ON `graduation_requests` (`student_program_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `module_grades_moduleId_stdNo_unique` ON `module_grades` (`module_id`,`std_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `module_prerequisites_semesterModuleId_prerequisiteId_unique` ON `module_prerequisites` (`semester_module_id`,`prerequisite_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_receiptNo_unique` ON `payment_receipts` (`receipt_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `programs_code_unique` ON `programs` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `registration_clearance_registrationRequestId_clearanceId_unique` ON `registration_clearance` (`registration_request_id`,`clearance_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `registration_requests_stdNo_termId_unique` ON `registration_requests` (`std_no`,`term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schools_code_unique` ON `schools` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `sponsored_students_sponsorId_stdNo_unique` ON `sponsored_students` (`sponsor_id`,`std_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `sponsored_terms_sponsoredStudentId_termId_unique` ON `sponsored_terms` (`sponsored_student_id`,`term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sponsors_name_unique` ON `sponsors` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `structures_code_unique` ON `structures` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_card_prints_receiptNo_unique` ON `student_card_prints` (`receipt_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `terms_name_unique` ON `terms` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_schools_userId_schoolId_unique` ON `user_schools` (`user_id`,`school_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);