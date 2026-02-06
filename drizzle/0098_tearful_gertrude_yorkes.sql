CREATE TABLE "library_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "resource_type" NOT NULL,
	"is_downloadable" boolean DEFAULT true NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "digital_resources" CASCADE;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_library_resources_title_trgm" ON "library_resources" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_library_resources_type" ON "library_resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_library_resources_uploaded_by" ON "library_resources" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "fk_library_resources_document" ON "library_resources" USING btree ("document_id");