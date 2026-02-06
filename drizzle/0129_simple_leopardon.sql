ALTER TABLE "registration_requests" DROP CONSTRAINT "registration_requests_stdNo_termId_unique";--> statement-breakpoint
ALTER TABLE "registration_requests" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_registration_requests_active" ON "registration_requests" USING btree ("std_no","term_id") WHERE "registration_requests"."deleted_at" IS NULL;