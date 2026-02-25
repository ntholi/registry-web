# Step 004: Migration of Existing Audit Tables

## Introduction

Migrate data from the 7 existing legacy audit tables into the unified `audit_logs` table. This preserves historical audit data while transitioning to the new system.

## Context

The legacy tables use two different patterns:
- **JSONB old/new pattern**: `student_audit_logs`, `student_program_audit_logs`, `student_semester_audit_logs`, `student_module_audit_logs`
- **Column-specific diff pattern**: `assessments_audit`, `assessment_marks_audit`, `clearance_audit`

All must be normalized into the unified JSONB format.

## Requirements

### 1. Custom Migration

Generate with `pnpm db:generate --custom` and add INSERT...SELECT statements.

### 2. Data Mappings

#### `student_audit_logs` → `audit_logs`

```sql
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'students',
  std_no::text,
  CASE operation WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_audit_logs;
```

#### `student_program_audit_logs` → `audit_logs`

```sql
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'student_programs',
  student_program_id::text,
  CASE operation WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_program_audit_logs;
```

#### `student_semester_audit_logs` → `audit_logs`

```sql
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'student_semesters',
  student_semester_id::text,
  CASE operation WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_semester_audit_logs;
```

#### `student_module_audit_logs` → `audit_logs`

```sql
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'student_modules',
  student_module_id::text,
  CASE operation WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation) END,
  old_values,
  new_values,
  updated_by,
  COALESCE(updated_at, created_at, NOW()),
  CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
FROM student_module_audit_logs;
```

#### `assessments_audit` → `audit_logs`

```sql
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'assessments',
  assessment_id::text,
  CASE action WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(action) END,
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
FROM assessments_audit;
```

#### `assessment_marks_audit` → `audit_logs`

```sql
INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
SELECT
  'assessment_marks',
  assessment_mark_id::text,
  CASE action WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(action) END,
  CASE WHEN previous_marks IS NOT NULL THEN jsonb_build_object('marks', previous_marks) ELSE NULL END,
  CASE WHEN new_marks IS NOT NULL THEN jsonb_build_object('marks', new_marks) ELSE NULL END,
  created_by,
  COALESCE(date, NOW()),
  NULL
FROM assessment_marks_audit;
```

#### `clearance_audit` → `audit_logs`

```sql
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
```

> **Note**: The clearance audit table has a `modules` JSONB column (array of module codes) that records which modules were being registered. This is preserved in `metadata.modules`.

### 3. Verification

After migration, verify row counts:

```sql
SELECT 'student_audit_logs' AS source, COUNT(*) AS cnt FROM student_audit_logs
UNION ALL SELECT 'student_program_audit_logs', COUNT(*) FROM student_program_audit_logs
UNION ALL SELECT 'student_semester_audit_logs', COUNT(*) FROM student_semester_audit_logs
UNION ALL SELECT 'student_module_audit_logs', COUNT(*) FROM student_module_audit_logs
UNION ALL SELECT 'assessments_audit', COUNT(*) FROM assessments_audit
UNION ALL SELECT 'assessment_marks_audit', COUNT(*) FROM assessment_marks_audit
UNION ALL SELECT 'clearance_audit', COUNT(*) FROM clearance_audit
UNION ALL SELECT 'audit_logs (total)', COUNT(*) FROM audit_logs;
```

### 4. Do NOT Drop Legacy Tables

Legacy tables are preserved until Step 006 (Cleanup) for rollback safety.

## Validation Criteria

1. Migration executes without errors
2. Row counts in `audit_logs` match the sum of all legacy tables
3. Spot-check: sampled records match between legacy and unified tables
4. `changedBy` correctly mapped for all records
5. Operations correctly normalized to `'INSERT'`, `'UPDATE'`, `'DELETE'`
6. Legacy tables still exist (not dropped)
7. `metadata.reasons` correctly populated from legacy `reasons` columns

## Notes

- Run during a maintenance window if legacy tables are large
- The migration should be wrapped in a transaction for atomicity

### Batching Strategy for Large Tables

If any legacy table has >100k rows, wrap the INSERT...SELECT in a batched loop to avoid long-running transactions and excessive memory usage:

```sql
-- Example: batch migration for student_module_audit_logs (potentially largest table)
DO $$
DECLARE
  batch_size INT := 50000;
  total_rows INT;
  offset_val INT := 0;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM student_module_audit_logs;
  
  WHILE offset_val < total_rows LOOP
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by, changed_at, metadata)
    SELECT
      'student_modules',
      student_module_id::text,
      CASE operation WHEN 'create' THEN 'INSERT' WHEN 'update' THEN 'UPDATE' WHEN 'delete' THEN 'DELETE' ELSE UPPER(operation) END,
      old_values,
      new_values,
      updated_by,
      COALESCE(updated_at, created_at, NOW()),
      CASE WHEN reasons IS NOT NULL THEN jsonb_build_object('reasons', reasons) ELSE NULL END
    FROM student_module_audit_logs
    ORDER BY id
    LIMIT batch_size OFFSET offset_val;
    
    offset_val := offset_val + batch_size;
    RAISE NOTICE 'Migrated % / % rows', LEAST(offset_val, total_rows), total_rows;
  END LOOP;
END $$;
```

**When to use batching:**
1. Check row counts first: `SELECT COUNT(*) FROM student_module_audit_logs;`
2. If any table has <100k rows, use the simple INSERT...SELECT (no batching needed)
3. If >100k rows, use the batched DO block pattern above
4. Run `ANALYZE audit_logs;` after all migrations complete to update statistics

- Column-specific audit tables (`assessments_audit`, `clearance_audit`) produce partial JSON snapshots — acceptable since future operations will capture full rows
