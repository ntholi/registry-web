-- Students who were in Remain in Semester before 2026 grade updates
-- but are no longer in Remain in Semester after those updates.
--
-- This compares each student's current latest semester in two states:
-- 1. Before the first 2026 grade update on any module in that semester
-- 2. After all 2026 grade updates (using current student_modules grades)
--
-- Academic Status mirrors the Remain/Proceed branch of getAcademicRemarks
-- and intentionally ignores NM, matching supplemented.sql.

WITH student_latest_semester AS (
    SELECT
        sp.std_no,
        ss.id AS semester_id,
        s.name AS student_name,
        p.name AS program_name,
        sponsor.code AS sponsor_code,
        strs.semester_number,
        p.level AS program_level,
        ROW_NUMBER() OVER (
            PARTITION BY sp.std_no
            ORDER BY ss.id DESC
        ) AS rn
    FROM student_semesters ss
    JOIN student_programs sp ON sp.id = ss.student_program_id
    JOIN students s ON s.std_no = sp.std_no
    JOIN structures str ON str.id = sp.structure_id
    JOIN programs p ON p.id = str.program_id
    JOIN structure_semesters strs ON strs.id = ss.structure_semester_id
        LEFT JOIN sponsors sponsor ON sponsor.id = ss.sponsor_id
    WHERE sp.status IN ('Active', 'Completed')
      AND ss.status NOT IN ('Deleted', 'Deferred', 'DroppedOut', 'Withdrawn', 'Inactive')
),
latest_semester AS (
    SELECT
        std_no,
        semester_id,
        student_name,
        program_name,
        sponsor_code,
        semester_number,
        program_level
    FROM student_latest_semester
    WHERE rn = 1
),
grade_changes_2026 AS (
    SELECT
        al.record_id::integer AS student_module_id,
        al.old_values->>'grade' AS previous_grade,
        al.new_values->>'grade' AS new_grade,
        al.changed_at,
        ROW_NUMBER() OVER (
            PARTITION BY al.record_id
            ORDER BY al.changed_at ASC
        ) AS first_change_rn
    FROM audit_logs al
    WHERE al.table_name = 'student_modules'
      AND al.operation = 'UPDATE'
      AND al.changed_at >= '2026-01-01'
      AND al.old_values->>'grade' IS DISTINCT FROM al.new_values->>'grade'
),
first_grade_changes AS (
    SELECT
        student_module_id,
        previous_grade AS grade_before_2026,
        changed_at AS first_changed_at
    FROM grade_changes_2026
    WHERE first_change_rn = 1
),
latest_semester_modules AS (
    SELECT
        ls.std_no,
        ls.student_name,
        ls.program_name,
        ls.semester_number,
        ls.program_level,
        sm.id AS student_module_id,
        m.name AS module_name,
        COALESCE(fgc.grade_before_2026, sm.grade::text) AS grade_before_2026,
        sm.grade::text AS current_grade,
        fgc.first_changed_at
    FROM latest_semester ls
    JOIN student_modules sm ON sm.student_semester_id = ls.semester_id
    JOIN semester_modules sem ON sem.id = sm.semester_module_id
    JOIN modules m ON m.id = sem.module_id
    LEFT JOIN first_grade_changes fgc ON fgc.student_module_id = sm.id
    WHERE sm.status NOT IN ('Delete', 'Drop')
),
affected_students AS (
    SELECT DISTINCT std_no
    FROM latest_semester_modules
    WHERE grade_before_2026 IS DISTINCT FROM current_grade
),
before_stats AS (
    SELECT
        lsm.std_no,
        COUNT(*) FILTER (
            WHERE lsm.grade_before_2026 IN ('F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS')
        ) AS fail_count_before,
        COUNT(*) FILTER (
            WHERE lsm.grade_before_2026 = 'PP'
        ) AS supp_count_before
    FROM latest_semester_modules lsm
    JOIN affected_students af ON af.std_no = lsm.std_no
    GROUP BY lsm.std_no
),
after_stats AS (
    SELECT
        lsm.std_no,
        COUNT(*) FILTER (
            WHERE lsm.current_grade IN ('F', 'X', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'DNS')
        ) AS fail_count_after,
        COUNT(*) FILTER (
            WHERE lsm.current_grade = 'PP'
        ) AS supp_count_after
    FROM latest_semester_modules lsm
    JOIN affected_students af ON af.std_no = lsm.std_no
    GROUP BY lsm.std_no
),
student_updates AS (
    SELECT
        lsm.std_no,
        MIN(lsm.first_changed_at) AS first_grade_update_at,
        COUNT(*) FILTER (
            WHERE lsm.grade_before_2026 IS DISTINCT FROM lsm.current_grade
        ) AS modules_updated,
        STRING_AGG(
            lsm.module_name || ' (' || COALESCE(lsm.grade_before_2026, 'NULL') || ' -> ' || COALESCE(lsm.current_grade, 'NULL') || ')',
            ', '
            ORDER BY lsm.module_name
        ) FILTER (
            WHERE lsm.grade_before_2026 IS DISTINCT FROM lsm.current_grade
        ) AS updated_modules
    FROM latest_semester_modules lsm
    JOIN affected_students af ON af.std_no = lsm.std_no
    GROUP BY lsm.std_no
)
SELECT
    ls.std_no AS "Student Number",
    ls.student_name AS "Names",
    ls.program_name AS "Program of Study",
    su.first_grade_update_at AS "First 2026 Grade Update",
    su.modules_updated AS "Modules Updated",
    su.updated_modules AS "Updated Modules",
    CASE
        WHEN COALESCE(bs.fail_count_before, 0) >= 3 THEN 'Remain in Semester'
        WHEN COALESCE(bs.fail_count_before, 0) = 2 AND COALESCE(bs.supp_count_before, 0) > 0 THEN 'Remain in Semester'
        WHEN ls.program_level = 'diploma' AND ls.semester_number::int = 5
             AND (COALESCE(bs.fail_count_before, 0) > 0 OR COALESCE(bs.supp_count_before, 0) > 0) THEN 'Remain in Semester'
        ELSE 'Proceed'
    END AS "Status Before 2026 Updates",
    CASE
        WHEN COALESCE(aft.fail_count_after, 0) >= 3 THEN 'Remain in Semester'
        WHEN COALESCE(aft.fail_count_after, 0) = 2 AND COALESCE(aft.supp_count_after, 0) > 0 THEN 'Remain in Semester'
        WHEN ls.program_level = 'diploma' AND ls.semester_number::int = 5
             AND (COALESCE(aft.fail_count_after, 0) > 0 OR COALESCE(aft.supp_count_after, 0) > 0) THEN 'Remain in Semester'
        ELSE 'Proceed'
    END AS "Status After 2026 Updates",
    ls.sponsor_code AS "Sponsor Code"
FROM latest_semester ls
JOIN affected_students af ON af.std_no = ls.std_no
JOIN before_stats bs ON bs.std_no = ls.std_no
JOIN after_stats aft ON aft.std_no = ls.std_no
JOIN student_updates su ON su.std_no = ls.std_no
WHERE (
        COALESCE(bs.fail_count_before, 0) >= 3
        OR (COALESCE(bs.fail_count_before, 0) = 2 AND COALESCE(bs.supp_count_before, 0) > 0)
        OR (
            ls.program_level = 'diploma'
            AND ls.semester_number::int = 5
            AND (COALESCE(bs.fail_count_before, 0) > 0 OR COALESCE(bs.supp_count_before, 0) > 0)
        )
    )
  AND NOT (
        COALESCE(aft.fail_count_after, 0) >= 3
        OR (COALESCE(aft.fail_count_after, 0) = 2 AND COALESCE(aft.supp_count_after, 0) > 0)
        OR (
            ls.program_level = 'diploma'
            AND ls.semester_number::int = 5
            AND (COALESCE(aft.fail_count_after, 0) > 0 OR COALESCE(aft.supp_count_after, 0) > 0)
        )
    )
ORDER BY ls.std_no;
