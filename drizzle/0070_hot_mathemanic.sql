-- Drop the deprecated module_grades table (renamed to module_grades_delete_this in migration 0051)
-- Data was already migrated to student_modules in that migration

DROP TABLE IF EXISTS "module_grades_delete_this";