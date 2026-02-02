CREATE TYPE "public"."deposit_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mobile_provider" AS ENUM('mpesa', 'ecocash');--> statement-breakpoint
CREATE TABLE "admission_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"receipt_no" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admission_receipts_receiptNo_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "mobile_deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"receipt_id" text,
	"status" "deposit_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"mobile_number" text NOT NULL,
	"provider" "mobile_provider" NOT NULL,
	"client_reference" text NOT NULL,
	"provider_reference" text,
	"provider_response" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mobile_deposits_clientReference_unique" UNIQUE("client_reference")
);
--> statement-breakpoint
ALTER TABLE "application_receipts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_transactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "application_receipts" CASCADE;--> statement-breakpoint
DROP TABLE "payment_transactions" CASCADE;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "receipt_id" text;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "status" "deposit_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_receipts" ADD CONSTRAINT "admission_receipts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_deposits" ADD CONSTRAINT "mobile_deposits_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_deposits" ADD CONSTRAINT "mobile_deposits_receipt_id_admission_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."admission_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admission_receipts_receipt_no" ON "admission_receipts" USING btree ("receipt_no");--> statement-breakpoint
CREATE INDEX "fk_mobile_deposits_application" ON "mobile_deposits" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_mobile_deposits_status" ON "mobile_deposits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mobile_deposits_client_ref" ON "mobile_deposits" USING btree ("client_reference");--> statement-breakpoint
CREATE INDEX "fk_mobile_deposits_receipt" ON "mobile_deposits" USING btree ("receipt_id");--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD CONSTRAINT "bank_deposits_receipt_id_admission_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."admission_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bank_deposits_status" ON "bank_deposits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fk_bank_deposits_receipt" ON "bank_deposits" USING btree ("receipt_id");--> statement-breakpoint
DROP TYPE "public"."payment_provider";--> statement-breakpoint
DROP TYPE "public"."transaction_status";