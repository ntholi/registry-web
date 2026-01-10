# Step 2: Data Validation and Migration Execution

## Introduction

**Project:** CMS ID Decoupling Migration

**Purpose:** This multi-step migration decouples the Registry Web database from the external CMS by introducing independent nanoid-based primary keys. Currently, records must exist in the CMS before they can be created locally. After migration, records can be created independently with optional CMS linking.

**Migration Overview:**
- **Step 1 (completed):** Updated Drizzle schema files (added nanoid `id` PK, renamed old PK to `cmsId`, updated FK columns from integer to text) and generated/edited SQL migration file
- **Step 2 (this document):** Execute migration and validate data integrity
- **Step 3:** Update all TypeScript code (repositories, services, actions, routes, components)

---

## Objective

Execute the database migration and verify 100% data integrity through comprehensive validation scripts. This step ensures no data is lost, corrupted, or incorrectly mapped during the ID migration.

---

## Pre-Migration Setup

### 1. Create Pre-Migration Data Snapshots

Before running ANY migration, export the current database state to CSV files for comparison.

**Export location:** `backup_db/pre_migration/`

**Tables to export (12 core tables + students):**
- `students` - Export: `std_no`, `name`, `national_id`, `status`, all other columns (Note: PK behavior for this table does NOT change)
- `student_education` - Export: `id`, `std_no`, all other columns
- `next_of_kins` - Export: `id`, `std_no`, all other columns
- `schools` - Export: `id`, `code`, `name`, all other columns
- `programs` - Export: `id`, `code`, `name`, `school_id`, all other columns
- `structures` - Export: `id`, `code`, `program_id`, all other columns
- `structure_semesters` - Export: `id`, `structure_id`, `semester_number`, all other columns
- `student_programs` - Export: `id`, `std_no`, `structure_id`, all other columns
- `student_semesters` - Export: `id`, `student_program_id`, `structure_semester_id`, `term_code`, all other columns
- `modules` - Export: `id`, `code`, `name`, all other columns
- `semester_modules` - Export: `id`, `module_id`, `semester_id`, all other columns
- `student_modules` - Export: `id`, `semester_module_id`, `student_semester_id`, `marks`, `grade`, all other columns
- `module_prerequisites` - Export: `id`, `semester_module_id`, `prerequisite_id`, all other columns

**Tables to export (25 dependent tables with FK columns):**
- All dependent tables listed in Step 1 with their FK column values

**Tables to export (4 audit log tables):**
- `student_audit_logs` - Export: `id`, `std_no`, `old_values`, `new_values`, all other columns
- `student_program_audit_logs` - Export: `id`, `student_program_id`, `old_values`, `new_values`, all other columns
- `student_semester_audit_logs` - Export: `id`, `student_semester_id`, `old_values`, `new_values`, all other columns
- `student_module_audit_logs` - Export: `id`, `student_module_id`, `old_values`, `new_values`, all other columns

**Export method:** Use `psql` with `\COPY` command to export each table to CSV with headers.

### 2. Record Row Counts

Before migration, record exact row counts for ALL tables involved:

**Core tables row counts (expected):**
| Table | Expected Count |
|-------|----------------|
| students | 21,208 |
| student_education | 2,492 |
| next_of_kins | 11 |
| schools | 15 |
| programs | 102 |
| structures | 417 |
| structure_semesters | 2,702 |
| student_programs | 24,176 |
| student_semesters | 119,915 |
| modules | 4,059 |
| semester_modules | 13,035 |
| student_modules | 673,913 |
| module_prerequisites | 408 |

