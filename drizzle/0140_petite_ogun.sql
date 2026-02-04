-- Custom SQL migration file, put your code below! --
-- Migration: Add alternative grade options (4C for diplomas, 5C for degrees)
-- This adds a second grade option for programs that allows students with 
-- higher grades but fewer subjects to qualify

-- Add 4C alternative for Diploma programs
UPDATE entry_requirements er
SET rules = jsonb_set(
    rules,
    '{gradeOptions}',
    rules->'gradeOptions' || '[{"count": 4, "grade": "C"}]'::jsonb
)
FROM programs p
WHERE er.program_id = p.id
  AND p.level = 'diploma'
  AND rules->>'type' = 'subject-grades'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(rules->'gradeOptions') opt
    WHERE opt = '[{"count": 4, "grade": "C"}]'::jsonb
  );

--> statement-breakpoint

-- Add 5C alternative for Degree programs
UPDATE entry_requirements er
SET rules = jsonb_set(
    rules,
    '{gradeOptions}',
    rules->'gradeOptions' || '[{"count": 5, "grade": "C"}]'::jsonb
)
FROM programs p
WHERE er.program_id = p.id
  AND p.level = 'degree'
  AND rules->>'type' = 'subject-grades'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(rules->'gradeOptions') opt
    WHERE opt = '[{"count": 5, "grade": "C"}]'::jsonb
  );