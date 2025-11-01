CREATE TYPE "public"."education_level" AS ENUM('PSLE', 'BJCE', 'LGSE', 'COSC', 'LGCSE', 'IGCSE', 'BGCSE', 'Certificate', 'Diploma', 'Degree', 'Masters', 'Doctorate', 'Other');--> statement-breakpoint
CREATE TYPE "public"."education_type" AS ENUM('Primary', 'Secondary', 'Tertiary');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('Active', 'Applied', 'Deceased', 'Deleted', 'Graduated', 'Suspended', 'Terminated', 'Withdrawn');--> statement-breakpoint
CREATE TYPE "public"."next_of_kin_relationship" AS ENUM('Parent', 'Brother', 'Sister', 'Spouse', 'Child', 'Relative', 'Friend', 'Guardian', 'Other');--> statement-breakpoint

CREATE TABLE "next_of_kins" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"name" text NOT NULL,
	"relationship" "next_of_kin_relationship" NOT NULL,
	"phone" text,
	"email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_education" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"type" "education_type" NOT NULL,
	"level" "education_level" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "graduation_lists" CASCADE;--> statement-breakpoint
DROP TABLE "signups" CASCADE;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "status" "student_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "race" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "birth_place" text;--> statement-breakpoint
ALTER TABLE "next_of_kins" ADD CONSTRAINT "next_of_kins_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_education" ADD CONSTRAINT "student_education_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_next_of_kins_std_no" ON "next_of_kins" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "fk_student_education_std_no" ON "student_education" USING btree ("std_no");--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "sem";--> statement-breakpoint
DROP TYPE "public"."graduation_list_status";--> statement-breakpoint
DROP TYPE "public"."signup_status";