**Dependent tables row counts (expected):**
| Table | Expected Count |
|-------|----------------|
| applications | 0 |
| assessment_marks | 193,946 |
| assessments | 4,322 |
| assigned_modules | 1,583 |
| attendance | 1 |
| blocked_students | 296 |
| documents | 0 |
| entry_requirements | 0 |
| fortinet_registrations | 593 |
| graduation_requests | 900 |
| payment_receipts | 2,332 |
| registration_requests | 7,573 |
| requested_modules | 39,330 |
| sponsored_students | 4,556 |
| statement_of_results_prints | 4,877 |
| student_audit_logs | 13 |
| student_card_prints | 1,411 |
| student_module_audit_logs | 224 |
| student_program_audit_logs | 16 |
| student_semester_audit_logs | 2,372 |
| task_students | 0 |
| timetable_allocations | 0 |
| transcript_prints | 181 |
| user_schools | 209 |
| venue_schools | 0 |

### 3. Create ID Mapping Reference

Before migration, create a reference of old ID → expected new ID relationships. This will be used for FK validation.

For each of the 12 migrated core tables (excluding `students`), export a mapping that will be populated during migration:
- `schools`: old `id` (integer) → new `id` (nanoid), `cms_id` should equal old `id`
- `programs`: old `id` → new `id`, and old `school_id` → expected new `school_id`
- And so on for all migrated tables...

---

## Migration Execution

### 1. Ensure Backup Exists

Verify that `backup_db/restore.bat` works and a recent `.dump` file exists:
- File: `backup_db/registry-2026-01-07_13-28.dump` (or newer)
- Test restore by running: `backup_db\restore.bat`
- After test restore, re-export pre-migration data if needed

### 2. Run the Migration

Execute: `pnpm db:migrate`

**If migration fails:**
1. Note the error message
2. Run `backup_db\restore.bat` to restore database
3. Fix the migration SQL based on error
4. Retry migration

**Iterate until migration completes successfully.**

### 3. Create Post-Migration Data Snapshots

After successful migration, export the database state to CSV files for comparison.

**Export location:** `backup_db/post_migration/`

Export the same tables as pre-migration, but now with the new schema:
- Core tables (excluding `students`) will have `id` (nanoid) and `cms_id` (old integer, nullable)
- Dependent tables (excluding those referencing `students`) will have text FK columns
- `students` table structure remains UNCHANGED (PK is still `std_no`).

---

## Validation Scripts

### Category 1: Row Count Validation

**Purpose:** Verify no rows were lost during migration.

For EVERY table involved in the migration:
1. Count rows in post-migration table
2. Compare to pre-migration count
3. Assert counts are EXACTLY equal

**Expected result:** All counts match exactly. Zero tolerance for data loss.

### Category 2: Core Table Data Integrity

**Purpose:** Verify all data in core tables is preserved exactly.

For each of the 12 migrated core tables (excluding `students`):

1. **cms_id Preservation:**
   - Every record that had an old integer ID should have that exact value in `cms_id`
   - Query: For each pre-migration row, verify `cms_id` equals the old `id` value

2. **New ID Generation:**
   - Every record must have a non-NULL `id` (nanoid)
   - All `id` values must be unique
   - All `id` values must be 21 characters (nanoid default length)
   - All `id` values must only contain valid nanoid characters: `[A-Za-z0-9_-]`

3. **Data Column Preservation:**
   - For each data column (not ID/FK columns), verify values match exactly
   - Compare pre-migration CSV to post-migration CSV
   - NULL values must remain NULL
   - Text values must be byte-for-byte identical
   - Numeric values must be exactly equal
   - Timestamps must be exactly equal (or within acceptable precision)

**For `students` table explicitly:**
- Verify `std_no` is preserved and remains PK (bigint).
- Verify other data columns are preserved.

### Category 3: Foreign Key Mapping Validation

**Purpose:** Verify all FK relationships are correctly mapped from old IDs to new IDs.

This is the MOST CRITICAL validation. For each FK relationship:

**Pattern for validation:**

1. Load pre-migration parent table (e.g., `schools` with old `id`)
2. Load post-migration parent table (e.g., `schools` with new `id` and `cms_id`)
3. Create mapping: old_id (from `cms_id`) → new_id
4. Load pre-migration child table (e.g., `programs` with old `school_id`)
5. Load post-migration child table (e.g., `programs` with new `school_id`)
6. For each row:
   - Look up what the old FK value was
   - Look up what new ID the old FK should map to
   - Verify the post-migration FK equals the expected new ID

