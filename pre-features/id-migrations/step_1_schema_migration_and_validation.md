# Step 1: Schema Migration, Execution & Data Integrity Validation

## Introduction

**Project:** CMS ID Tracking Migration

**Purpose:** Add a `cms_id` column to track which records originated from the external CMS system. This enables distinguishing between CMS-imported records and locally-created records.

**Key Principle:** The existing `id` (serial/integer) remains the PRIMARY KEY. We are ONLY adding a new nullable `cms_id` column.

---

## Objective

Add a nullable `cms_id` column to 12 core tables:
- For existing records: `cms_id` = current `id` value (these came from CMS)
- For future locally-created records: `cms_id` = NULL (not from CMS)

**What this migration does NOT do:**
- Does NOT change the primary key
- Does NOT change any foreign keys
- Does NOT change any column types
- Does NOT affect dependent tables
- Does NOT use nanoid or any string IDs

---

## Tables to Migrate

### 12 Core Tables

| Table | Current PK | Add Column | Row Count |
|-------|-----------|------------|-----------|
| `student_education` | `id` (serial) | `cms_id` (integer, nullable, unique) | 2,492 |
| `next_of_kins` | `id` (serial) | `cms_id` (integer, nullable, unique) | 11 |
| `schools` | `id` (serial) | `cms_id` (integer, nullable, unique) | 15 |
| `programs` | `id` (serial) | `cms_id` (integer, nullable, unique) | 102 |
| `structures` | `id` (serial) | `cms_id` (integer, nullable, unique) | 417 |
| `structure_semesters` | `id` (serial) | `cms_id` (integer, nullable, unique) | 2,702 |
| `student_programs` | `id` (serial) | `cms_id` (integer, nullable, unique) | 24,176 |
| `student_semesters` | `id` (serial) | `cms_id` (integer, nullable, unique) | 119,915 |
| `modules` | `id` (serial) | `cms_id` (integer, nullable, unique) | 4,059 |
| `semester_modules` | `id` (serial) | `cms_id` (integer, nullable, unique) | 13,035 |
| `student_modules` | `id` (serial) | `cms_id` (integer, nullable, unique) | 673,913 |
| `module_prerequisites` | `id` (serial) | `cms_id` (integer, nullable, unique) | 408 |

**Note:** `students` table is EXCLUDED. It uses `std_no` (bigint) as its identifier.

---

## Schema File Locations

| Table | Schema File |
|-------|-------------|
| `student_education`, `next_of_kins` | `src/app/registry/_database/schema/students.ts` |
| `student_programs`, `student_semesters`, `student_modules` | `src/app/registry/_database/schema/students.ts` |
| `schools`, `programs` | `src/app/academic/_database/schema/schools.ts` |
| `structures`, `structure_semesters` | `src/app/academic/_database/schema/structures.ts` |
| `modules`, `semester_modules`, `module_prerequisites` | `src/app/academic/_database/schema/modules.ts` |

---

## Part A: Schema Changes

### Phase 1: Update Schema Files (Drizzle)

For each of the 12 core tables, add a `cmsId` column:

```typescript
// Example for schools table
export const schools = pgTable('schools', {
  id: serial().primaryKey(),
  cmsId: integer().unique(),  // <-- ADD THIS LINE
  code: text().notNull().unique(),
  name: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow(),
});
```

**Pattern for all 12 tables:**
```typescript
cmsId: integer().unique(),  // nullable by default, unique constraint
```

### Phase 2: Generate Drizzle Migration

Run: `pnpm db:generate`

### Phase 3: Edit Migration SQL

After generation, edit the SQL migration file to populate existing records.

**Complete migration SQL structure:**

