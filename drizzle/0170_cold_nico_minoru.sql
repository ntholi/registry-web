CREATE TYPE "public"."student_status_approval_role" AS ENUM('year_leader', 'program_leader', 'student_services', 'finance');--> statement-breakpoint
CREATE TYPE "public"."student_status_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."student_status_justification" AS ENUM('medical', 'transfer', 'financial', 'employment', 'after_withdrawal', 'after_deferment', 'failed_modules', 'upgrading', 'other');--> statement-breakpoint
CREATE TYPE "public"."student_status_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."student_status_type" AS ENUM('withdrawal', 'deferment', 'reinstatement');--> statement-breakpoint
CREATE TABLE "student_status_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"approver_role" "student_status_approval_role" NOT NULL,
	"status" "student_status_approval_status" DEFAULT 'pending' NOT NULL,
	"responded_by" text,
	"message" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_student_status_approvals_app_role" UNIQUE("application_id","approver_role")
);
--> statement-breakpoint
CREATE TABLE "student_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"type" "student_status_type" NOT NULL,
	"status" "student_status_status" DEFAULT 'pending' NOT NULL,
	"justification" "student_status_justification" NOT NULL,
	"notes" text,
	"term_code" text NOT NULL,
	"semester_id" integer,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "student_status_approvals" ADD CONSTRAINT "student_status_approvals_application_id_student_statuses_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."student_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_status_approvals" ADD CONSTRAINT "student_status_approvals_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_statuses" ADD CONSTRAINT "student_statuses_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_statuses" ADD CONSTRAINT "student_statuses_semester_id_student_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."student_semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_statuses" ADD CONSTRAINT "student_statuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_student_status_approvals_app_id" ON "student_status_approvals" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_student_status_approvals_status" ON "student_status_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_student_status_approvals_role" ON "student_status_approvals" USING btree ("approver_role");--> statement-breakpoint
CREATE INDEX "idx_student_statuses_std_no" ON "student_statuses" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_student_statuses_status" ON "student_statuses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_student_statuses_type" ON "student_statuses" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_student_statuses_term" ON "student_statuses" USING btree ("term_code");