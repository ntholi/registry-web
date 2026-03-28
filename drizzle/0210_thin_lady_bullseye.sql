CREATE TYPE "public"."referral_session_type" AS ENUM('individual_counseling', 'group_counseling', 'follow_up', 'assessment', 'intervention');--> statement-breakpoint
CREATE TYPE "public"."student_referral_reason" AS ENUM('counseling', 'poor_performance', 'poor_attendance', 'misconduct', 'health_concerns', 'financial_issues', 'other');--> statement-breakpoint
CREATE TYPE "public"."student_referral_status" AS ENUM('pending', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
ALTER TYPE "public"."mail_trigger_type" ADD VALUE 'referral_created';--> statement-breakpoint
CREATE TABLE "referral_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_id" text NOT NULL,
	"session_date" text NOT NULL,
	"session_type" "referral_session_type" NOT NULL,
	"notes" text NOT NULL,
	"conducted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"reason" "student_referral_reason" NOT NULL,
	"other_reason" text,
	"description" text NOT NULL,
	"status" "student_referral_status" DEFAULT 'pending' NOT NULL,
	"resolution_summary" text,
	"referred_by" text NOT NULL,
	"assigned_to" text,
	"closed_at" timestamp,
	"closed_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "referral_sessions" ADD CONSTRAINT "referral_sessions_referral_id_student_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."student_referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_sessions" ADD CONSTRAINT "referral_sessions_conducted_by_users_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_referrals" ADD CONSTRAINT "student_referrals_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_referrals" ADD CONSTRAINT "student_referrals_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_referrals" ADD CONSTRAINT "student_referrals_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_referrals" ADD CONSTRAINT "student_referrals_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_referrals_std_no_idx" ON "student_referrals" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "student_referrals_status_idx" ON "student_referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "student_referrals_referred_by_idx" ON "student_referrals" USING btree ("referred_by");