```sql
-- ============================================
-- SCHOOLS
-- ============================================
ALTER TABLE "schools" ADD COLUMN "cms_id" integer;
UPDATE "schools" SET "cms_id" = "id";
ALTER TABLE "schools" ADD CONSTRAINT "schools_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- PROGRAMS
-- ============================================
ALTER TABLE "programs" ADD COLUMN "cms_id" integer;
UPDATE "programs" SET "cms_id" = "id";
ALTER TABLE "programs" ADD CONSTRAINT "programs_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- STRUCTURES
-- ============================================
ALTER TABLE "structures" ADD COLUMN "cms_id" integer;
UPDATE "structures" SET "cms_id" = "id";
ALTER TABLE "structures" ADD CONSTRAINT "structures_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- STRUCTURE_SEMESTERS
-- ============================================
ALTER TABLE "structure_semesters" ADD COLUMN "cms_id" integer;
UPDATE "structure_semesters" SET "cms_id" = "id";
ALTER TABLE "structure_semesters" ADD CONSTRAINT "structure_semesters_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- MODULES
-- ============================================
ALTER TABLE "modules" ADD COLUMN "cms_id" integer;
UPDATE "modules" SET "cms_id" = "id";
ALTER TABLE "modules" ADD CONSTRAINT "modules_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- SEMESTER_MODULES
-- ============================================
ALTER TABLE "semester_modules" ADD COLUMN "cms_id" integer;
UPDATE "semester_modules" SET "cms_id" = "id";
ALTER TABLE "semester_modules" ADD CONSTRAINT "semester_modules_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- MODULE_PREREQUISITES
-- ============================================
ALTER TABLE "module_prerequisites" ADD COLUMN "cms_id" integer;
UPDATE "module_prerequisites" SET "cms_id" = "id";
ALTER TABLE "module_prerequisites" ADD CONSTRAINT "module_prerequisites_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- STUDENT_EDUCATION
-- ============================================
ALTER TABLE "student_education" ADD COLUMN "cms_id" integer;
UPDATE "student_education" SET "cms_id" = "id";
ALTER TABLE "student_education" ADD CONSTRAINT "student_education_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- NEXT_OF_KINS
-- ============================================
ALTER TABLE "next_of_kins" ADD COLUMN "cms_id" integer;
UPDATE "next_of_kins" SET "cms_id" = "id";
ALTER TABLE "next_of_kins" ADD CONSTRAINT "next_of_kins_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- STUDENT_PROGRAMS
-- ============================================
ALTER TABLE "student_programs" ADD COLUMN "cms_id" integer;
UPDATE "student_programs" SET "cms_id" = "id";
ALTER TABLE "student_programs" ADD CONSTRAINT "student_programs_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- STUDENT_SEMESTERS
-- ============================================
ALTER TABLE "student_semesters" ADD COLUMN "cms_id" integer;
UPDATE "student_semesters" SET "cms_id" = "id";
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_cms_id_unique" UNIQUE("cms_id");

-- ============================================
-- STUDENT_MODULES
-- ============================================
ALTER TABLE "student_modules" ADD COLUMN "cms_id" integer;
UPDATE "student_modules" SET "cms_id" = "id";
ALTER TABLE "student_modules" ADD CONSTRAINT "student_modules_cms_id_unique" UNIQUE("cms_id");
```

---

## Part B: Pre-Migration Data Snapshot

**CRITICAL:** Before running migration, capture complete data snapshots for validation.

### Create Snapshot Directory

```powershell
mkdir backup_db\pre_migration_cms_id
```

### Export Row Counts

Run this and save output:

```sql
SELECT 'student_education' as tbl, COUNT(*) as cnt FROM student_education
UNION ALL SELECT 'next_of_kins', COUNT(*) FROM next_of_kins
UNION ALL SELECT 'schools', COUNT(*) FROM schools
UNION ALL SELECT 'programs', COUNT(*) FROM programs
UNION ALL SELECT 'structures', COUNT(*) FROM structures
UNION ALL SELECT 'structure_semesters', COUNT(*) FROM structure_semesters
UNION ALL SELECT 'student_programs', COUNT(*) FROM student_programs
UNION ALL SELECT 'student_semesters', COUNT(*) FROM student_semesters
UNION ALL SELECT 'modules', COUNT(*) FROM modules
UNION ALL SELECT 'semester_modules', COUNT(*) FROM semester_modules
UNION ALL SELECT 'student_modules', COUNT(*) FROM student_modules
UNION ALL SELECT 'module_prerequisites', COUNT(*) FROM module_prerequisites
ORDER BY tbl;
```

### Export Critical Relationship Data (Pre-Migration)

Export these relationship queries to CSV files for comparison:

**1. Student → Program → Structure → School Chain:**
```sql
\COPY (
  SELECT 
    s.std_no,
    sp.id as student_program_id,
    sp.structure_id,
    st.id as structure_id_check,
    st.program_id,
    p.id as program_id_check,
    p.school_id,
    sch.id as school_id_check,
    sch.code as school_code
  FROM students s
  JOIN student_programs sp ON s.std_no = sp.std_no
  JOIN structures st ON sp.structure_id = st.id
  JOIN programs p ON st.program_id = p.id
  JOIN schools sch ON p.school_id = sch.id
  ORDER BY s.std_no, sp.id
) TO 'backup_db/pre_migration_cms_id/student_school_chain.csv' WITH CSV HEADER;
```

