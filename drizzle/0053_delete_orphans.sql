-- Delete orphaned assessment marks
-- These are assessment_marks where the student (std_no) is not enrolled 
-- in the associated module for the associated term.
-- 
-- Enrollment is verified by checking if there exists a student_module with:
-- 1. A semester_module pointing to the same module_id as assessments.module_id
-- 2. A student_semester with term matching terms.code (where terms.id = assessments.term_id)
-- 3. A student_program with the same std_no as assessment_marks.std_no

DELETE FROM assessment_marks
WHERE id IN (
    SELECT am.id
    FROM assessment_marks am
    JOIN assessments a ON a.id = am.assessment_id
    JOIN terms t ON t.id = a.term_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM student_modules stm
        JOIN semester_modules sem ON sem.id = stm.semester_module_id
        JOIN student_semesters ss ON ss.id = stm.student_semester_id
        JOIN student_programs sp ON sp.id = ss.student_program_id
        WHERE sem.module_id = a.module_id
          AND ss.term = t.code
          AND sp.std_no = am.std_no
    )
);
