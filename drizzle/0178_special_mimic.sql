ALTER TABLE "employee_schools" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "employee_schools" ALTER COLUMN "id" SET DATA TYPE text USING id::text;