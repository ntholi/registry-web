CREATE TYPE "public"."payment_provider" AS ENUM('mpesa', 'ecocash');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
ALTER TYPE "public"."receipt_type" ADD VALUE 'application_fee';--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"mobile_number" text NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"client_reference" text NOT NULL,
	"provider_reference" text,
	"provider_response" json,
	"manual_reference" text,
	"marked_paid_by" text,
	"receipt_number" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_transactions_clientReference_unique" UNIQUE("client_reference")
);
--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_marked_paid_by_users_id_fk" FOREIGN KEY ("marked_paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_payment_transactions_applicant" ON "payment_transactions" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_status" ON "payment_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_client_ref" ON "payment_transactions" USING btree ("client_reference");