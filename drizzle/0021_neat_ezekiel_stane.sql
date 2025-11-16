CREATE TABLE "lecturer_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"semester_module_id" integer NOT NULL,
	"term_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "assessment_marks" DROP CONSTRAINT "assessment_marks_std_no_students_std_no_fk";
--> statement-breakpoint
ALTER TABLE "module_grades" DROP CONSTRAINT "module_grades_std_no_students_std_no_fk";
--> statement-breakpoint
ALTER TABLE "registration_requests" DROP CONSTRAINT "registration_requests_sponsored_student_id_sponsored_students_id_fk";
--> statement-breakpoint
ALTER TABLE "student_semesters" DROP CONSTRAINT "student_semesters_sponsor_id_sponsors_id_fk";
--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ADD CONSTRAINT "lecturer_allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ADD CONSTRAINT "lecturer_allocations_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ADD CONSTRAINT "lecturer_allocations_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_lecturer_allocations_user_id" ON "lecturer_allocations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fk_lecturer_allocations_semester_module_id" ON "lecturer_allocations" USING btree ("semester_module_id");--> statement-breakpoint
CREATE INDEX "fk_lecturer_allocations_term_id" ON "lecturer_allocations" USING btree ("term_id");