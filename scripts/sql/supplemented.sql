-- Students who supplemented and passed in 2026
-- Tracks audit trail changes from failing grades (F, PP, DEF, NM, etc.) to passing grades
-- PLUS all records where PP changed to any other grade
-- Academic Status mirrors getAcademicRemarks logic (ignoring NM):
--   "Remain in Semester" if latest semester has 3+ fails, 
--      or 2 fails + supplementary, or diploma sem 5 with any fail/PP
--   "Proceed" otherwise

WITH grade_changes AS (
    SELECT 
        al.record_id::integer AS student_module_id,
        al.old_values->>'grade' AS previous_grade,
        al.new_values->>'grade' AS new_grade,
        al.changed_at,
        ROW_NUMBER() OVER (
            PARTITION BY al.record_id 
            ORDER BY al.changed_at DESC
        ) AS rn
    FROM audit_logs al
    WHERE al.table_name = 'student_modules'
      AND al.operation = 'UPDATE'
      AND al.changed_at >= '2026-01-01'
      AND al.old_values->>'grade' IS DISTINCT FROM al.new_values->>'grade'
      AND (
          -- Failing/non-passing → passing grade
          (
              al.old_values->>'grade' IN ('F', 'PP', 'DEF', 'NM', 'X', 'GNS', 'FIN', 'FX', 'DNC', 'DNA', 'DNS', 'ANN')
              AND al.new_values->>'grade' IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'PC', 'PX', 'AP')
          )
          OR
          -- PP → any other grade
          (
              al.old_values->>'grade' = 'PP'
              AND al.new_values->>'grade' != 'PP'
          )
      )
),
latest_changes AS (
    SELECT * FROM grade_changes WHERE rn = 1
),
student_info AS (
    SELECT 
        lc.student_module_id,
        lc.previous_grade,
        lc.new_grade,
        s.std_no,
        s.name AS student_name,
        p.name AS program_name,
        m.name AS module_name
    FROM latest_changes lc
    JOIN student_modules sm ON sm.id = lc.student_module_id
    JOIN semester_modules sem ON sem.id = sm.semester_module_id
    JOIN modules m ON m.id = sem.module_id
    JOIN student_semesters ss ON ss.id = sm.student_semester_id
    JOIN student_programs sp ON sp.id = ss.student_program_id
    JOIN students s ON s.std_no = sp.std_no
    JOIN structures str ON str.id = sp.structure_id
    JOIN programs p ON p.id = str.program_id
),
-- Find the latest semester for each student (for Remain/Proceed decision)
student_latest_semester AS (
    SELECT 
        sp.std_no,
        ss.id AS semester_id,
        strs.semester_number,
        p.level AS program_level,
        ROW_NUMBER() OVER (PARTITION BY sp.std_no ORDER BY ss.id DESC) AS rn
    FROM student_semesters ss
    JOIN student_programs sp ON ss.student_program_id = sp.id
    JOIN structures str ON str.id = sp.structure_id
    JOIN programs p ON p.id = str.program_id
    JOIN structure_semesters strs ON strs.id = ss.structure_semester_id
    WHERE sp.status IN ('Active', 'Completed')
      AND ss.status NOT IN ('Deleted', 'Deferred', 'DroppedOut', 'Withdrawn', 'Inactive')
),
latest_sem_stats AS (
    SELECT 
        sls.std_no,
        sls.semester_number,
        sls.program_level,
        COUNT(*) FILTER (
            WHERE smod.grade IN ('F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS') 
            AND smod.status NOT IN ('Delete', 'Drop')
        ) AS fail_count,
        COUNT(*) FILTER (
            WHERE smod.grade = 'PP' 
            AND smod.status NOT IN ('Delete', 'Drop')
        ) AS supp_count
    FROM student_latest_semester sls
    JOIN student_modules smod ON smod.student_semester_id = sls.semester_id
    WHERE sls.rn = 1
    GROUP BY sls.std_no, sls.semester_number, sls.program_level
)
SELECT 
    si.std_no AS "Student Number",
    si.student_name AS "Names",
    si.program_name AS "Program of Study",
    si.module_name AS "Module Name",
    si.previous_grade AS "Previous Grade",
    si.new_grade AS "New Grade",
    CASE 
        WHEN COALESCE(ls.fail_count, 0) >= 3 THEN 'Remain in Semester'
        WHEN COALESCE(ls.fail_count, 0) = 2 AND COALESCE(ls.supp_count, 0) > 0 THEN 'Remain in Semester'
        WHEN ls.program_level = 'diploma' AND ls.semester_number::int = 5 
             AND (COALESCE(ls.fail_count, 0) > 0 OR COALESCE(ls.supp_count, 0) > 0) THEN 'Remain in Semester'
        ELSE 'Proceed'
    END AS "Academic Status"
FROM student_info si
LEFT JOIN latest_sem_stats ls ON ls.std_no = si.std_no
ORDER BY si.std_no, si.module_name;
