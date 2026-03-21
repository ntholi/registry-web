-- Internship Students Query (Term 2026-02, Diploma Programs Only)
--
-- Returns all Diploma students enrolled in a "Practical Internship" module
-- for the 2026-02 term. Only includes Diploma-level programs (p.level = 'diploma').
-- Excludes students who have previously failed the same module (matched by
-- module name, case-insensitive). Also excludes enrollments with Delete or Drop status.
--
-- Output columns:
--   Student Number   - The student's std_no
--   Names            - Full name of the student
--   Program of Study - The Diploma program the student is enrolled in
--   Year of Study    - Derived from semester_number (e.g. sem 06 = Year 3 Sem 2)

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
  AND p.level = 'diploma'
  AND m.id IN (
    2401,  -- Practical Internship (ADPI324)
    2449,  -- Practical Internship (ACPI324)
    3208,  -- Practical Internship (AIPI324)
    3212,  -- Practical Internship (ABPI324)
    4088,  -- Practical Internship (DCPI3212)
    4090,  -- Practical Internship (DIPI3212)
    4092,  -- Practical Internship (DBPI3210)
    4094,  -- Practical Internship (DHPI3212)
    4096,  -- Practical Internship (DTPI3212)
    4102,  -- Practical Internship (DDPI3212)
    4105,  -- Practical Internship (DAPI3216)
    4690,  -- Practical Internship (DIPI3210)
    14957, -- Practical Internship (DHPI3235)
    14958, -- Practical Internship (DEPI3235)
    14988, -- Practical Internship (DBPI3240)
    15006, -- Practical Internship (DDPI3234)
    15061, -- Practical Internship (DCPI3236)
    15168, -- Practical Internship (DEPI3232)
    4100,  -- Practical Internship & Report (DFIR3212)
    15025  -- Practical Internship and Report (DFIR3230)
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