**Specific FK validations to perform (excluding `students` references as they don't change):**

| Child Table | FK Column | Parent Table | Parent PK |
|-------------|-----------|--------------|-----------|
| programs | school_id | schools | id |
| structures | program_id | programs | id |
| structure_semesters | structure_id | structures | id |
| student_programs | structure_id | structures | id |
| student_semesters | student_program_id | student_programs | id |
| student_semesters | structure_semester_id | structure_semesters | id |
| semester_modules | module_id | modules | id |
| semester_modules | semester_id | structure_semesters | id |
| student_modules | semester_module_id | semester_modules | id |
| student_modules | student_semester_id | student_semesters | id |
| module_prerequisites | semester_module_id | semester_modules | id |
| module_prerequisites | prerequisite_id | semester_modules | id |
| requested_modules | semester_module_id | semester_modules | id |
| graduation_requests | student_program_id | student_programs | id |
| fortinet_registrations | school_id | schools | id |
| user_schools | school_id | schools | id |
| venue_schools | school_id | schools | id |
| assessments | module_id | modules | id |
| assigned_modules | semester_module_id | semester_modules | id |
| attendance | semester_module_id | semester_modules | id |
| timetable_allocations | semester_module_id | semester_modules | id |
| assessment_marks | student_module_id | student_modules | id |
| applications | first_choice_program_id | programs | id |
| applications | second_choice_program_id | programs | id |
| entry_requirements | program_id | programs | id |

### Category 4: Audit Log Table Validation

**Purpose:** Verify audit log tables correctly reference CMS IDs.

For audit log tables, the FK should point to the `cms_id` column, NOT the new `id`:

1. **student_audit_logs:**
   - `std_no` should still reference `students.std_no`
   - Every `std_no` value in audit logs should exist in `students.std_no`

2. **student_program_audit_logs:**
   - `student_program_cms_id` should reference `student_programs.cms_id`
   - Every value should exist in `student_programs.cms_id`
   - NEW: `student_program_id` should reference `student_programs.id` (optional, for local linking)

3. **student_semester_audit_logs:**
   - `student_semester_cms_id` should reference `student_semesters.cms_id`
   - Every value should exist in `student_semesters.cms_id`

4. **student_module_audit_logs:**
   - `student_module_cms_id` should reference `student_modules.cms_id`
   - Every value should exist in `student_modules.cms_id`

### Category 5: JSONB Data Validation (Audit Logs)

**Purpose:** Verify JSONB `old_values` and `new_values` columns are preserved exactly.

The JSONB columns contain historical snapshots with the OLD ID structure. These should NOT be modified:

1. For each audit log table, compare pre and post migration JSONB values
2. The JSONB content should be BYTE-FOR-BYTE identical
3. These columns intentionally retain the old integer ID format for historical accuracy

### Category 6: Unique Constraint Validation

**Purpose:** Verify unique constraints are working correctly.

1. **cms_id uniqueness:** For each core table, verify no duplicate non-NULL `cms_id` values exist
2. **id uniqueness:** For each table, verify all `id` values are unique
3. **Business key uniqueness:** Verify existing unique constraints still work:
   - `schools.code` - unique
   - `programs.code` - unique
   - `structures.code` - unique
   - `module_prerequisites(semester_module_id, prerequisite_id)` - unique pair

### Category 7: Referential Integrity Validation

**Purpose:** Verify all FK constraints are properly enforced.

For each FK relationship, verify:
1. The FK constraint exists in the database
2. No orphaned records exist (FK values that don't exist in parent table)
3. ON DELETE behavior is correctly configured

Query `information_schema.table_constraints` and `information_schema.referential_constraints` to verify:
- All expected FK constraints exist
- DELETE rules match expected (CASCADE, SET NULL, RESTRICT, NO ACTION)

### Category 8: Deep Data Comparison

**Purpose:** Full row-by-row comparison of all data.

For tables with manageable row counts (< 50,000 rows), perform full comparison:

1. **Join pre and post data on cms_id (or std_no for students)**
2. **Compare every column value**
3. **Report any differences**

For large tables (student_modules: 673,913 rows, assessment_marks: 193,946 rows):
1. Sample 10,000 random rows
2. Perform full comparison on sample
3. Also verify aggregate statistics (COUNT, SUM of numeric columns, etc.)

### Category 9: Relationship Chain Validation

**Purpose:** Verify multi-table relationships are intact.

Validate complex join queries still return correct results:

1. **Student → Program → Structure → School chain:**
   - Join students → student_programs → structures → programs → schools
   - Verify row count matches pre-migration
   - Verify correct school is associated with each student

2. **Student → Semester → Modules chain:**
   - Join students → student_programs → student_semesters → student_modules → semester_modules → modules
   - Verify row count matches pre-migration
   - Verify correct modules are associated with each student semester

3. **Module → Prerequisites chain:**
   - Join semester_modules → module_prerequisites → semester_modules (self-join)
   - Verify prerequisite relationships are intact

---

## Validation Script Implementation

### Script Structure

Create validation scripts in: `backup_db/validation/`

**Recommended approach:**
1. Create a single TypeScript/SQL script that runs ALL validations
2. Output results to a report file
3. Script should exit with non-zero code if ANY validation fails
4. Use database transactions for consistency during validation

### Running Validations

1. After migration, run: `pnpm tsx backup_db/validation/validate-migration.ts`
2. Review output report
3. If ANY validation fails:
   - Run `backup_db\restore.bat` to restore database
   - Fix the migration SQL
   - Re-run migration
   - Re-run validations
4. Repeat until ALL validations pass

### Validation Report Format

The validation script should output:
- Total tests run
- Tests passed
- Tests failed
- For each test: name, status, details if failed
- Summary: PASS or FAIL

Example output:
```
=== Migration Validation Report ===
Date: 2026-01-09
Pre-migration snapshot: backup_db/pre_migration/
Post-migration snapshot: backup_db/post_migration/

[PASS] Row count: students (21208 = 21208)
[PASS] Row count: student_education (2492 = 2492)
...
[PASS] FK mapping: programs.school_id (102/102 correct)
[PASS] FK mapping: structures.program_id (417/417 correct)
...
[FAIL] FK mapping: student_modules.semester_module_id (673900/673913 correct, 13 mismatches)
  - Row 45231: expected 'abc123', got 'xyz789'
  ...

=== Summary ===
Total tests: 150
Passed: 149
Failed: 1
Result: FAIL
```

---

## Rollback Procedure

If validation fails and cannot be fixed:

1. Run `backup_db\restore.bat`
2. Verify database is restored: check row counts match pre-migration counts
3. Review migration SQL for errors
4. Fix migration SQL
5. Re-run migration
6. Re-run validations

**Maximum iterations:** Continue until 100% validation pass. Do not proceed to Step 3 until ALL validations pass.

---

## Success Criteria

Migration is considered successful ONLY when ALL of the following are true:

- [ ] `pnpm db:migrate` completes without errors
- [ ] All row counts match exactly (zero data loss)
- [ ] All cms_id values equal original integer IDs
- [ ] All new nanoid IDs are valid format (21 chars, correct alphabet)
- [ ] All FK mappings are 100% correct
- [ ] All audit log FK references are correct
- [ ] All JSONB data is preserved byte-for-byte
- [ ] All unique constraints are enforced
- [ ] All FK constraints exist and are correctly configured
- [ ] Deep data comparison shows zero differences
- [ ] Relationship chain queries return correct results

**Only proceed to Step 3 when ALL criteria are met.**

---

## Database Connection

Connection string for validation scripts:
```
postgresql://dev:111111@localhost:5432/registry
```

Use `psql` with `-P pager=off` for non-interactive output.

---

## Notes

- This step may take several hours due to the size of the data (673,913 student_modules, 193,946 assessment_marks)
- The validation scripts should be idempotent (can run multiple times)
- Keep all CSV exports for audit trail
- Document any issues encountered and resolutions
