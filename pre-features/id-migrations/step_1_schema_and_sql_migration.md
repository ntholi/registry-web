# Step 1: Schema and SQL Migration

## Introduction

**Project:** CMS ID Decoupling Migration

**Purpose:** This multi-step migration decouples the Registry Web database from the external CMS by introducing independent nanoid-based primary keys. Currently, records must exist in the CMS before they can be created locally. After migration, records can be created independently with optional CMS linking.

**Migration Overview:**
- **Step 1 (this document):** Update Drizzle schema files and generate/edit SQL migration
- **Step 2:** Execute migration and validate data integrity with comprehensive tests
- **Step 3:** Update all TypeScript code (repositories, services, actions, routes, components)

---

## Objective

Decouple the primary keys of 13 core tables from the CMS system by:
1. Adding a new `id` column (text, nanoid) as the new PRIMARY KEY
2. Renaming/repurposing the old integer/bigint PK to `cmsId` (nullable, unique) for CMS sync purposes
3. Updating all 25+ dependent tables to reference the new nanoid `id` instead of the old integer/bigint PK
4. Updating 4 audit log tables to reference the CMS ID fields for sync tracking

## Why This Migration?

The current system requires records to exist in the CMS before they can be created locally. This migration enables:
- Creating records locally without first creating them in the CMS
- Optional CMS linking via the `cmsId` field when syncing is needed
- Independent record identification via nanoid `id`

---

## Tables Overview

### 12 Core Tables to Migrate (with row counts)

Note: `students` table is EXCLUDED from this migration. It will retain `std_no` (bigint) as its Primary Key.

| Table | Current PK | Current Type | New PK Type | CMS Field | Row Count |
|-------|-----------|--------------|-------------|-----------|-----------|
| `student_education` | `id` | serial | text (nanoid) | `cms_id` | 2,492 |
| `next_of_kins` | `id` | serial | text (nanoid) | `cms_id` | 11 |
| `schools` | `id` | serial | text (nanoid) | `cms_id` | 15 |
| `programs` | `id` | serial | text (nanoid) | `cms_id` | 102 |
| `structures` | `id` | serial | text (nanoid) | `cms_id` | 417 |
| `structure_semesters` | `id` | serial | text (nanoid) | `cms_id` | 2,702 |
| `student_programs` | `id` | serial | text (nanoid) | `cms_id` | 24,176 |
| `student_semesters` | `id` | serial | text (nanoid) | `cms_id` | 119,915 |
| `modules` | `id` | serial | text (nanoid) | `cms_id` | 4,059 |
| `semester_modules` | `id` | serial | text (nanoid) | `cms_id` | 13,035 |
| `student_modules` | `id` | serial | text (nanoid) | `cms_id` | 673,913 |
| `module_prerequisites` | `id` | serial | text (nanoid) | `cms_id` | 408 |

### Dependent Tables with FK References to Core Tables

These tables have foreign keys pointing to the core tables. All FK columns must change from integer/bigint to text (nanoid).

> **Important:** Foreign keys referencing `students.std_no` remain as `bigint` and are NOT migrated to nanoid.

| Dependent Table | FK Column(s) | References | ON DELETE | Row Count |
|-----------------|--------------|------------|-----------|-----------|
| `programs` | `school_id` | `schools.id` | CASCADE | 102 |
| `structures` | `program_id` | `programs.id` | CASCADE | 417 |
| `structure_semesters` | `structure_id` | `structures.id` | CASCADE | 2,702 |
| `student_programs` | `structure_id` | `structures.id` | CASCADE | 24,176 |
| `student_semesters` | `student_program_id` | `student_programs.id` | CASCADE | 119,915 |
| `student_semesters` | `structure_semester_id` | `structure_semesters.id` | CASCADE | 119,915 |
| `semester_modules` | `module_id` | `modules.id` | NO ACTION | 13,035 |
| `semester_modules` | `semester_id` | `structure_semesters.id` | SET NULL | 13,035 |
| `student_modules` | `semester_module_id` | `semester_modules.id` | CASCADE | 673,913 |
| `student_modules` | `student_semester_id` | `student_semesters.id` | CASCADE | 673,913 |
| `module_prerequisites` | `semester_module_id` | `semester_modules.id` | CASCADE | 408 |
| `module_prerequisites` | `prerequisite_id` | `semester_modules.id` | CASCADE | 408 |
| `requested_modules` | `semester_module_id` | `semester_modules.id` | CASCADE | 39,330 |
| `graduation_requests` | `student_program_id` | `student_programs.id` | CASCADE | 900 |
| `fortinet_registrations` | `school_id` | `schools.id` | CASCADE | 593 |
| `user_schools` | `school_id` | `schools.id` | CASCADE | 209 |
| `venue_schools` | `school_id` | `schools.id` | CASCADE | 0 |
| `assessments` | `module_id` | `modules.id` | CASCADE | 4,322 |
| `assigned_modules` | `semester_module_id` | `semester_modules.id` | CASCADE | 1,583 |
| `attendance` | `semester_module_id` | `semester_modules.id` | CASCADE | 1 |
| `timetable_allocations` | `semester_module_id` | `semester_modules.id` | CASCADE | 0 |
| `assessment_marks` | `student_module_id` | `student_modules.id` | CASCADE | 193,946 |
| `applications` | `first_choice_program_id` | `programs.id` | RESTRICT | 0 |
| `applications` | `second_choice_program_id` | `programs.id` | RESTRICT | 0 |
| `entry_requirements` | `program_id` | `programs.id` | CASCADE | 0 |
| `module_grades_delete_this` | `module_id` | `modules.id` | CASCADE | (to be dropped) |

