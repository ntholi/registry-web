-- Student Data Schema Query (Term 2023-08)
--
-- Returns all students registered for the 2023-08 semester term
-- in the format matching the CHE "Student Schema Ver1.2025" template.
--
-- Columns: Institution Name, Academic Year, Student Number, FirstName, Surname,
-- Date Of Birth, Gender, Nationality (Country), Number of Sponsors,
-- Type of Main Sponsor, Name of Main Sponsor, Faculty or School, Programme,
-- Duration on programme, Year of Study, Qualification, Level of Study,
-- Residential Status, Student Status, Mode of Study, Disability Type,
-- Overall Exam Mark (%), Graduate Status

SELECT
  'Limkokwing University of Creative Technology' AS "Institution Name",
  '2023/2024' AS "Academic Year",
  s.std_no AS "Student Number",
  SPLIT_PART(s.name, ' ', 1) AS "FirstName",
  CASE
    WHEN POSITION(' ' IN s.name) > 0
    THEN SUBSTRING(s.name FROM POSITION(' ' IN s.name) + 1)
    ELSE ''
  END AS "Surname",
  TO_CHAR(s.date_of_birth, 'YYYY-MM-DD') AS "Date Of Birth",
  CASE s.gender
    WHEN 'Male' THEN 'Male'
    WHEN 'Female' THEN 'Female'
    ELSE 'Unknown'
  END AS "Gender",
  COALESCE(s.nationality, s.country) AS "Nationality (Country)",
  COALESCE(sponsor_count.cnt, 0) AS "Number of Sponsors",
  CASE
    WHEN main_sp.name = 'NMDS' THEN 'Government'
    WHEN main_sp.name = 'Self Sponsored' THEN 'Self'
    WHEN main_sp.name IN ('LUCT Sponsorship', 'LUCT Staff Development') THEN 'Institution'
    WHEN main_sp.name IS NOT NULL THEN 'Private'
    ELSE NULL
  END AS "Type of Main Sponsor",
  main_sp.name AS "Name of Main Sponsor",
  sch.name AS "Faculty or School",
  p.name AS "Programme",
  (
    SELECT COUNT(*)
    FROM structure_semesters ss2
    WHERE ss2.structure_id = str.id
      AND ss2.semester_number ~ '^\d+$'
      AND ss2.semester_number::int > 0
  ) / 2 AS "Duration on programme",
  CASE
    WHEN ssem.semester_number ~ '^\d+$' AND ssem.semester_number::int > 0
    THEN CEIL(ssem.semester_number::int / 2.0)::int
    ELSE NULL
  END AS "Year of Study",
  CASE p.level
    WHEN 'degree' THEN 'Bachelor Degree'
    WHEN 'diploma' THEN 'Diploma'
    WHEN 'certificate' THEN 'Certificate'
  END AS "Qualification",
  CASE p.level
    WHEN 'degree' THEN 'Undergraduate'
    WHEN 'diploma' THEN 'Undergraduate'
    WHEN 'certificate' THEN 'Certificate'
  END AS "Level of Study",
  CASE
    WHEN COALESCE(s.nationality, s.country) IN ('Lesotho', 'Mosotho') THEN 'Local'
    WHEN COALESCE(s.nationality, s.country) IS NOT NULL THEN 'International'
    ELSE NULL
  END AS "Residential Status",
  s.status::text AS "Student Status",
  'Full-time' AS "Mode of Study",
  NULL AS "Disability Type",
  NULL AS "Overall Exam Mark (%)",
  CASE
    WHEN sp.status = 'Completed' THEN 'Graduated'
    ELSE 'Not Graduated'
  END AS "Graduate Status"
FROM student_semesters sts
JOIN student_programs sp ON sp.id = sts.student_program_id
JOIN students s ON s.std_no = sp.std_no
JOIN structures str ON str.id = sp.structure_id
JOIN programs p ON p.id = str.program_id
JOIN schools sch ON sch.id = p.school_id
JOIN structure_semesters ssem ON ssem.id = sts.structure_semester_id
LEFT JOIN sponsors main_sp ON main_sp.id = sts.sponsor_id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt
  FROM sponsored_students sps
  WHERE sps.std_no = s.std_no
) sponsor_count ON true
WHERE sts.term_code = '2023-08'
  AND sts.status NOT IN ('Deleted')
ORDER BY sch.name, p.name, s.name;
