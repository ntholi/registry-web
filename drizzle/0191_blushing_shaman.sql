ALTER TABLE "employees" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'Active'::text;--> statement-breakpoint
DROP TYPE "public"."employee_status";--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('Active', 'Suspended', 'Terminated', 'Retired', 'Deceased');--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'Active'::"public"."employee_status";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "status" SET DATA TYPE "public"."employee_status" USING "status"::"public"."employee_status";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."employee_type";