### 4 Audit Log Tables (Special Handling)

These tables track CMS sync operations. They should reference the CMS ID field (not the new nanoid ID) because their purpose is to track what needs to be synced TO the CMS.

| Audit Log Table | Current FK | New FK Name | References | Row Count |
|-----------------|------------|-------------|------------|-----------|
| `student_audit_logs` | `std_no` | `std_no` (keep) | `students.std_no` | 13 |
| `student_program_audit_logs` | `student_program_id` | `student_program_cms_id` | `student_programs.cms_id` | 16 |
| `student_semester_audit_logs` | `student_semester_id` | `student_semester_cms_id` | `student_semesters.cms_id` | 2,372 |
| `student_module_audit_logs` | `student_module_id` | `student_module_cms_id` | `student_modules.cms_id` | 224 |

---

## Schema File Locations

### Core Tables (to modify PKs)

| Table | Schema File |
|-------|-------------|
| `student_education`, `next_of_kins`, `student_programs`, `student_semesters`, `student_modules` | `src/app/registry/_database/schema/students.ts` |
| `schools`, `programs` | `src/app/academic/_database/schema/schools.ts` |
| `structures`, `structure_semesters` | `src/app/academic/_database/schema/structures.ts` |
| `modules`, `semester_modules`, `module_prerequisites` | `src/app/academic/_database/schema/modules.ts` |

### Dependent Tables (to modify FKs)

| Table | Schema File |
|-------|-------------|
| `requested_modules` | `src/app/registry/_database/schema/registration.ts` |
| `graduation_requests` | `src/app/registry/_database/schema/graduation.ts` |
| `assessments`, `assessment_marks` | `src/app/academic/_database/schema/assessments.ts` |
| `assigned_modules`, `attendance` | `src/app/academic/_database/schema/attendance.ts` |
| `fortinet_registrations` | `src/app/admin/_database/schema/fortinet.ts` |
| `user_schools` | `src/app/auth/_database/schema/user-schools.ts` |
| `venue_schools` | `src/app/timetable/_database/schema/venues.ts` |
| `timetable_allocations` | `src/app/timetable/_database/schema/timetable-allocations.ts` |
| `applications`, `entry_requirements` | `src/app/registry/_database/schema/` (search for exact file) |

### Audit Log Tables (special handling)

| Table | Schema File |
|-------|-------------|
| `student_program_audit_logs` | `src/app/audit-logs/_database/schema/student-programs.ts` |
| `student_semester_audit_logs` | `src/app/audit-logs/_database/schema/student-semesters.ts` |
| `student_module_audit_logs` | `src/app/audit-logs/_database/schema/student-modules.ts` |

---

## Implementation Instructions

### Phase 1: Update All Schema Files (TypeScript/Drizzle)

#### 1.1 Core Tables - Add nanoid ID, Convert Old PK to cmsId

For each of the 12 core tables, the pattern is:
- Import `nanoid` from `'nanoid'`
- Add new `id: text().primaryKey().$defaultFn(() => nanoid())`
- Rename old PK column to `cmsId`
- Change old PK from `.primaryKey()` to just a nullable integer/bigint with `.unique()`

**Detailed steps:**
- Rename `id: serial().primaryKey()` to `cmsId: integer().unique()` (or bigint depending on original type)
- Add new `id: text().primaryKey().$defaultFn(() => nanoid())`

#### 1.2 Dependent Tables - Update FK Column Types

For each dependent table that references a core table (excluding references to `students`):
- Change FK column type from `integer()` or `bigint()` to `text()`
- Update the `.references()` to point to the new `id` column (not `cmsId`)
- Preserve the existing `onDelete` behavior (CASCADE, SET NULL, RESTRICT, NO ACTION)

**Example transformation:**
```
Before: schoolId: integer().references(() => schools.id, { onDelete: 'cascade' })
After:  schoolId: text().references(() => schools.id, { onDelete: 'cascade' })
```

**Note:** FKs referencing `students.std_no` should remain as `bigint` and should NOT be changed.

#### 1.3 Audit Log Tables - Reference CMS ID Fields

The audit logs are used for CMS sync tracking. They need to reference the CMS ID fields:

**`student_audit_logs`:**
- No changes needed (`stdNo` remains the PK and CMS ID for students).

**`student_program_audit_logs`:**
- Change `studentProgramId: integer().references(() => studentPrograms.id, ...)`
- To: `studentProgramCmsId: integer().references(() => studentPrograms.cmsId, ...)`
- Also add: `studentProgramId: text().references(() => studentPrograms.id, ...)` for linking to local record

**`student_semester_audit_logs`:** Same pattern as above