**2. Student → Semester → Modules Chain:**
```sql
\COPY (
  SELECT 
    s.std_no,
    sp.id as student_program_id,
    ss.id as student_semester_id,
    ss.structure_semester_id,
    strsem.id as structure_semester_id_check,
    sm.id as student_module_id,
    sm.semester_module_id,
    semmod.id as semester_module_id_check,
    semmod.module_id,
    m.id as module_id_check,
    m.code as module_code
  FROM students s
  JOIN student_programs sp ON s.std_no = sp.std_no
  JOIN student_semesters ss ON sp.id = ss.student_program_id
  JOIN structure_semesters strsem ON ss.structure_semester_id = strsem.id
  JOIN student_modules sm ON ss.id = sm.student_semester_id
  JOIN semester_modules semmod ON sm.semester_module_id = semmod.id
  JOIN modules m ON semmod.module_id = m.id
  ORDER BY s.std_no, sp.id, ss.id, sm.id
  LIMIT 100000
) TO 'backup_db/pre_migration_cms_id/student_modules_chain.csv' WITH CSV HEADER;
```

**3. Assessment Marks Chain:**
```sql
\COPY (
  SELECT 
    am.id as assessment_mark_id,
    am.student_module_id,
    sm.id as student_module_id_check,
    sm.semester_module_id,
    semmod.module_id,
    a.id as assessment_id,
    a.module_id as assessment_module_id
  FROM assessment_marks am
  JOIN student_modules sm ON am.student_module_id = sm.id
  JOIN semester_modules semmod ON sm.semester_module_id = semmod.id
  JOIN assessments a ON am.assessment_id = a.id
  ORDER BY am.id
  LIMIT 100000
) TO 'backup_db/pre_migration_cms_id/assessment_marks_chain.csv' WITH CSV HEADER;
```

**4. Module Prerequisites:**
```sql
\COPY (
  SELECT 
    mp.id as prereq_id,
    mp.semester_module_id,
    sm1.id as semester_module_id_check,
    sm1.module_id as main_module_id,
    m1.code as main_module_code,
    mp.prerequisite_id,
    sm2.id as prerequisite_id_check,
    sm2.module_id as prereq_module_id,
    m2.code as prereq_module_code
  FROM module_prerequisites mp
  JOIN semester_modules sm1 ON mp.semester_module_id = sm1.id
  JOIN modules m1 ON sm1.module_id = m1.id
  JOIN semester_modules sm2 ON mp.prerequisite_id = sm2.id
  JOIN modules m2 ON sm2.module_id = m2.id
  ORDER BY mp.id
) TO 'backup_db/pre_migration_cms_id/module_prerequisites_chain.csv' WITH CSV HEADER;
```

**5. All Tables ID Snapshot:**
```sql
-- Export id columns from all 12 tables
\COPY (SELECT id FROM schools ORDER BY id) TO 'backup_db/pre_migration_cms_id/schools_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM programs ORDER BY id) TO 'backup_db/pre_migration_cms_id/programs_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM structures ORDER BY id) TO 'backup_db/pre_migration_cms_id/structures_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM structure_semesters ORDER BY id) TO 'backup_db/pre_migration_cms_id/structure_semesters_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM modules ORDER BY id) TO 'backup_db/pre_migration_cms_id/modules_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM semester_modules ORDER BY id) TO 'backup_db/pre_migration_cms_id/semester_modules_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM module_prerequisites ORDER BY id) TO 'backup_db/pre_migration_cms_id/module_prerequisites_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM student_education ORDER BY id) TO 'backup_db/pre_migration_cms_id/student_education_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM next_of_kins ORDER BY id) TO 'backup_db/pre_migration_cms_id/next_of_kins_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM student_programs ORDER BY id) TO 'backup_db/pre_migration_cms_id/student_programs_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM student_semesters ORDER BY id) TO 'backup_db/pre_migration_cms_id/student_semesters_ids.csv' WITH CSV HEADER;
\COPY (SELECT id FROM student_modules ORDER BY id) TO 'backup_db/pre_migration_cms_id/student_modules_ids.csv' WITH CSV HEADER;
```

---

## Part C: Migration Execution

### 1. Ensure Backup Exists

```powershell
# Verify backup exists
dir backup_db\*.dump
```

### 2. Run the Migration

```powershell
pnpm db:migrate
```

**If migration fails:**
1. Note the error message
2. Run `backup_db\restore.bat` to restore database
3. Fix the migration SQL based on error
4. Retry migration

