ALTER TABLE "student_status_approvals" DROP CONSTRAINT "student_status_approvals_application_id_student_statuses_id_fk";--> statement-breakpoint
ALTER TABLE "student_status_approvals" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "student_status_approvals" ALTER COLUMN "application_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "student_statuses" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "student_status_approvals" ADD CONSTRAINT "student_status_approvals_application_id_student_statuses_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."student_statuses"("id") ON DELETE cascade ON UPDATE no action;