# Step 3: Backfill Migration

Populate `std_no` and `changed_by_role` for all existing audit records using SQL joins.

**Prerequisites**: Step 1 (schema migration with new columns) must be applied first.

---

## 3.1 Generate custom migration

Run `pnpm db:generate --custom` to create a blank migration file, then add the backfill SQL.

---

## 3.2 Backfill `changed_by_role`

This is straightforward — JOIN `audit_logs` to `users` on `changed_by = users.id`:

```sql
UPDATE audit_logs al
SET changed_by_role = u.role
FROM users u
WHERE al.changed_by = u.id
  AND al.changed_by_role IS NULL;
```

This covers ALL audit records (not just student-related ones), which benefits the activity tracker as well.

---

## 3.3 Backfill `std_no` for direct tables

Tables where `record_id` maps directly to a table with `std_no`:

### `students` table (record_id = std_no directly)

```sql
UPDATE audit_logs
SET std_no = record_id::bigint
WHERE table_name = 'students'
  AND std_no IS NULL;
```

### `student_programs` table

```sql
UPDATE audit_logs al
SET std_no = sp.std_no
FROM student_programs sp
WHERE al.table_name = 'student_programs'
  AND al.record_id = sp.id::text
  AND al.std_no IS NULL;
```

### `payment_receipts` table

```sql
UPDATE audit_logs al
SET std_no = pr.std_no
FROM payment_receipts pr
WHERE al.table_name = 'payment_receipts'
  AND al.record_id = pr.id::text
  AND al.std_no IS NULL;
```

### Other direct tables

Repeat the same pattern for: `blocked_students`, `student_documents`, `registration_requests`, `sponsored_students`, `attendance`, `loans`, `fines`, `transcript_prints`, `statement_of_results_prints`, `student_card_prints`, `certificate_reprints`.

Each follows:
```sql
UPDATE audit_logs al
SET std_no = t.std_no
FROM <table_name> t
WHERE al.table_name = '<table_name>'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;
```

---

## 3.4 Backfill `std_no` for 1-hop tables

### `student_semesters` (via `student_program_id` → `student_programs.std_no`)

```sql
UPDATE audit_logs al
SET std_no = sp.std_no
FROM student_semesters ss
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE al.table_name = 'student_semesters'
  AND al.record_id = ss.id::text
  AND al.std_no IS NULL;
```

---

## 3.5 Backfill `std_no` for 2-hop tables

### `student_modules` (via `student_semester_id` → `student_semesters` → `student_programs.std_no`)

```sql
UPDATE audit_logs al
SET std_no = sp.std_no
FROM student_modules sm
JOIN student_semesters ss ON sm.student_semester_id = ss.id
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE al.table_name = 'student_modules'
  AND al.record_id = sm.id::text
  AND al.std_no IS NULL;
```

---

## 3.6 Backfill `std_no` for 3-hop tables

### `assessment_marks` (via `student_module_id` → chain to `student_programs.std_no`)

```sql
UPDATE audit_logs al
SET std_no = sp.std_no
FROM assessment_marks am
JOIN student_modules sm ON am.student_module_id = sm.id
JOIN student_semesters ss ON sm.student_semester_id = ss.id
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE al.table_name = 'assessment_marks'
  AND al.record_id = am.id::text
  AND al.std_no IS NULL;
```

**Note**: This updates ~218K rows. If the migration is slow, add `LIMIT` and loop, or run in batches:

```sql
UPDATE audit_logs al
SET std_no = sp.std_no
FROM (
  SELECT al2.id, sp2.std_no
  FROM audit_logs al2
  JOIN assessment_marks am ON al2.record_id = am.id::text
  JOIN student_modules sm ON am.student_module_id = sm.id
  JOIN student_semesters ss ON sm.student_semester_id = ss.id
  JOIN student_programs sp2 ON ss.student_program_id = sp2.id
  WHERE al2.table_name = 'assessment_marks'
    AND al2.std_no IS NULL
  LIMIT 50000
) sub
WHERE al.id = sub.id;
```

### `clearance` (via `registration_clearance` → `registration_requests.std_no`)

```sql
UPDATE audit_logs al
SET std_no = rr.std_no
FROM registration_clearance rc
JOIN registration_requests rr ON rc.registration_request_id = rr.id
WHERE al.table_name = 'clearance'
  AND al.record_id = rc.clearance_id::text
  AND al.std_no IS NULL;
```

**Note**: Clearance is also used for graduation. For graduation clearance:

```sql
UPDATE audit_logs al
SET std_no = sp.std_no
FROM graduation_clearance gc
JOIN graduation_requests gr ON gc.graduation_request_id = gr.id
JOIN student_programs sp ON gr.student_program_id = sp.id
WHERE al.table_name = 'clearance'
  AND al.record_id = gc.clearance_id::text
  AND al.std_no IS NULL;
```

---

## 3.7 Backfill for deleted/orphaned records

Some audit log entries may reference records that have been deleted from the source tables. For these, we can try to extract `std_no` from the `old_values` or `new_values` JSONB:

```sql
UPDATE audit_logs
SET std_no = COALESCE(
  (new_values->>'stdNo')::bigint,
  (old_values->>'stdNo')::bigint,
  (new_values->>'std_no')::bigint,
  (old_values->>'std_no')::bigint
)
WHERE std_no IS NULL
  AND table_name IN ('students', 'student_programs', 'payment_receipts', 'blocked_students',
    'student_documents', 'registration_requests', 'sponsored_students', 'attendance',
    'loans', 'fines', 'transcript_prints', 'statement_of_results_prints',
    'student_card_prints', 'certificate_reprints')
  AND (
    (new_values->>'stdNo') IS NOT NULL OR
    (old_values->>'stdNo') IS NOT NULL OR
    (new_values->>'std_no') IS NOT NULL OR
    (old_values->>'std_no') IS NOT NULL
  );
```

This is a best-effort fallback for orphaned records.

---

## 3.8 Full migration SQL

Combine all the above into a single migration file. Wrap in a transaction (Drizzle migrations run in transactions by default).

---

## Verification

After running the migration:

```sql
-- Check coverage
SELECT table_name,
  COUNT(*) as total,
  COUNT(std_no) as has_std_no,
  COUNT(changed_by_role) as has_role,
  ROUND(COUNT(std_no)::numeric / COUNT(*)::numeric * 100, 1) as std_no_pct
FROM audit_logs
WHERE table_name IN (
  'students', 'student_programs', 'student_semesters', 'student_modules',
  'assessment_marks', 'clearance', 'payment_receipts'
)
GROUP BY table_name
ORDER BY table_name;

-- Check overall changed_by_role coverage
SELECT
  COUNT(*) as total,
  COUNT(changed_by_role) as has_role,
  ROUND(COUNT(changed_by_role)::numeric / COUNT(*)::numeric * 100, 1) as pct
FROM audit_logs;

-- Spot-check a specific student
SELECT table_name, activity_type, operation, changed_by_role, changed_at
FROM audit_logs
WHERE std_no = 901004025
ORDER BY changed_at DESC
LIMIT 20;
```

Expected: >95% coverage for `std_no` on student-related tables, ~100% for `changed_by_role` (only NULL where `changed_by` is NULL).
