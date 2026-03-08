# Step 10: Sync Production Database

> **⚠️ THIS RUNS AGAINST THE PRODUCTION DATABASE.**  
> Steps 1–9 are complete. All code changes are deployed. The live R2 bucket already has all files in their new paths. The only thing remaining is making the production database match the local database.

**What this does:** Applies schema columns + updates DB records to point to the already-existing R2 files.  
**What this does NOT do:** No R2 file uploads or copies — R2 is already correct from Steps 1–9.

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

## 2. Update DB Records (Step 3 — R2 copies will be skipped, only DB writes)

```bash
DATABASE_ENV=remote pnpm tsx scripts/migrate-r2-storage.ts --dry-run
```

If dry-run shows 0 failures:

```bash
DATABASE_ENV=remote pnpm tsx scripts/migrate-r2-storage.ts --phase all
```

This sets `photo_key` on students/employees, converts `documents.file_url` from full URLs to R2 keys, and sets `storage_key` on publication_attachments.

---

## 3. Extract Base64 Deposits (Step 4 — uploads to R2 + updates DB)

The production DB still has ~1,820 base64-encoded deposit receipts in `documents.file_url`. This decodes them, uploads to R2, and replaces the base64 with R2 keys.

```bash
DATABASE_ENV=remote pnpm tsx scripts/extract-base64-deposits.ts --dry-run
```

If dry-run shows 0 failures:

```bash
DATABASE_ENV=remote pnpm tsx scripts/extract-base64-deposits.ts
```

---

## 4. Reclaim Space

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
```

Table size after vacuum (should be ~5–10 MB, not ~900 MB):

```sql
SELECT pg_size_pretty(pg_total_relation_size('documents'));
```

---

## Rollback

If anything fails: restore the backup and redeploy the previous code version together. DB and code must match — new code expects R2 keys, old code expects full URLs.

```bash
pg_restore --clean --if-exists -d "$DATABASE_REMOTE_URL" backup-pre-step10.dump
```
