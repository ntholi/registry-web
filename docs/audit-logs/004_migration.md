# Step 004: Migration of Existing Audit Tables

## Introduction

With the unified `audit_logs` table and triggers in place, this step migrates data from the 7 existing audit tables into the new unified table, then deprecates the old tables.

## Context

The existing audit tables contain valuable historical data that must be preserved. Each legacy table uses a slightly different schema, so the migration must normalize the data into the unified format.

## Requirements

### 1. Migration Script

Create a custom migration via `pnpm db:generate --custom` that copies data from each legacy table.

#### Mapping: `student_audit_logs` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'students'` (literal) |
| `std_no` | `record_id` | `std_no::text` |
| `operation` | `operation` | `UPPER(operation)` → `'create'`→`'INSERT'`, `'update'`→`'UPDATE'` |
| `old_values` | `old_values` | Direct copy |
| `new_values` | `new_values` | Direct copy |
| `updated_by` | `changed_by` | Direct copy |
| `updated_at` | `changed_at` | Direct copy |
| `reasons` | `metadata` | `jsonb_build_object('reasons', reasons)` when not null |

#### Mapping: `student_program_audit_logs` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'student_programs'` |
| `student_program_id` | `record_id` | `student_program_id::text` |
| `operation` | `operation` | `UPPER(operation)` map: `'create'`→`'INSERT'`, `'update'`→`'UPDATE'` |
| `old_values` | `old_values` | Direct copy |
| `new_values` | `new_values` | Direct copy |
| `updated_by` | `changed_by` | Direct copy |
| `updated_at` | `changed_at` | Direct copy || `reasons` | `metadata` | `jsonb_build_object('reasons', reasons)` when not null |
#### Mapping: `student_semester_audit_logs` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'student_semesters'` |
| `student_semester_id` | `record_id` | `student_semester_id::text` |
| `operation` | `operation` | Same mapping as above |
| `old_values` | `old_values` | Direct copy |
| `new_values` | `new_values` | Direct copy |
| `updated_by` | `changed_by` | Direct copy |
| `updated_at` | `changed_at` | Direct copy || `reasons` | `metadata` | `jsonb_build_object('reasons', reasons)` when not null |
#### Mapping: `student_module_audit_logs` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'student_modules'` |
| `student_module_id` | `record_id` | `student_module_id::text` |
| `operation` | `operation` | Same mapping as above |
| `old_values` | `old_values` | Direct copy |
| `new_values` | `new_values` | Direct copy |
| `updated_by` | `changed_by` | Direct copy |
| `updated_at` | `changed_at` | Direct copy || `reasons` | `metadata` | `jsonb_build_object('reasons', reasons)` when not null |
#### Mapping: `assessments_audit` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'assessments'` |
| `assessment_id` | `record_id` | `assessment_id::text` |
| `action` | `operation` | `UPPER(action)` → map `'create'`→`'INSERT'`, etc. |
| — | `old_values` | Build JSON from `previous_*` columns |
| — | `new_values` | Build JSON from `new_*` columns |
| `created_by` | `changed_by` | Direct copy |
| `date` | `changed_at` | Direct copy |

#### Mapping: `assessment_marks_audit` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'assessment_marks'` |
| `assessment_mark_id` | `record_id` | `assessment_mark_id::text` |
| `action` | `operation` | Same mapping |
| — | `old_values` | `jsonb_build_object('marks', previous_marks)` |
| — | `new_values` | `jsonb_build_object('marks', new_marks)` |
| `created_by` | `changed_by` | Direct copy |
| `date` | `changed_at` | Direct copy |

#### Mapping: `clearance_audit` → `audit_logs`

| Source Column | Target Column | Transform |
|--------------|---------------|-----------|
| — | `table_name` | `'clearance'` |
| `clearance_id` | `record_id` | `clearance_id::text` |
| — | `operation` | `'UPDATE'` (all clearance audits are status changes) |
| — | `old_values` | `jsonb_build_object('status', previous_status, 'modules', modules)` |
| — | `new_values` | `jsonb_build_object('status', new_status, 'message', message, 'modules', modules)` |
| `created_by` | `changed_by` | Direct copy |
| `date` | `changed_at` | Direct copy |
| `message` | `metadata` | `jsonb_build_object('reasons', message)` when message is not null |

### 2. Verification Query

After migration, verify row counts:

```sql
SELECT 'student_audit_logs' AS source, COUNT(*) FROM student_audit_logs
UNION ALL SELECT 'student_program_audit_logs', COUNT(*) FROM student_program_audit_logs
UNION ALL SELECT 'student_semester_audit_logs', COUNT(*) FROM student_semester_audit_logs
UNION ALL SELECT 'student_module_audit_logs', COUNT(*) FROM student_module_audit_logs
UNION ALL SELECT 'assessments_audit', COUNT(*) FROM assessments_audit
UNION ALL SELECT 'assessment_marks_audit', COUNT(*) FROM assessment_marks_audit
UNION ALL SELECT 'clearance_audit', COUNT(*) FROM clearance_audit
UNION ALL SELECT 'audit_logs (total)', COUNT(*) FROM audit_logs;
```

The total in `audit_logs` should equal the sum of all legacy tables (plus any new entries from triggers).

### 3. Do NOT Drop Legacy Tables Yet

Legacy tables are NOT dropped in this step. They are dropped in Step 6 (Cleanup) after verification. This allows rollback if issues are found.

## Expected Files

| File | Purpose |
|------|---------|
| `drizzle/XXXX_custom_migrate_audit_data.sql` | Custom migration with INSERT...SELECT statements |

## Validation Criteria

1. Migration runs without errors
2. Row counts match between legacy and unified tables
3. Spot-check: a few records from each legacy table exist correctly in `audit_logs`
4. `changedBy` is correctly mapped for all records
5. Operations are correctly normalized (`'INSERT'`, `'UPDATE'`, `'DELETE'`)
6. Legacy tables still exist (not dropped yet)

## Notes

- Run this migration during a maintenance window if the audit tables are large
- The migration should be wrapped in a transaction for atomicity
- Consider batching if any legacy table has >100k rows to avoid locking
- The `assessments_audit` and `clearance_audit` tables use column-specific storage, so the JSON reconstruction may not capture all original fields — this is acceptable since the new triggers will capture full snapshots going forward
