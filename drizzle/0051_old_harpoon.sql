-- Migration: Transfer module_grades data to student_modules for term '2025-07'
-- Then drop the module_grades table

-- Step 1: Update student_modules with data from module_grades
-- Matching logic:
--   - studentModule.semesterModuleId -> semesterModules.moduleId (same module)
--   - studentModule.studentSemesterId -> studentSemesters.studentProgramId -> studentPrograms.stdNo (same student)
--   - Only for studentSemesters.term = '2025-07'

UPDATE student_modules sm
SET
    marks = mg.weighted_total::text,
    grade = mg.grade
FROM
    semester_modules smod,
    student_semesters ss,
    student_programs sp,
    module_grades mg
WHERE
    sm.semester_module_id = smod.id
    AND sm.student_semester_id = ss.id
    AND ss.student_program_id = sp.id
    AND ss.term = '2025-07'
    AND mg.module_id = smod.module_id
    AND mg.std_no = sp.std_no;

--> statement-breakpoint

-- Step 2: Rename the module_grades 
ALTER TABLE "module_grades" RENAME TO "module_grades_delete_this";
