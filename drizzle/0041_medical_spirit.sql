ALTER TABLE "student_modules" ADD COLUMN "credits" real NOT NULL DEFAULT 0;--> statement-breakpoint

UPDATE "student_modules" sm
SET "credits" = COALESCE(
    (SELECT "credits" FROM "semester_modules" sem WHERE sem."id" = sm."semester_module_id"),
    0
);--> statement-breakpoint

ALTER TABLE "student_modules" ALTER COLUMN "credits" DROP DEFAULT;