---

## Part D: Comprehensive Data Integrity Validation

**THIS IS THE MOST CRITICAL PART. DO NOT SKIP ANY VALIDATION.**

### Validation Category 1: Schema Verification

**Test 1.1: Verify columns exist**
```sql
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE column_name = 'cms_id'
AND table_name IN (
  'student_education', 'next_of_kins', 'schools', 'programs', 
  'structures', 'structure_semesters', 'student_programs', 
  'student_semesters', 'modules', 'semester_modules', 
  'student_modules', 'module_prerequisites'
)
ORDER BY table_name;
```
**Expected:** 12 rows, all `integer`, all `YES` for nullable.

**Test 1.2: Verify unique constraints exist**
```sql
SELECT tc.table_name, tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'UNIQUE' 
AND tc.constraint_name LIKE '%cms_id%'
ORDER BY tc.table_name;
```
**Expected:** 12 rows with unique constraints.

---

### Validation Category 2: Row Count Integrity

**Test 2.1: Exact row count match**
```sql
SELECT 'student_education' as tbl, COUNT(*) as cnt FROM student_education
UNION ALL SELECT 'next_of_kins', COUNT(*) FROM next_of_kins
UNION ALL SELECT 'schools', COUNT(*) FROM schools
UNION ALL SELECT 'programs', COUNT(*) FROM programs
UNION ALL SELECT 'structures', COUNT(*) FROM structures
UNION ALL SELECT 'structure_semesters', COUNT(*) FROM structure_semesters
UNION ALL SELECT 'student_programs', COUNT(*) FROM student_programs
UNION ALL SELECT 'student_semesters', COUNT(*) FROM student_semesters
UNION ALL SELECT 'modules', COUNT(*) FROM modules
UNION ALL SELECT 'semester_modules', COUNT(*) FROM semester_modules
UNION ALL SELECT 'student_modules', COUNT(*) FROM student_modules
UNION ALL SELECT 'module_prerequisites', COUNT(*) FROM module_prerequisites
ORDER BY tbl;
```
**Expected:** EXACTLY match pre-migration counts. ZERO tolerance for data loss.

---

### Validation Category 3: cms_id Population Integrity

**Test 3.1: All records have cms_id = id**
```sql
SELECT 
  'student_education' as tbl, 
  COUNT(*) as total,
  SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END) as matching,
  SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END) as null_count,
  SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) as mismatch
FROM student_education
UNION ALL SELECT 'next_of_kins', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM next_of_kins
UNION ALL SELECT 'schools', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM schools
UNION ALL SELECT 'programs', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM programs
UNION ALL SELECT 'structures', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM structures
UNION ALL SELECT 'structure_semesters', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM structure_semesters
UNION ALL SELECT 'student_programs', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM student_programs
UNION ALL SELECT 'student_semesters', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM student_semesters
UNION ALL SELECT 'modules', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM modules
UNION ALL SELECT 'semester_modules', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM semester_modules
UNION ALL SELECT 'student_modules', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM student_modules
UNION ALL SELECT 'module_prerequisites', COUNT(*), SUM(CASE WHEN cms_id = id THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id IS NULL THEN 1 ELSE 0 END), SUM(CASE WHEN cms_id != id THEN 1 ELSE 0 END) FROM module_prerequisites
ORDER BY tbl;
```
**Expected:** For ALL rows: `matching = total`, `null_count = 0`, `mismatch = 0`

---

### Validation Category 4: Foreign Key Relationship Integrity

**CRITICAL: This verifies that all FK relationships still point to the correct records.**

**Test 4.1: Programs → Schools**
```sql
SELECT COUNT(*) as orphaned_programs
FROM programs p
LEFT JOIN schools s ON p.school_id = s.id
WHERE s.id IS NULL AND p.school_id IS NOT NULL;
```
**Expected:** 0

**Test 4.2: Structures → Programs**
```sql
SELECT COUNT(*) as orphaned_structures
FROM structures st
LEFT JOIN programs p ON st.program_id = p.id
WHERE p.id IS NULL AND st.program_id IS NOT NULL;
```
**Expected:** 0

**Test 4.3: Structure Semesters → Structures**
```sql
SELECT COUNT(*) as orphaned_structure_semesters
FROM structure_semesters ss
LEFT JOIN structures st ON ss.structure_id = st.id
WHERE st.id IS NULL AND ss.structure_id IS NOT NULL;
```
**Expected:** 0

