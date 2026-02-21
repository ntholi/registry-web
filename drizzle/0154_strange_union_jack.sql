ALTER TABLE "applicant_documents" ADD COLUMN "review_locked_by" text;--> statement-breakpoint
ALTER TABLE "applicant_documents" ADD COLUMN "review_locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "applicant_documents" ADD CONSTRAINT "applicant_documents_review_locked_by_users_id_fk" FOREIGN KEY ("review_locked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;