# Step 10: Remote Database

> **Prerequisite:** Steps 1–7 code changes deployed. Step 8 not yet started.  
> **Context:** Steps 0–9 were executed against the local database. The remote database is identical but missing the Step 2 schema migration and all DB-side data updates from Steps 3–4.  
> **R2 bucket:** Shared — Step 3 already copied files to new paths. The script is idempotent and will skip existing copies.

---

## Switch to Remote Database

All commands below require the remote database connection. Set the env before each command:

```bash
DATABASE_ENV=remote
```

Or prefix each command: `DATABASE_ENV=remote pnpm ...`

---

## 1. Apply Schema Migration (Step 2)

Adds `photo_key` to students/employees and `storage_key` to publication_attachments.

```bash
DATABASE_ENV=remote pnpm db:migrate
```

Verify columns exist:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'photo_key';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'photo_key';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'publication_attachments' AND column_name = 'storage_key';
```

All three should return 1 row.

---

## 2. Run R2 Migration Script (Step 3)

R2 files are already copied — the script will skip copies and only update DB records (`photo_key`, `file_url`, `storage_key`).

**Dry run first:**

```bash
DATABASE_ENV=remote pnpm tsx scripts/migrate-r2-storage.ts --dry-run
```

**Live run:**

```bash
DATABASE_ENV=remote pnpm tsx scripts/migrate-r2-storage.ts --phase all
```

Verify:

```sql
-- Should return 0
SELECT COUNT(*) FROM documents
WHERE file_url LIKE 'https://pub-%' AND file_url IS NOT NULL;

-- Should return > 0
SELECT COUNT(*) FROM students WHERE photo_key IS NOT NULL;
```

---

## 3. Extract Base64 Deposits (Step 4)

**Dry run first:**

```bash
DATABASE_ENV=remote pnpm tsx scripts/extract-base64-deposits.ts --dry-run
```

**Live run:**

```bash
DATABASE_ENV=remote pnpm tsx scripts/extract-base64-deposits.ts
```

Verify:

```sql
-- Should return 0
SELECT COUNT(*) FROM documents
WHERE file_url LIKE 'data:%' AND type = 'proof_of_payment';

-- Should return the total migrated count
SELECT COUNT(*) FROM documents d
JOIN bank_deposits bd ON bd.document_id = d.id
WHERE d.file_url LIKE 'admissions/deposits/%';
```

---

## 4. Reclaim DB Space

```sql
VACUUM FULL documents;
ANALYZE documents;
```

---

## 5. Verify (Step 8 Queries)

```sql
-- No old-format URLs remaining
SELECT COUNT(*) FROM documents WHERE file_url LIKE '%pub-2b37ce26bd70421e%';
-- Expected: 0

-- No remaining base64
SELECT COUNT(*) FROM documents WHERE file_url LIKE 'data:%';
-- Expected: 0

-- All publication attachments have storage_key
SELECT COUNT(*) FROM publication_attachments WHERE storage_key IS NULL;
-- Expected: 0

-- Table size after vacuum
SELECT pg_size_pretty(pg_total_relation_size('documents'));
```

---

## 6. Proceed to Step 8

Once verification passes, follow `08-cleanup-and-verification.md` for the full application smoke test and old R2 object cleanup.
