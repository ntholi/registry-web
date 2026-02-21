-- Migration: Legacy audit tables → unified audit_logs table
-- Step 004 of audit-logs v2 implementation
-- Legacy tables are NOT dropped (preserved for rollback safety until Step 006)

-- 1. student_audit_logs → audit_logs (44 rows)
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'students',
  std_no::text,
  CASE operation::text WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation::text) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_audit_logs;

-- 2. student_program_audit_logs → audit_logs (104 rows)
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'student_programs',
  student_program_id::text,
  CASE operation::text WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation::text) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_program_audit_logs;

-- 3. student_semester_audit_logs → audit_logs (2,444 rows)
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'student_semesters',
  student_semester_id::text,
  CASE operation::text WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation::text) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_semester_audit_logs;

-- 4. student_module_audit_logs → audit_logs (1,769 rows)
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'student_modules',
  student_module_id::text,
  CASE operation::text WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation::text) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_module_audit_logs;

-- 5. assessments_audit → audit_logs (5,250 rows)
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'assessments',
  assessment_id::text,
  CASE action::text WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(action::text) END,
  CASE WHEN previous_total_marks IS NOT NULL OR previous_weight IS NOT NULL THEN
    jsonb_build_object(
      'assessmentNumber', previous_assessment_number,
      'assessmentType', previous_assessment_type,
      'totalMarks', previous_total_marks,
      'weight', previous_weight
    )
  ELSE NULL END,
  CASE WHEN new_total_marks IS NOT NULL OR new_weight IS NOT NULL THEN
    jsonb_build_object(
      'assessmentNumber', new_assessment_number,
      'assessmentType', new_assessment_type,
      'totalMarks', new_total_marks,
      'weight', new_weight
    )
  ELSE NULL END,
  created_by,
  COALESCE(date, NOW()),
  NULL
FROM assessments_audit
WHERE assessment_id IS NOT NULL;

-- 6. assessment_marks_audit → audit_logs (219,329 rows — batched)
DO $$
DECLARE
  batch_size INT := 50000;
  total_rows INT;
  offset_val INT := 0;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM assessment_marks_audit WHERE assessment_mark_id IS NOT NULL;

  WHILE offset_val < total_rows LOOP
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
    SELECT
      'assessment_marks',
      assessment_mark_id::text,
      CASE action::text WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(action::text) END,
      CASE WHEN previous_marks IS NOT NULL THEN jsonb_build_object('marks', previous_marks) ELSE NULL END,
      CASE WHEN new_marks IS NOT NULL THEN jsonb_build_object('marks', new_marks) ELSE NULL END,
      created_by,
      COALESCE(date, NOW()),
      NULL
    FROM assessment_marks_audit
    WHERE assessment_mark_id IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val;

    offset_val := offset_val + batch_size;
    RAISE NOTICE 'assessment_marks_audit: migrated % / % rows', LEAST(offset_val, total_rows), total_rows;
  END LOOP;
END $$;

-- 7. clearance_audit → audit_logs (25,129 rows)
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'clearance',
  clearance_id::text,
  CASE WHEN previous_status IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
  CASE WHEN previous_status IS NOT NULL THEN jsonb_build_object('status', previous_status) ELSE NULL END,
  jsonb_build_object('status', new_status, 'message', message),
  created_by,
  COALESCE(date, NOW()),
  jsonb_strip_nulls(jsonb_build_object(
    'reasons', message,
    'modules', CASE WHEN modules IS NOT NULL AND modules != '[]'::jsonb THEN modules ELSE NULL END
  ))
FROM clearance_audit;

-- Update statistics after bulk inserts
ANALYZE audit_logs;