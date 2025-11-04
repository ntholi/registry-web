-- Step 1: Add structure_semester_id column (nullable initially)
ALTER TABLE "student_semesters" ADD COLUMN "structure_semester_id" integer;--> statement-breakpoint

-- Step 2: Populate structure_semester_id with correct values from structure_semesters
UPDATE "student_semesters"
SET "structure_semester_id" = (
  SELECT struct_sem.id
  FROM "student_programs" sp
  JOIN "structures" s ON sp.structure_id = s.id
  JOIN "structure_semesters" struct_sem ON struct_sem.structure_id = s.id
    AND struct_sem.semester_number = "student_semesters".semester_number
  WHERE "student_semesters".student_program_id = sp.id
  LIMIT 1
);--> statement-breakpoint

-- Step 3: Delete student_semesters records that don't have a matching structure_semester
DELETE FROM "student_semesters" WHERE "structure_semester_id" IS NULL;--> statement-breakpoint

-- Step 4: Make structure_semester_id NOT NULL
ALTER TABLE "student_semesters" ALTER COLUMN "structure_semester_id" SET NOT NULL;--> statement-breakpoint

-- Step 5: Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_structure_semester_id_structure_semesters_id_fk" FOREIGN KEY ("structure_semester_id") REFERENCES "public"."structure_semesters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Step 6: Create index for the foreign key
CREATE INDEX IF NOT EXISTS "fk_student_semesters_structure_semester_id" ON "student_semesters" USING btree ("structure_semester_id");--> statement-breakpoint

-- Step 7: Drop the old semester_number column
ALTER TABLE "student_semesters" DROP COLUMN IF EXISTS "semester_number";
