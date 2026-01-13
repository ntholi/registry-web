CREATE TABLE "publication_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"term_code" text NOT NULL,
	"file_name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "publication_attachments" ADD CONSTRAINT "publication_attachments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;