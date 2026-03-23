-- Student Data Schema Query (Term 2023-08)
--
-- Returns all students registered for the 2023-08 semester term
-- in the format matching the CHE "Student Schema Ver1.2025" template.
--
-- Columns: Institution Name, Academic Year, Student Number, FirstName, Surname,
--   Date Of Birth, Gender, Nationality (Country), Number of Sponsors,
--   Type of Main Sponsor, Name of Main Sponsor, Faculty or School, Programme,
--   Duration on programme, Year of Study, Qualification, Level of Study,
--   Residential Status, Student Status, Mode of Study, Disability Type,
--   Overall Exam Mark (%), Graduate Status

WITH sponsor_count AS (
  SELECT
    sps.std_no,
    COUNT(*) AS cnt
  FROM sponsored_students sps
  GROUP BY sps.std_no
),
programme_duration AS (
  SELECT
    ss.structure_id,
    CEIL(COUNT(*) FILTER (
      WHERE ss.semester_number ~ '^\d+$'
        AND ss.semester_number::int > 0
    ) / 2.0)::int AS years
  FROM structure_semesters ss
  GROUP BY ss.structure_id
),
overall_mark AS (
  SELECT
    sm.student_semester_id,
    ROUND(
      AVG(sm.marks::numeric) FILTER (
        WHERE sm.status::text NOT IN ('Delete', 'Drop')
          AND BTRIM(sm.marks) ~ '^[0-9]+(\.[0-9]+)?$'
      ),
      2
    ) AS score
  FROM student_modules sm
  JOIN student_semesters sts ON sts.id = sm.student_semester_id
  WHERE sts.term_code = '2023-08'
  GROUP BY sm.student_semester_id
),
clean_name AS (
  SELECT
    s.std_no,
    BTRIM(REGEXP_REPLACE(COALESCE(s.name, ''), '[[:cntrl:]]', '', 'g')) AS full_name
  FROM students s
)
SELECT
  'Limkokwing University' AS "Institution Name",
  '2023/2024' AS "Academic Year",
  s.std_no AS "Student Number",
  CASE
    WHEN POSITION(' ' IN cn.full_name) > 0
    THEN BTRIM(LEFT(cn.full_name, LENGTH(cn.full_name) - POSITION(' ' IN REVERSE(cn.full_name))))
    ELSE cn.full_name
  END AS "FirstName",
  CASE
    WHEN POSITION(' ' IN cn.full_name) > 0
    THEN BTRIM(RIGHT(cn.full_name, POSITION(' ' IN REVERSE(cn.full_name)) - 1))
    ELSE ''
  END AS "Surname",
  TO_CHAR(s.date_of_birth, 'DD/MM/YYYY') AS "Date Of Birth",
  CASE s.gender
    WHEN 'Male' THEN 'M'
    WHEN 'Female' THEN 'F'
    ELSE 'M'
  END AS "Gender",
  NULLIF(BTRIM(REGEXP_REPLACE(COALESCE(s.nationality, s.country, ''), '[[:cntrl:]]', '', 'g')), '') AS "Nationality (Country)",
  COALESCE(sponsor_count.cnt, 0) AS "Number of Sponsors",
  CASE
    WHEN COALESCE(sp_hist.clean_name, 'NMDS') = 'NMDS' THEN 'Government'
    WHEN sp_hist.clean_name = 'Self Sponsored' THEN 'Self'
    WHEN sp_hist.clean_name IN ('LUCT Sponsorship', 'LUCT Staff Development') THEN 'Own Institution'
    WHEN sp_hist.clean_name IS NOT NULL THEN 'Other'
    ELSE 'Government'
  END AS "Type of Main Sponsor",
  COALESCE(sp_hist.clean_name, 'NMDS') AS "Name of Main Sponsor",
  BTRIM(REGEXP_REPLACE(COALESCE(sch.name, ''), '[[:cntrl:]]', '', 'g')) AS "Faculty or School",
  BTRIM(REGEXP_REPLACE(COALESCE(p.name, ''), '[[:cntrl:]]', '', 'g')) AS "Programme",
  programme_duration.years AS "Duration on programme",
  CASE
    WHEN ssem.semester_number ~ '^\d+$' AND ssem.semester_number::int > 0
    THEN CEIL(ssem.semester_number::int / 2.0)::int
    ELSE NULL
  END AS "Year of Study",
  CASE p.level
    WHEN 'degree' THEN 3
    WHEN 'diploma' THEN 2
    WHEN 'certificate' THEN 1
  END AS "Qualification",
  CASE p.level
    WHEN 'degree' THEN 'UnderGraduate'
    WHEN 'diploma' THEN 'UnderGraduate'
    WHEN 'certificate' THEN 'UnderGraduate'
  END AS "Level of Study",
  'Off-Campus' AS "Residential Status",
  CASE
    WHEN sts.status = 'Repeat' THEN 'Repeater'
    WHEN sts.status IN ('Active', 'Enrolled') AND NOT EXISTS (
      SELECT 1 FROM student_semesters prev
      WHERE prev.student_program_id = sts.student_program_id
        AND prev.term_code < sts.term_code
        AND prev.status NOT IN ('Deleted', 'Withdrawn')
    ) THEN 'New entrant'
    ELSE 'Continuing student'
  END AS "Student Status",
  'Fulltime' AS "Mode of Study",
  'N/A' AS "Disability Type",
  COALESCE(overall_mark.score, 999) AS "Overall Exam Mark (%)",
  CASE
    WHEN sp.status = 'Completed' THEN 'Passed'
    WHEN sts.status = 'Withdrawn' THEN 'Withdrew'
    WHEN sp.status IN ('Inactive', 'Deleted', 'Changed') THEN 'Incomplete'
    ELSE 'Incomplete'
  END AS "Graduate Status"
