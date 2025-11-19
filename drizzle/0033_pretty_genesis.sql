ALTER TABLE "student_semester_sync_records" RENAME TO "student_semester_audit_logs";--> statement-breakpoint
ALTER TABLE "student_semester_audit_logs" DROP CONSTRAINT "student_semester_sync_records_student_semester_id_student_semesters_id_fk";
--> statement-breakpoint
ALTER TABLE "student_semester_audit_logs" DROP CONSTRAINT "student_semester_sync_records_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "student_semester_audit_logs" ADD CONSTRAINT "student_semester_audit_logs_student_semester_id_student_semesters_id_fk" FOREIGN KEY ("student_semester_id") REFERENCES "public"."student_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_semester_audit_logs" ADD CONSTRAINT "student_semester_audit_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;