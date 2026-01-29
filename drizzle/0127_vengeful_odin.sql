CREATE TABLE "academic_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"academic_record_id" text NOT NULL,
	"document_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_academic_record_id_academic_records_id_fk" FOREIGN KEY ("academic_record_id") REFERENCES "public"."academic_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_academic_documents_record" ON "academic_documents" USING btree ("academic_record_id");--> statement-breakpoint
CREATE INDEX "idx_academic_documents_document" ON "academic_documents" USING btree ("document_id");