FROM student_semesters sts
JOIN student_programs sp ON sp.id = sts.student_program_id
JOIN students s ON s.std_no = sp.std_no
JOIN structures str ON str.id = sp.structure_id
JOIN programs p ON p.id = str.program_id
JOIN schools sch ON sch.id = p.school_id
JOIN structure_semesters ssem ON ssem.id = sts.structure_semester_id
JOIN clean_name cn ON cn.std_no = s.std_no
LEFT JOIN programme_duration ON programme_duration.structure_id = str.id
LEFT JOIN LATERAL (
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM student_semesters sts3
        JOIN sponsors sp3 ON sp3.id = sts3.sponsor_id
        WHERE sts3.student_program_id = sp.id
          AND BTRIM(sp3.name) = 'NMDS'
      ) OR EXISTS (
        SELECT 1
        FROM sponsored_students sps
        JOIN sponsors sp4 ON sp4.id = sps.sponsor_id
        WHERE sps.std_no = s.std_no
          AND BTRIM(sp4.name) = 'NMDS'
      ) THEN 'NMDS'
      ELSE NULLIF(BTRIM(REGEXP_REPLACE(COALESCE(sp2.name, ''), '[[:cntrl:]]', '', 'g')), '')
    END AS clean_name
  FROM student_semesters sts2
  JOIN sponsors sp2 ON sp2.id = sts2.sponsor_id
  WHERE sts2.student_program_id = sp.id
    AND sts2.sponsor_id IS NOT NULL
  ORDER BY sts2.term_code DESC
  LIMIT 1
) sp_hist ON TRUE
LEFT JOIN sponsor_count ON sponsor_count.std_no = s.std_no
LEFT JOIN overall_mark ON overall_mark.student_semester_id = sts.id
WHERE sts.term_code = '2023-08'
  AND sts.status NOT IN ('Deleted', 'Withdrawn')
  AND EXISTS (
    SELECT 1 FROM student_modules sm
    WHERE sm.student_semester_id = sts.id
      AND sm.status::text NOT IN ('Delete', 'Drop')
  )
ORDER BY sch.name, p.name, cn.full_name
