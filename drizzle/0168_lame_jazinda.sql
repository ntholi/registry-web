CREATE TYPE "public"."employee_status" AS ENUM('Active', 'Suspended', 'Terminated', 'Resigned', 'Retired', 'Deceased', 'On Leave');--> statement-breakpoint
CREATE TYPE "public"."employee_type" AS ENUM('Full-time', 'Part-time', 'Contract', 'Intern');--> statement-breakpoint
CREATE TABLE "employees" (
	"emp_no" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "employee_status" DEFAULT 'Active' NOT NULL,
	"type" "employee_type" NOT NULL,
	"school_id" integer,
	"user_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employees_name_trgm" ON "employees" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fk_employees_user_id" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fk_employees_school_id" ON "employees" USING btree ("school_id");