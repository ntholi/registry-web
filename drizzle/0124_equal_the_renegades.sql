CREATE TABLE "document_stamps" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"date" text,
	"name" text,
	"title" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "document_stamps" ADD CONSTRAINT "document_stamps_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_document_stamps_document" ON "document_stamps" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_stamps_date" ON "document_stamps" USING btree ("date");