ALTER TABLE "attendance" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'not_marked'::text;--> statement-breakpoint
DROP TYPE "public"."attendance_status";--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused', 'no_class', 'not_marked');--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'not_marked'::"public"."attendance_status";--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DATA TYPE "public"."attendance_status" USING "status"::"public"."attendance_status";