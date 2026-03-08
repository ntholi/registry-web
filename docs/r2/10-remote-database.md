# Step 10: Sync Production Database

> **⚠️ THIS RUNS AGAINST THE PRODUCTION DATABASE.**
> Steps 1–8 are complete on the **local** database. R2 is in its final state (new paths only; old paths deleted in Step 8). The only remaining task is making the production (remote) database match.

**What this does:** Applies schema columns + copies migrated column values from the local DB to the remote DB.
**What this does NOT do:** Zero R2 operations — no uploads, copies, or HEAD requests. R2 is already correct.

---

## Why the Original Plan Was Wrong

The original plan called for re-running `migrate-r2-storage.ts` and `extract-base64-deposits.ts` against the remote DB. This **will not work** because:

1. **`migrate-r2-storage.ts` depends on old R2 paths** — Phases 1–2 list objects under `photos/` and `photos/employees/`, which were **deleted in Step 8**. Phases 3–5 attempt `CopyObject` from old R2 keys that no longer exist. The script would find 0 objects or fail on every copy.

2. **`extract-base64-deposits.ts` would technically work** (it has idempotency checks via HEAD), but it would make ~1,820 unnecessary HEAD requests to R2 when the data can be synced via a simple DB update.

Since the local DB is an exact copy of the remote DB (with all migration changes applied), the safest approach is a **DB-only sync**: export migrated values from Local → apply to Remote.

---

## Before You Start

**Take a full database backup before running anything.**

```bash
pg_dump --format=custom -f backup-pre-step10.dump "$DATABASE_REMOTE_URL"
```

---

## 1. Apply Schema Migration

Adds nullable columns: `students.photo_key`, `employees.photo_key`, `publication_attachments.storage_key`.

```bash
DATABASE_ENV=remote pnpm db:migrate
```

---

## 2. Generate Sync SQL from Local DB

This reads migrated values from your **local** database and generates a SQL file with UPDATE statements for the remote database. No R2 operations.

```bash
pnpm tsx scripts/generate-remote-sync.ts
```

Output: `scripts/remote-sync.sql`

**Review the generated SQL file before proceeding.** It contains:
- `students.photo_key` updates (~2,200 rows)
- `employees.photo_key` updates (~120 rows)
- `documents.file_url` updates (all records where URLs/base64 were converted to R2 keys)
- `publication_attachments.storage_key` updates (~35 rows)

All wrapped in a single transaction (`BEGIN`/`COMMIT`).

---

## 3. Apply Sync SQL to Remote DB

```bash
psql "$DATABASE_REMOTE_URL" -f scripts/remote-sync.sql
```

This replaces:
- Full URLs (`https://pub-...r2.dev/...`) → R2 keys (`library/question-papers/abc.pdf`)
- Base64 data URIs (`data:image/jpeg;base64,...`) → R2 keys (`admissions/deposits/appId/docId.jpeg`)
- NULL photo_key/storage_key → populated values from the migration

---

## 4. Reclaim Space

The base64 deposit receipts (~892 MB) are now replaced with short R2 keys. Reclaim the space:

```sql
VACUUM FULL documents;
ANALYZE documents;
```

---

## 5. Verify

All counts must return **0**:

```sql
SELECT COUNT(*) FROM documents WHERE file_url LIKE 'https://pub-%';
SELECT COUNT(*) FROM documents WHERE file_url LIKE 'data:%';
SELECT COUNT(*) FROM publication_attachments WHERE storage_key IS NULL;
```

Confirm photo_key populated:

```sql
SELECT COUNT(*) FROM students WHERE photo_key IS NOT NULL;
SELECT COUNT(*) FROM employees WHERE photo_key IS NOT NULL;
```

Table size after vacuum (should be ~5–10 MB, not ~900 MB):

```sql
SELECT pg_size_pretty(pg_total_relation_size('documents'));
```

---

## 6. Deploy Code & Bring Server Up

After verification passes:
1. Deploy the application (all code changes from Steps 1–8)
2. Bring the server back up from maintenance mode

---

## Rollback

If anything fails: restore the backup. Do NOT deploy the new code if the DB sync failed — DB and code must match.

```bash
pg_restore --clean --if-exists -d "$DATABASE_REMOTE_URL" backup-pre-step10.dump
```
