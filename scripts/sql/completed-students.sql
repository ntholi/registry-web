WITH completed AS (
  SELECT
    sp.id AS student_program_id,
    LEFT(MAX(ss.term_code), 4) AS year
  FROM student_programs sp
  JOIN student_semesters ss ON ss.student_program_id = sp.id
  WHERE sp.status = 'Completed' OR sp.graduation_date IS NOT NULL
  GROUP BY sp.id
)
SELECT
  year::int AS year,
  COUNT(*) AS completed
FROM completed
WHERE year IS NOT NULL
GROUP BY year
ORDER BY year;
