CREATE TYPE "public"."deposit_type" AS ENUM('bank_deposit', 'sales_receipt');--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "type" "deposit_type" DEFAULT 'bank_deposit' NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "receipt_number" text;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD COLUMN "payment_mode" text;