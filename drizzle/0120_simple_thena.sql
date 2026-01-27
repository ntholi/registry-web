ALTER TABLE "payment_receipts" ALTER COLUMN "receipt_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."receipt_type";--> statement-breakpoint
CREATE TYPE "public"."receipt_type" AS ENUM('graduation_gown', 'graduation_fee', 'student_card', 'repeat_module', 'late_registration', 'tuition_fee', 'library_fine', 'application_fee');--> statement-breakpoint
ALTER TABLE "payment_receipts" ALTER COLUMN "receipt_type" SET DATA TYPE "public"."receipt_type" USING "receipt_type"::"public"."receipt_type";