-- Custom SQL migration file, put your code below! --
-- Migration: Convert minimumGrades to gradeOptions in entry_requirements.rules
-- Transforms { minimumGrades: [...], subjects: [...] } to { gradeOptions: [[...]], subjects: [...] }

UPDATE entry_requirements
SET rules = jsonb_set(
    rules - 'minimumGrades',
    '{gradeOptions}',
    jsonb_build_array(rules->'minimumGrades')
)
WHERE rules ? 'minimumGrades';