**Test 4.4: Student Programs → Structures**
```sql
SELECT COUNT(*) as orphaned_student_programs
FROM student_programs sp
LEFT JOIN structures st ON sp.structure_id = st.id
WHERE st.id IS NULL AND sp.structure_id IS NOT NULL;
```
**Expected:** 0

**Test 4.5: Student Semesters → Student Programs**
```sql
SELECT COUNT(*) as orphaned_student_semesters_sp
FROM student_semesters ss
LEFT JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE sp.id IS NULL AND ss.student_program_id IS NOT NULL;
```
**Expected:** 0

**Test 4.6: Student Semesters → Structure Semesters**
```sql
SELECT COUNT(*) as orphaned_student_semesters_ss
FROM student_semesters ss
LEFT JOIN structure_semesters strsem ON ss.structure_semester_id = strsem.id
WHERE strsem.id IS NULL AND ss.structure_semester_id IS NOT NULL;
```
**Expected:** 0

**Test 4.7: Semester Modules → Modules**
```sql
SELECT COUNT(*) as orphaned_semester_modules_m
FROM semester_modules sm
LEFT JOIN modules m ON sm.module_id = m.id
WHERE m.id IS NULL AND sm.module_id IS NOT NULL;
```
**Expected:** 0

**Test 4.8: Semester Modules → Structure Semesters**
```sql
SELECT COUNT(*) as orphaned_semester_modules_ss
FROM semester_modules sm
LEFT JOIN structure_semesters ss ON sm.semester_id = ss.id
WHERE ss.id IS NULL AND sm.semester_id IS NOT NULL;
```
**Expected:** 0

**Test 4.9: Student Modules → Semester Modules**
```sql
SELECT COUNT(*) as orphaned_student_modules_sm
FROM student_modules sm
LEFT JOIN semester_modules semmod ON sm.semester_module_id = semmod.id
WHERE semmod.id IS NULL AND sm.semester_module_id IS NOT NULL;
```
**Expected:** 0

**Test 4.10: Student Modules → Student Semesters**
```sql
SELECT COUNT(*) as orphaned_student_modules_ss
FROM student_modules sm
LEFT JOIN student_semesters ss ON sm.student_semester_id = ss.id
WHERE ss.id IS NULL AND sm.student_semester_id IS NOT NULL;
```
**Expected:** 0

**Test 4.11: Module Prerequisites → Semester Modules**
```sql
SELECT COUNT(*) as orphaned_prereqs_sm
FROM module_prerequisites mp
LEFT JOIN semester_modules sm ON mp.semester_module_id = sm.id
WHERE sm.id IS NULL AND mp.semester_module_id IS NOT NULL;
```
**Expected:** 0

**Test 4.12: Module Prerequisites → Prerequisite Semester Modules**
```sql
SELECT COUNT(*) as orphaned_prereqs_prereq
FROM module_prerequisites mp
LEFT JOIN semester_modules sm ON mp.prerequisite_id = sm.id
WHERE sm.id IS NULL AND mp.prerequisite_id IS NOT NULL;
```
**Expected:** 0

**Test 4.13: Assessment Marks → Student Modules**
```sql
SELECT COUNT(*) as orphaned_assessment_marks
FROM assessment_marks am
LEFT JOIN student_modules sm ON am.student_module_id = sm.id
WHERE sm.id IS NULL AND am.student_module_id IS NOT NULL;
```
**Expected:** 0

---

### Validation Category 5: Data Chain Comparison (MOST CRITICAL)

**Compare the relationship chains exported before migration with current state.**

**Test 5.1: Student → School Chain Comparison**
```sql
-- Post-migration: Run the same query and compare with CSV
SELECT 
  s.std_no,
  sp.id as student_program_id,
  sp.structure_id,
  st.id as structure_id_check,
  st.program_id,
  p.id as program_id_check,
  p.school_id,
  sch.id as school_id_check,
  sch.code as school_code
FROM students s
JOIN student_programs sp ON s.std_no = sp.std_no
JOIN structures st ON sp.structure_id = st.id
JOIN programs p ON st.program_id = p.id
JOIN schools sch ON p.school_id = sch.id
ORDER BY s.std_no, sp.id;
```

**Manual verification:**
1. Export to `backup_db/post_migration_cms_id/student_school_chain.csv`
2. Diff with pre-migration file
3. Should be IDENTICAL

**Test 5.2: Student → Modules Chain Comparison**
```sql
-- Run the same query as pre-migration
-- Export to backup_db/post_migration_cms_id/student_modules_chain.csv
-- Diff with pre-migration file
-- Should be IDENTICAL
```

