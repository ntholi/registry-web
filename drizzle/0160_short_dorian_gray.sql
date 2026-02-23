ALTER TABLE "bank_deposits" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "review_locked_by" text;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "review_locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD CONSTRAINT "bank_deposits_review_locked_by_users_id_fk" FOREIGN KEY ("review_locked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;