-- Drop foreign key constraints first
ALTER TABLE "subject_grades" DROP CONSTRAINT IF EXISTS "subject_grades_academic_record_id_academic_records_id_fk";--> statement-breakpoint
ALTER TABLE "subject_grades" DROP CONSTRAINT IF EXISTS "subject_grades_subject_id_subjects_id_fk";--> statement-breakpoint
ALTER TABLE "academic_records" DROP CONSTRAINT IF EXISTS "academic_records_certificate_type_id_certificate_types_id_fk";--> statement-breakpoint
ALTER TABLE "guardian_phones" DROP CONSTRAINT IF EXISTS "guardian_phones_guardian_id_guardians_id_fk";--> statement-breakpoint
ALTER TABLE "application_notes" DROP CONSTRAINT IF EXISTS "application_notes_application_id_applications_id_fk";--> statement-breakpoint
ALTER TABLE "application_receipts" DROP CONSTRAINT IF EXISTS "application_receipts_application_id_applications_id_fk";--> statement-breakpoint
ALTER TABLE "application_status_history" DROP CONSTRAINT IF EXISTS "application_status_history_application_id_applications_id_fk";--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_intake_period_id_intake_periods_id_fk";--> statement-breakpoint
ALTER TABLE "grade_mappings" DROP CONSTRAINT IF EXISTS "grade_mappings_certificate_type_id_certificate_types_id_fk";--> statement-breakpoint
ALTER TABLE "entry_requirements" DROP CONSTRAINT IF EXISTS "entry_requirements_certificate_type_id_certificate_types_id_fk";--> statement-breakpoint
ALTER TABLE "subject_aliases" DROP CONSTRAINT IF EXISTS "subject_aliases_subject_id_subjects_id_fk";--> statement-breakpoint

-- Convert all columns to text
ALTER TABLE "academic_records" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "academic_records" ALTER COLUMN "certificate_type_id" SET DATA TYPE text USING certificate_type_id::text;--> statement-breakpoint
ALTER TABLE "subject_grades" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "subject_grades" ALTER COLUMN "academic_record_id" SET DATA TYPE text USING academic_record_id::text;--> statement-breakpoint
ALTER TABLE "subject_grades" ALTER COLUMN "subject_id" SET DATA TYPE text USING subject_id::text;--> statement-breakpoint
ALTER TABLE "applicant_phones" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "guardian_phones" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "guardian_phones" ALTER COLUMN "guardian_id" SET DATA TYPE text USING guardian_id::text;--> statement-breakpoint
ALTER TABLE "guardians" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "application_notes" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "application_notes" ALTER COLUMN "application_id" SET DATA TYPE text USING application_id::text;--> statement-breakpoint
ALTER TABLE "application_receipts" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "application_receipts" ALTER COLUMN "application_id" SET DATA TYPE text USING application_id::text;--> statement-breakpoint
ALTER TABLE "application_status_history" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "application_status_history" ALTER COLUMN "application_id" SET DATA TYPE text USING application_id::text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "intake_period_id" SET DATA TYPE text USING intake_period_id::text;--> statement-breakpoint
ALTER TABLE "certificate_types" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "grade_mappings" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "grade_mappings" ALTER COLUMN "certificate_type_id" SET DATA TYPE text USING certificate_type_id::text;--> statement-breakpoint
ALTER TABLE "entry_requirements" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "entry_requirements" ALTER COLUMN "certificate_type_id" SET DATA TYPE text USING certificate_type_id::text;--> statement-breakpoint
ALTER TABLE "intake_periods" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "subject_aliases" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "subject_aliases" ALTER COLUMN "subject_id" SET DATA TYPE text USING subject_id::text;--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint

-- Re-add foreign key constraints
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_academic_record_id_academic_records_id_fk" FOREIGN KEY ("academic_record_id") REFERENCES "academic_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "academic_records" ADD CONSTRAINT "academic_records_certificate_type_id_certificate_types_id_fk" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "guardian_phones" ADD CONSTRAINT "guardian_phones_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "application_receipts" ADD CONSTRAINT "application_receipts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_intake_period_id_intake_periods_id_fk" FOREIGN KEY ("intake_period_id") REFERENCES "intake_periods"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "grade_mappings" ADD CONSTRAINT "grade_mappings_certificate_type_id_certificate_types_id_fk" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "entry_requirements" ADD CONSTRAINT "entry_requirements_certificate_type_id_certificate_types_id_fk" FOREIGN KEY ("certificate_type_id") REFERENCES "certificate_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "subject_aliases" ADD CONSTRAINT "subject_aliases_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;