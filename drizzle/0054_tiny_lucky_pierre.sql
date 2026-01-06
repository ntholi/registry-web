-- Migration: Replace std_no with student_module_id in assessment_marks
-- This migration maps assessment_marks to student_modules by finding the
-- corresponding student_module based on the assessment's module and term

-- Step 1: Add the new student_module_id column as nullable first
ALTER TABLE "assessment_marks" ADD COLUMN "student_module_id_new" integer;--> statement-breakpoint

-- Step 2: Create index on the new column to speed up the update
CREATE INDEX "idx_temp_assessment_marks_student_module_id_new" ON "assessment_marks" ("student_module_id_new");--> statement-breakpoint

-- Step 3: Populate student_module_id_new by mapping stdNo to the correct student_module
-- The mapping logic:
-- 1. Get the assessment's moduleId and termId
-- 2. Find the term's code
-- 3. Find student_programs where std_no matches assessment_marks.std_no
-- 4. Find student_semesters where term matches the assessment's term code
-- 5. Find student_modules where semester_module.module_id matches assessment's module_id
-- Using MIN to handle cases where a student has the same module registered multiple times
UPDATE "assessment_marks" am
SET "student_module_id_new" = subq.student_module_id
FROM (
    SELECT 
        am_inner.id as assessment_mark_id,
        MIN(sm.id) as student_module_id
    FROM "assessment_marks" am_inner
    INNER JOIN "assessments" a ON am_inner.assessment_id = a.id
    INNER JOIN "terms" t ON a.term_id = t.id
    INNER JOIN "student_programs" sp ON sp.std_no = am_inner.std_no
    INNER JOIN "student_semesters" ss ON ss.student_program_id = sp.id AND ss.term = t.code
    INNER JOIN "student_modules" sm ON sm.student_semester_id = ss.id
    INNER JOIN "semester_modules" semmod ON sm.semester_module_id = semmod.id AND semmod.module_id = a.module_id
    GROUP BY am_inner.id
) subq
WHERE am.id = subq.assessment_mark_id;--> statement-breakpoint

-- Step 4: Verify all records were updated (should return 0 rows)
-- This is a safety check - if any records couldn't be mapped, the migration should fail
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "assessment_marks" WHERE "student_module_id_new" IS NULL LIMIT 1) THEN
        RAISE EXCEPTION 'Migration failed: Some assessment_marks records could not be mapped to student_modules. Please investigate records with NULL student_module_id_new.';
    END IF;
END $$;--> statement-breakpoint

-- Step 5: Drop old indexes that use std_no
DROP INDEX "fk_assessment_marks_std_no";--> statement-breakpoint
DROP INDEX "idx_assessment_marks_assessment_id_std_no";--> statement-breakpoint

-- Step 6: Drop the old std_no column
ALTER TABLE "assessment_marks" DROP COLUMN "std_no";--> statement-breakpoint

-- Step 7: Rename the new column to student_module_id
ALTER TABLE "assessment_marks" RENAME COLUMN "student_module_id_new" TO "student_module_id";--> statement-breakpoint

-- Step 8: Drop the temporary index
DROP INDEX "idx_temp_assessment_marks_student_module_id_new";--> statement-breakpoint

-- Step 9: Make the column NOT NULL
ALTER TABLE "assessment_marks" ALTER COLUMN "student_module_id" SET NOT NULL;--> statement-breakpoint

-- Step 10: Add foreign key constraint
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_student_module_id_student_modules_id_fk" FOREIGN KEY ("student_module_id") REFERENCES "public"."student_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Step 11: Create new indexes
CREATE INDEX "fk_assessment_marks_student_module_id" ON "assessment_marks" USING btree ("student_module_id");--> statement-breakpoint
CREATE INDEX "idx_assessment_marks_assessment_id_student_module_id" ON "assessment_marks" USING btree ("assessment_id","student_module_id");