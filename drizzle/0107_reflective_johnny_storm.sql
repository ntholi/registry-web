ALTER TABLE "payment_transactions" DROP CONSTRAINT "payment_transactions_applicant_id_applicants_id_fk";
--> statement-breakpoint
DROP INDEX "fk_payment_transactions_applicant";--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN "application_id" text;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_payment_transactions_application" ON "payment_transactions" USING btree ("application_id");--> statement-breakpoint
ALTER TABLE "payment_transactions" DROP COLUMN "applicant_id";