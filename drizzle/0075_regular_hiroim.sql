ALTER TABLE "term_settings" ALTER COLUMN "lecturer_gradebook_access" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "term_settings" DROP COLUMN "gradebook_open_date";--> statement-breakpoint
ALTER TABLE "term_settings" DROP COLUMN "gradebook_close_date";--> statement-breakpoint

-- Set lecturerGradebookAccess to false for all terms except 2025-07
UPDATE "term_settings"
SET "lecturer_gradebook_access" = false
WHERE "term_id" IN (
    SELECT id FROM "terms" WHERE code != '2025-07'
);