CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ALTER COLUMN "duration" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ADD COLUMN "allowed_days" "day_of_week"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ADD COLUMN "start_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "lecturer_allocations" ADD COLUMN "end_time" time NOT NULL;