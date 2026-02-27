CREATE TYPE "public"."employee_department" AS ENUM('Academic', 'Finance', 'Registry', 'Library', 'Marketing', 'Student Services', 'LEAP', 'Human Resources', 'Operations and Resources');--> statement-breakpoint
CREATE TABLE "employee_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"emp_no" text NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_schools_empNo_schoolId_unique" UNIQUE("emp_no","school_id")
);
--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_school_id_schools_id_fk";
--> statement-breakpoint
DROP INDEX "fk_employees_school_id";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department" "employee_department";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "employee_schools" ADD CONSTRAINT "employee_schools_emp_no_employees_emp_no_fk" FOREIGN KEY ("emp_no") REFERENCES "public"."employees"("emp_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_schools" ADD CONSTRAINT "employee_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_employee_schools_emp_no" ON "employee_schools" USING btree ("emp_no");--> statement-breakpoint
CREATE INDEX "fk_employee_schools_school_id" ON "employee_schools" USING btree ("school_id");--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "school_id";