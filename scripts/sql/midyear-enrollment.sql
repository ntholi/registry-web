SELECT
  t.year,
  t.code AS term_code,
  COUNT(DISTINCT ss.id) AS enrolled
FROM terms t
LEFT JOIN student_semesters ss ON ss.term_code = t.code
  AND ss.status NOT IN ('Deferred', 'Deleted', 'DroppedOut', 'Withdrawn')
WHERE t.code LIKE '%-07' OR t.code LIKE '%-08'
GROUP BY t.year, t.code
ORDER BY t.code;
