CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused', 'na');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"assigned_module_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"term_id" integer NOT NULL,
	"semester_module_id" integer NOT NULL,
	"week_number" integer NOT NULL,
	"status" "attendance_status" DEFAULT 'na' NOT NULL,
	"marked_by" text,
	"marked_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "attendance_stdNo_termId_semesterModuleId_weekNumber_unique" UNIQUE("std_no","term_id","semester_module_id","week_number")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_attendance_std_no" ON "attendance" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "fk_attendance_term_id" ON "attendance" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "fk_attendance_semester_module_id" ON "attendance" USING btree ("semester_module_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_week_number" ON "attendance" USING btree ("week_number");--> statement-breakpoint
CREATE INDEX "fk_attendance_assigned_module_id" ON "attendance" USING btree ("assigned_module_id");