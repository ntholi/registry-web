ALTER TABLE "mail_queue" ALTER COLUMN "trigger_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mail_sent_log" ALTER COLUMN "trigger_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "mail_trigger_settings" ALTER COLUMN "trigger_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."mail_trigger_type";--> statement-breakpoint
CREATE TYPE "public"."mail_trigger_type" AS ENUM('student_status_created', 'student_status_updated', 'student_status_approved', 'student_status_rejected', 'notification_mirror', 'manual', 'reply', 'referral_created', 'registration_clearance_approved', 'registration_clearance_rejected', 'graduation_clearance_approved', 'graduation_clearance_rejected');--> statement-breakpoint
ALTER TABLE "mail_queue" ALTER COLUMN "trigger_type" SET DATA TYPE "public"."mail_trigger_type" USING "trigger_type"::"public"."mail_trigger_type";--> statement-breakpoint
ALTER TABLE "mail_sent_log" ALTER COLUMN "trigger_type" SET DATA TYPE "public"."mail_trigger_type" USING "trigger_type"::"public"."mail_trigger_type";--> statement-breakpoint
ALTER TABLE "mail_trigger_settings" ALTER COLUMN "trigger_type" SET DATA TYPE "public"."mail_trigger_type" USING "trigger_type"::"public"."mail_trigger_type";