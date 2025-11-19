CREATE TYPE "public"."operation_type" AS ENUM('create', 'update');--> statement-breakpoint
CREATE TABLE "student_module_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_module_id" integer NOT NULL,
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
CREATE TABLE "student_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
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
ALTER TABLE "student_semester_audit_logs" ADD COLUMN "operation" "operation_type" DEFAULT 'update' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_module_audit_logs" ADD CONSTRAINT "student_module_audit_logs_student_module_id_student_modules_id_fk" FOREIGN KEY ("student_module_id") REFERENCES "public"."student_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_module_audit_logs" ADD CONSTRAINT "student_module_audit_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_audit_logs" ADD CONSTRAINT "student_audit_logs_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_audit_logs" ADD CONSTRAINT "student_audit_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_student_module_audit_logs_student_module_id" ON "student_module_audit_logs" USING btree ("student_module_id");--> statement-breakpoint
CREATE INDEX "fk_student_module_audit_logs_updated_by" ON "student_module_audit_logs" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "idx_student_module_audit_logs_synced_at" ON "student_module_audit_logs" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX "fk_student_audit_logs_std_no" ON "student_audit_logs" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "fk_student_audit_logs_updated_by" ON "student_audit_logs" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "idx_student_audit_logs_synced_at" ON "student_audit_logs" USING btree ("synced_at");