**`student_module_audit_logs`:** Same pattern as above

### Phase 2: Generate Drizzle Migration

After updating all schema files:

1. Run `pnpm db:generate` to generate the migration SQL
2. The generated migration will likely be incomplete or incorrect for this complex change
3. You will need to manually edit the generated SQL file to handle:
   - Proper ordering of operations (drop FK constraints before altering columns)
   - Data migration (populating new ID columns, mapping old FK values to new)
   - Constraint recreation

### Phase 3: Create/Edit Migration SQL

The migration SQL must be structured in this exact order:

#### 3.1 Create Nanoid Function in PostgreSQL

Create a PL/pgSQL function that generates nanoid strings. This is needed to populate existing rows with new IDs during migration.

The function should:
- Generate 21-character alphanumeric strings
- Use the same alphabet as JS nanoid: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-`
- Be deterministic and fast for batch operations

#### 3.2 Migration Order (Critical!)

The SQL must follow this dependency order to avoid FK constraint violations:

**Step A: Drop ALL foreign key constraints** that reference any of the 12 core tables (excluding `students`).

**Step B: For each core table (in dependency order, leaves first):**

1. `module_prerequisites` (leaf - only references `semester_modules`)
2. `student_modules` (references `semester_modules`, `student_semesters`)
3. `semester_modules` (references `modules`, `structure_semesters`)
4. `student_semesters` (references `student_programs`, `structure_semesters`)
5. `structure_semesters` (references `structures`)
6. `student_programs` (references `structures` - student reference unchanged)
7. `structures` (references `programs`)
8. `programs` (references `schools`)
9. `schools` (root)
10. `modules` (root)
11. `student_education` (references `students` - unchanged FK)
12. `next_of_kins` (references `students` - unchanged FK)

For each table:
1. Add `new_id TEXT` column
2. Update all rows: `SET new_id = nanoid()`
3. Add NOT NULL constraint to `new_id`
4. Drop PRIMARY KEY constraint
5. Rename `id` → `cms_id`
6. Rename `new_id` → `id`
7. Add PRIMARY KEY on `id`
8. Add UNIQUE constraint on `cms_id`
9. Make `cms_id` nullable (ALTER COLUMN DROP NOT NULL)

**Step C: Create ID mapping tables (temporary)**

For each core table (excluding `students`), we need to map old integer IDs to new nanoid IDs so dependent tables can be updated:

```sql
-- Example for schools
CREATE TEMP TABLE schools_id_map AS
SELECT cms_id AS old_id, id AS new_id FROM schools WHERE cms_id IS NOT NULL;
```

**Step D: Update dependent tables' FK columns**

For each dependent table (excluding columns referencing `students`):
1. Add new text FK column (e.g., `new_school_id TEXT`)
2. Populate via JOIN on the mapping table
3. Drop the old integer FK column
4. Rename new column to original name
5. Add NOT NULL if the original was NOT NULL

**Step E: Recreate ALL foreign key constraints**

Recreate all FK constraints with:
- Text type for FKs pointing to nanoid `id` columns
- Integer/bigint type for FKs pointing to `cms_id` (audit logs only)
- Same ON DELETE behavior as before
- **Note:** FKs referencing `students` did not change, so they should not need recreation unless dropped in Step A (which they shouldn't be).

**Step F: Recreate indexes**

All indexes on modified FK columns need to be recreated since the column types changed.

**Step G: Drop temporary mapping tables and nanoid function**

Clean up temporary objects created during migration.

---

## Unique Constraints and Nullable cms_id

PostgreSQL UNIQUE constraints allow multiple NULL values. This means:
- Multiple records can have `cms_id = NULL` (records not yet synced to CMS)
- Only one record can have any specific non-NULL `cms_id` value
- This is exactly the desired behavior

---

## Relations Files to Update

After schema changes, update the Drizzle relations files:
- `src/app/registry/_database/relations.ts`
- `src/app/academic/_database/relations.ts`
- `src/app/audit-logs/_database/relations.ts`
- `src/app/finance/_database/relations.ts`
- `src/app/admin/_database/relations.ts`
- `src/app/timetable/_database/relations.ts`
- `src/app/auth/_database/relations.ts`

Update field names in `fields` and `references` arrays to match new column names.

---

## Checklist Before Running Migration

- [ ] All 12 core table schemas updated with nanoid ID and cmsId
- [ ] All dependent table schemas updated with text FK columns (excluding `students` references)
- [ ] All audit log schemas updated to reference cmsId fields (excluding `students` logs)
- [ ] All relations files updated
- [ ] Migration SQL generated via `pnpm db:generate`
- [ ] Migration SQL manually edited for correct ordering and data migration
- [ ] TypeScript compiles without errors: `pnpm tsc --noEmit`
- [ ] Linting passes: `pnpm lint:fix`
- [ ] Database backup exists in `backup_db/` directory

---

## Notes

- Do NOT run `pnpm db:migrate` in this step - that is Step 2
- The Drizzle-generated migration will need significant manual editing
- Use `pnpm db:generate --custom` if you want to create a custom migration file
- Always verify the migration SQL before running it
