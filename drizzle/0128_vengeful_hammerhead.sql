ALTER TABLE "academic_documents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "academic_documents" CASCADE;--> statement-breakpoint
ALTER TABLE "academic_records" ADD COLUMN "applicant_document_id" text;--> statement-breakpoint
ALTER TABLE "academic_records" ADD CONSTRAINT "academic_records_applicant_document_id_applicant_documents_id_fk" FOREIGN KEY ("applicant_document_id") REFERENCES "public"."applicant_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_academic_records_applicant_document" ON "academic_records" USING btree ("applicant_document_id");