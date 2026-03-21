-- Major Project Students Query (Term 2026-02)
--
-- Returns all degree-level students enrolled in a "Major Project" or "Research Project"
-- module for the 2026-02 term. Only includes degree programs (p.level = 'degree').
-- Excludes students who have previously failed the same module (matched by module
-- name, case-insensitive). Also excludes enrollments with Delete or Drop status.
--
-- Output columns:
--   Student Number  - The student's std_no
--   Names           - Full name of the student
--   Program of Study - The program the student is enrolled in
--   Year of Study   - Derived from semester_number (e.g. sem 08 = Year 4 Sem 2)
--
-- Covered modules:
--   Major Project 2, Research Project, Research Project (Print/Radio/Screen),
--   Tourism Research Project, Fashion Design Project Runway (Design & Production),
--   Practical Internship and Report

SELECT DISTINCT
  s.std_no AS "Student Number",
  s.name AS "Names",
  p.name AS "Program of Study",
  'Year ' || ((CAST(ss_struct.semester_number AS int) + 1) / 2)
    || ' Sem ' || (CASE WHEN CAST(ss_struct.semester_number AS int) % 2 = 1 THEN 1 ELSE 2 END)
    AS "Year of Study"
FROM student_modules stm
JOIN semester_modules sm ON sm.id = stm.semester_module_id
JOIN modules m ON m.id = sm.module_id
JOIN student_semesters sts ON sts.id = stm.student_semester_id
JOIN structure_semesters ss_struct ON ss_struct.id = sts.structure_semester_id
JOIN student_programs sp ON sp.id = sts.student_program_id
JOIN structures str ON str.id = sp.structure_id
JOIN programs p ON p.id = str.program_id
JOIN students s ON s.std_no = sp.std_no
WHERE sts.term_code = '2026-02'
  AND p.level = 'degree'
  AND m.id IN (
    1809,  -- Major Project 2 (BIE3274)
    3231,  -- Major Project 2 (BIMP424)
    4115,  -- Major Project 2 (BIMP4212)
    4180,  -- Major Project 2 (BBPJ4210)
    4343,  -- Major Project 2 (BBMP4210)
    15143, -- Major Project 2 (BBPJ4208)
    4117,  -- Research Project (BCDS4212)
    15126, -- Research Project (BCRJ4230)
    15123, -- Research Project - Print (BCPP4230)
    15121, -- Research Project - Radio (BCRP4230)
    15122, -- Research Project - Screen (BCSP4230)
    4135,  -- Tourism Research Project (BTTR4212)
    4296,  -- Fashion Design Project Runway Design (BFPD4212)
    4297,  -- Fashion Design Project Runway Production (BFPP4212)
    4298   -- Practical Internship and Report (BFPR4212)
  )
  AND stm.status NOT IN ('Delete', 'Drop')
  AND NOT EXISTS (
    SELECT 1
    FROM student_modules stm2
    JOIN semester_modules sm2 ON sm2.id = stm2.semester_module_id
    JOIN modules m2 ON m2.id = sm2.module_id
    JOIN student_semesters sts2 ON sts2.id = stm2.student_semester_id
    JOIN student_programs sp2 ON sp2.id = sts2.student_program_id
    WHERE sp2.std_no = sp.std_no
      AND LOWER(m2.name) = LOWER(m.name)
      AND stm2.id != stm.id
      AND stm2.grade = 'F'
  )
ORDER BY p.name, s.name;
