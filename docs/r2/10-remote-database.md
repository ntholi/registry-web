# Step 10: Sync Production Database

> **⚠️ THIS RUNS AGAINST THE PRODUCTION DATABASE.**
> Steps 1–8 are complete on the **local** database. R2 is in its final state (new paths only; old paths deleted in Step 8). The only remaining task is making the production (remote) database match.

> **⚠️ ALL COMMANDS BELOW ARE POWERSHELL SYNTAX.** Do not use bash syntax.

**What this does:** Applies schema migrations + copies migrated column values from the local DB to the remote DB.
**What this does NOT do:** Zero R2 operations — no uploads, copies, or HEAD requests. R2 is already correct.

---

### 0a. Uncomment `DATABASE_REMOTE_URL`

In `.env.local`, the `DATABASE_REMOTE_URL` line is **commented out** by default. Uncomment it:

```
DATABASE_REMOTE_URL='postgresql://neon...'
```

> **Re-comment it immediately after Step 10 is complete.**

### 0b. Verify Remote DB State Matches Local Assumptions

**Before doing anything else**, run a count comparison against the remote to confirm the local DB is a faithful copy. Discrepancies mean the sync SQL will be incomplete.

```powershell
psql $env:DATABASE_REMOTE_URL -P pager=off -c "
SELECT 'students' AS tbl, COUNT(*) AS total FROM students
UNION ALL SELECT 'employees', COUNT(*) FROM employees
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'publication_attachments', COUNT(*) FROM publication_attachments;
"
```

Compare with local counts:

| Table | Local Count |
|-------|-------------|
| `students` | 21,283 |
| `employees` | 0 |
| `documents` | 8,134 |
| `publication_attachments` | 0 |

> **If `employees` or `publication_attachments` counts differ (remote has rows but local has 0), STOP.** The sync script reads from local and will generate 0 updates for those tables. You would need to handle them separately — either restore a fresh remote dump locally and re-run the full migration, or write targeted UPDATE queries for those tables.

### 0c. Check Pending Migrations on Remote

```powershell
psql $env:DATABASE_REMOTE_URL -P pager=off -c "SELECT COUNT(*) AS applied FROM drizzle.__drizzle_migrations;"
```

Local has **182 applied migrations**. If the remote has fewer, `db:migrate` will apply all pending ones (not just the R2 columns). Review the diff carefully if the gap is large.

---

## 1. Apply Schema Migrations

Applies all pending Drizzle migrations. This includes the R2 columns (`students.photo_key`, `employees.photo_key`, `publication_attachments.storage_key`) plus any other schema changes pending on remote.

```powershell
$env:DATABASE_ENV="remote"; pnpm db:migrate
```

After completion, verify the columns exist:

```powershell
psql $env:DATABASE_REMOTE_URL -P pager=off -c "
SELECT column_name FROM information_schema.columns
WHERE (table_name='students' AND column_name='photo_key')
   OR (table_name='employees' AND column_name='photo_key')
   OR (table_name='publication_attachments' AND column_name='storage_key');
"
```

Expected: 3 rows returned.

---

## 2. Generate Sync SQL from Local DB

This reads migrated values from your **local** database and generates a SQL file with UPDATE statements for the remote database. No R2 operations.

> Ensure `DATABASE_ENV` is NOT set to "remote" for this step (it reads from local):

```powershell
$env:DATABASE_ENV="local"; pnpm tsx scripts/generate-remote-sync.ts
```

Output: `scripts/remote-sync.sql`

**Review the generated SQL file before proceeding.** Based on current local DB state, it will contain:
- `students.photo_key` updates (2,211 rows)
- `employees.photo_key` updates (0 rows — local DB has no employees)
- `documents.file_url` updates (8,134 rows — all migrated to R2 keys)
- `publication_attachments.storage_key` updates (0 rows — local DB has no publication attachments)

All wrapped in a single transaction (`BEGIN`/`COMMIT`).

> **Sanity check**: Open `scripts/remote-sync.sql` and verify the total UPDATE count matches console output. The SQL should contain only UPDATE statements with R2 key values (short paths like `registry/students/photos/901234.jpg`), never full URLs or base64 data.

---

## 3. Apply Sync SQL to Remote DB

```powershell
psql $env:DATABASE_REMOTE_URL -f scripts/remote-sync.sql
```

This replaces:
- Full URLs (`https://pub-...r2.dev/...`) → R2 keys (`library/question-papers/abc.pdf`)
- Base64 data URIs (`data:image/jpeg;base64,...`) → R2 keys (`admissions/deposits/appId/docId.jpeg`)
- NULL `photo_key` → populated values from the migration

---

## 4. Reclaim Space

> **⚠️ `VACUUM FULL` takes an exclusive lock on the table**, blocking ALL reads and writes until complete. Plan for brief downtime on the `documents` table. On ~900 MB of data, this may take 1–5 minutes.

```powershell
psql $env:DATABASE_REMOTE_URL -c "VACUUM FULL documents; ANALYZE documents;"
```

---

## 5. Verify

Run ALL verification queries against the **remote** DB.

All counts must return **0**:

```powershell
psql $env:DATABASE_REMOTE_URL -P pager=off -c "
SELECT COUNT(*) AS old_urls FROM documents WHERE file_url LIKE 'https://pub-%';
SELECT COUNT(*) AS base64_data FROM documents WHERE file_url LIKE 'data:%';
"
```

Confirm photo_key populated:

```powershell
psql $env:DATABASE_REMOTE_URL -P pager=off -c "
SELECT COUNT(*) AS students_with_photo_key FROM students WHERE photo_key IS NOT NULL;
SELECT COUNT(*) AS employees_with_photo_key FROM employees WHERE photo_key IS NOT NULL;
"
```

Expected: `students_with_photo_key` = 2,211. `employees_with_photo_key` = 0 (no employees in DB).

Table size after vacuum (should be ~5–10 MB, not ~900 MB):

```powershell
psql $env:DATABASE_REMOTE_URL -P pager=off -c "SELECT pg_size_pretty(pg_total_relation_size('documents'));"
```

---

## 6. Cleanup Environment

**Immediately** after verification passes:

1. Re-comment `DATABASE_REMOTE_URL` in `.env.local`
2. Reset the env var: `Remove-Item Env:DATABASE_ENV`

---

## 7. Deploy Code & Bring Server Up

After verification passes:
1. Deploy the application (all code changes from Steps 1–8)
2. Bring the server back up from maintenance mode

---

## Rollback

If anything fails: restore the backup. Do NOT deploy the new code if the DB sync failed — DB and code must match.

```powershell
pg_restore --clean --if-exists -d $env:DATABASE_REMOTE_URL backup-pre-step10.dump
```
