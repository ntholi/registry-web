ALTER TABLE "intake_periods" RENAME COLUMN "application_fee" TO "local_application_fee";--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "is_mosotho" boolean;--> statement-breakpoint
ALTER TABLE "intake_periods" ADD COLUMN "international_application_fee" numeric(10, 2);--> statement-breakpoint
UPDATE "intake_periods" SET "international_application_fee" = 600;--> statement-breakpoint
ALTER TABLE "intake_periods" ALTER COLUMN "international_application_fee" SET NOT NULL;