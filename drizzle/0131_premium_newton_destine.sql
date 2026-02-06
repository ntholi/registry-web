-- Migrate existing 'transcript' entries to 'academic_record' before changing the enum
UPDATE "documents" SET "type" = 'academic_record' WHERE "type" = 'transcript';--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_type";--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('identity', 'certificate', 'academic_record', 'proof_of_payment', 'passport_photo', 'recommendation_letter', 'personal_statement', 'medical_report', 'enrollment_letter', 'clearance_form', 'other');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE "public"."document_type" USING "type"::"public"."document_type";