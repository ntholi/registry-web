CREATE TABLE "student_program_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_program_id" integer NOT NULL,
	"old_values" jsonb NOT NULL,
	"new_values" jsonb NOT NULL,
	"operation" "operation_type" DEFAULT 'update' NOT NULL,
	"reasons" text,
	"updated_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_program_audit_logs" ADD CONSTRAINT "student_program_audit_logs_student_program_id_student_programs_id_fk" FOREIGN KEY ("student_program_id") REFERENCES "public"."student_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_program_audit_logs" ADD CONSTRAINT "student_program_audit_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_student_program_audit_logs_student_program_id" ON "student_program_audit_logs" USING btree ("student_program_id");--> statement-breakpoint
CREATE INDEX "fk_student_program_audit_logs_updated_by" ON "student_program_audit_logs" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "idx_student_program_audit_logs_synced_at" ON "student_program_audit_logs" USING btree ("synced_at");