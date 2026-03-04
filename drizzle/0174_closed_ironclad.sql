-- Allow national_id to be nullable
ALTER TABLE "students" ALTER COLUMN "national_id" DROP NOT NULL;

-- Convert empty string national_id to NULL
UPDATE "students" SET "national_id" = NULL WHERE "national_id" = '';

-- For each duplicated national_id, keep only the oldest student (lowest std_no) and NULL out the rest
UPDATE "students" SET "national_id" = NULL
WHERE ctid NOT IN (
  SELECT DISTINCT ON (national_id) ctid
  FROM "students"
  WHERE "national_id" IS NOT NULL
  ORDER BY national_id, std_no ASC
);

-- Now enforce the unique constraint
ALTER TABLE "students" ADD CONSTRAINT "students_nationalId_unique" UNIQUE("national_id");