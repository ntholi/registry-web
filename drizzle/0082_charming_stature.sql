-- First, create the new document_type enum
CREATE TYPE "public"."document_type" AS ENUM('identity', 'certificate', 'transcript', 'proof_of_payment', 'passport_photo', 'recommendation_letter', 'personal_statement', 'medical_report', 'enrollment_letter', 'academic_record', 'clearance_form', 'other');--> statement-breakpoint

-- Create student_documents table
CREATE TABLE "student_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"std_no" bigint NOT NULL
);
--> statement-breakpoint

-- Drop foreign key constraint from documents to students
ALTER TABLE "documents" DROP CONSTRAINT "documents_std_no_students_std_no_fk";
--> statement-breakpoint

-- Convert documents.type from text to new enum
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE "public"."document_type" USING "type"::"public"."document_type";--> statement-breakpoint

-- Add file_url column to documents
ALTER TABLE "documents" ADD COLUMN "file_url" text;--> statement-breakpoint

-- Drop indexes that reference columns being removed
DROP INDEX "idx_applicant_documents_category";--> statement-breakpoint
DROP INDEX "fk_documents_std_no";--> statement-breakpoint

-- Add document_id column to applicant_documents (nullable first for data migration)
ALTER TABLE "applicant_documents" ADD COLUMN "document_id" text;--> statement-breakpoint

-- Migrate existing applicant_documents to use documents table
INSERT INTO "documents" ("id", "file_name", "file_url", "type")
SELECT 
    id || '_doc', 
    file_name, 
    file_url, 
    CASE category::text
        WHEN 'identity' THEN 'identity'::document_type
        WHEN 'certificate' THEN 'certificate'::document_type
        WHEN 'transcript' THEN 'transcript'::document_type
        WHEN 'proof_of_payment' THEN 'proof_of_payment'::document_type
        WHEN 'passport_photo' THEN 'passport_photo'::document_type
        WHEN 'recommendation_letter' THEN 'recommendation_letter'::document_type
        WHEN 'personal_statement' THEN 'personal_statement'::document_type
        WHEN 'medical_report' THEN 'medical_report'::document_type
        WHEN 'enrollment_letter' THEN 'enrollment_letter'::document_type
        WHEN 'academic_record' THEN 'academic_record'::document_type
        WHEN 'clearance_form' THEN 'clearance_form'::document_type
        ELSE 'other'::document_type
    END
FROM "applicant_documents";--> statement-breakpoint

-- Set document_id references
UPDATE "applicant_documents" SET document_id = id || '_doc';--> statement-breakpoint

-- Make document_id NOT NULL
ALTER TABLE "applicant_documents" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_documents" ADD CONSTRAINT "applicant_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Create indexes
CREATE INDEX "fk_student_documents_document" ON "student_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "fk_student_documents_std_no" ON "student_documents" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "fk_applicant_documents_document" ON "applicant_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("type");--> statement-breakpoint

-- Drop old columns from applicant_documents
ALTER TABLE "applicant_documents" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "upload_date";--> statement-breakpoint

-- Drop std_no from documents
ALTER TABLE "documents" DROP COLUMN "std_no";--> statement-breakpoint

-- Drop the old document_category enum
DROP TYPE "public"."document_category";