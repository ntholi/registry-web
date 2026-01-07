-- Populate graduation_dates from student_programs
-- 1. Find distinct graduation dates with more than 100 students
-- 2. For each, find the most common latest student_semester term

WITH grad_dates AS (
    SELECT graduation_date
    FROM student_programs 
    WHERE graduation_date IS NOT NULL 
    GROUP BY graduation_date 
    HAVING COUNT(*) > 100
),
latest_semesters AS (
    SELECT 
        sp.graduation_date,
        ss.term_code,
        ROW_NUMBER() OVER (PARTITION BY sp.id ORDER BY ss.term_code DESC) as rn
    FROM student_programs sp
    JOIN student_semesters ss ON ss.student_program_id = sp.id
    WHERE sp.graduation_date IN (SELECT graduation_date FROM grad_dates)
),
term_counts AS (
    SELECT 
        graduation_date,
        term_code,
        COUNT(*) as cnt
    FROM latest_semesters
    WHERE rn = 1
    GROUP BY graduation_date, term_code
),
ranked_terms AS (
    SELECT 
        graduation_date,
        term_code,
        cnt,
        ROW_NUMBER() OVER (PARTITION BY graduation_date ORDER BY cnt DESC) as rn
    FROM term_counts
)
INSERT INTO graduation_dates (date, term_id)
SELECT rt.graduation_date, t.id
FROM ranked_terms rt
JOIN terms t ON t.code = rt.term_code
WHERE rt.rn = 1
AND NOT EXISTS (
    SELECT 1 FROM graduation_dates gd WHERE gd.date = rt.graduation_date
)
ORDER BY rt.graduation_date;