-- Migration: Fix assessment_marks term mismatch
-- Problem: 3,331 assessment_marks are linked to 2025-02 assessments but the students
--          were enrolled in those modules during 2025-07
-- Solution:
--   1. Create new assessments for 2025-07 mirroring the affected 2025-02 assessments
--   2. Update the mismatched assessment_marks to point to the new 2025-07 assessments

-- Step 1: Create new assessments for 2025-07
-- These are copies of the 2025-02 assessments that have marks from 2025-07 enrolled students
INSERT INTO assessments (module_id, term_id, assessment_number, assessment_type, total_marks, weight, created_at)
SELECT DISTINCT
    a.module_id,
    (SELECT id FROM terms WHERE code = '2025-07') as term_id,
    a.assessment_number,
    a.assessment_type,
    a.total_marks,
    a.weight,
    NOW()
FROM assessment_marks am
JOIN assessments a ON am.assessment_id = a.id
JOIN terms t ON a.term_id = t.id
JOIN semester_modules sm ON sm.module_id = a.module_id
JOIN student_modules stm ON stm.semester_module_id = sm.id
JOIN student_semesters ss ON stm.student_semester_id = ss.id
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE sp.std_no = am.std_no
  AND t.code = '2025-02'
  AND ss.term = '2025-07'
ON CONFLICT (module_id, assessment_number, term_id) DO NOTHING;

--> statement-breakpoint

-- Step 2: Update assessment_marks to point to the new 2025-07 assessments
-- Only update marks where the student was enrolled in 2025-07
UPDATE assessment_marks am
SET assessment_id = new_assessment.id
FROM assessments old_assessment
JOIN terms old_term ON old_assessment.term_id = old_term.id
JOIN assessments new_assessment ON
    new_assessment.module_id = old_assessment.module_id
    AND new_assessment.assessment_number = old_assessment.assessment_number
    AND new_assessment.term_id = (SELECT id FROM terms WHERE code = '2025-07')
WHERE am.assessment_id = old_assessment.id
  AND old_term.code = '2025-02'
  AND EXISTS (
    SELECT 1
    FROM semester_modules sm
    JOIN student_modules stm ON stm.semester_module_id = sm.id
    JOIN student_semesters ss ON stm.student_semester_id = ss.id
    JOIN student_programs sp ON ss.student_program_id = sp.id
    WHERE sm.module_id = old_assessment.module_id
      AND sp.std_no = am.std_no
      AND ss.term = '2025-07'
  );