**Test 5.3: Assessment Marks Chain Comparison**
```sql
-- Run the same query as pre-migration
-- Export to backup_db/post_migration_cms_id/assessment_marks_chain.csv
-- Diff with pre-migration file
-- Should be IDENTICAL
```

**Test 5.4: Module Prerequisites Chain Comparison**
```sql
-- Run the same query as pre-migration
-- Export to backup_db/post_migration_cms_id/module_prerequisites_chain.csv
-- Diff with pre-migration file
-- Should be IDENTICAL
```

---

### Validation Category 6: ID Column Integrity

**Test 6.1: Verify all IDs unchanged**
```sql
-- For each table, verify id values match pre-migration
\COPY (SELECT id FROM schools ORDER BY id) TO 'backup_db/post_migration_cms_id/schools_ids.csv' WITH CSV HEADER;
-- Diff with pre-migration file
```

**Repeat for all 12 tables and diff each pair.**

---

### Validation Category 7: Uniqueness Verification

**Test 7.1: No duplicate cms_id values**
```sql
SELECT 'schools' as tbl, cms_id, COUNT(*) as cnt FROM schools WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'programs', cms_id, COUNT(*) FROM programs WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'structures', cms_id, COUNT(*) FROM structures WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'structure_semesters', cms_id, COUNT(*) FROM structure_semesters WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'modules', cms_id, COUNT(*) FROM modules WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'semester_modules', cms_id, COUNT(*) FROM semester_modules WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'student_programs', cms_id, COUNT(*) FROM student_programs WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'student_semesters', cms_id, COUNT(*) FROM student_semesters WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'student_modules', cms_id, COUNT(*) FROM student_modules WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'module_prerequisites', cms_id, COUNT(*) FROM module_prerequisites WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'student_education', cms_id, COUNT(*) FROM student_education WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1
UNION ALL SELECT 'next_of_kins', cms_id, COUNT(*) FROM next_of_kins WHERE cms_id IS NOT NULL GROUP BY cms_id HAVING COUNT(*) > 1;
```
**Expected:** No rows returned.

---

### Validation Category 8: Aggregate Data Verification

**Test 8.1: Sum of numeric columns unchanged**
```sql
-- Student modules marks (should be unchanged)
SELECT 
  SUM(marks) as total_marks,
  AVG(marks) as avg_marks,
  COUNT(DISTINCT grade) as distinct_grades
FROM student_modules;
```
**Compare with pre-migration values.**

**Test 8.2: Student counts per school (should match)**
```sql
SELECT 
  sch.code as school_code,
  COUNT(DISTINCT s.std_no) as student_count
FROM students s
JOIN student_programs sp ON s.std_no = sp.std_no
JOIN structures st ON sp.structure_id = st.id
JOIN programs p ON st.program_id = p.id
JOIN schools sch ON p.school_id = sch.id
GROUP BY sch.code
ORDER BY sch.code;
```
**Compare with pre-migration values.**

---

## Part E: Success Criteria Checklist

**ALL of the following MUST be true:**

- [ ] Migration completes without errors
- [ ] All 12 tables have `cms_id` column (integer, nullable)
- [ ] All 12 tables have unique constraint on `cms_id`
- [ ] Row counts EXACTLY match pre-migration (ZERO data loss)
- [ ] ALL records have `cms_id = id` (100% matching, 0 null, 0 mismatch)
- [ ] ALL 13 FK relationship tests return 0 orphans
- [ ] Student → School chain CSV files are IDENTICAL
- [ ] Student → Modules chain CSV files are IDENTICAL
- [ ] Assessment Marks chain CSV files are IDENTICAL
- [ ] Module Prerequisites chain CSV files are IDENTICAL
- [ ] All 12 ID column CSV files are IDENTICAL
- [ ] No duplicate cms_id values exist
- [ ] Aggregate numeric data unchanged

**If ANY test fails: STOP, restore backup, investigate, fix, and re-run.**

---

## Part F: Rollback Procedure

```powershell
# Restore from backup
backup_db\restore.bat

# Verify restoration
psql "postgresql://dev:111111@localhost:5432/registry" -P pager=off -c "SELECT COUNT(*) FROM students;"
```

---

## Notes

- Large tables (student_modules: 673K, student_semesters: 120K) may take time
- Keep terminal session active during migration
- Run validations immediately after migration
- Do not proceed to Step 2 (Codebase Updates) until 100% validation pass
