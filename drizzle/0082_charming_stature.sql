ALTER TYPE "public"."document_category" RENAME TO "document_type";--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"std_no" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_std_no_students_std_no_fk";
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_type";--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('identity', 'certificate', 'transcript', 'proof_of_payment', 'passport_photo', 'recommendation_letter', 'personal_statement', 'medical_report', 'enrollment_letter', 'academic_record', 'clearance_form', 'other');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "type" SET DATA TYPE "public"."document_type" USING "type"::"public"."document_type";--> statement-breakpoint
DROP INDEX "idx_applicant_documents_category";--> statement-breakpoint
DROP INDEX "fk_documents_std_no";--> statement-breakpoint
ALTER TABLE "applicant_documents" ADD COLUMN "document_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_student_documents_document" ON "student_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "fk_student_documents_std_no" ON "student_documents" USING btree ("std_no");--> statement-breakpoint
ALTER TABLE "applicant_documents" ADD CONSTRAINT "applicant_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_applicant_documents_document" ON "applicant_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("type");--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "applicant_documents" DROP COLUMN "upload_date";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "std_no";