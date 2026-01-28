ALTER TABLE "document_stamps" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "document_stamps" CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "first_choice_program_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "certified_date";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "certified_by";