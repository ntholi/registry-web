# R2 Migration Checklist

Use this file as the only operator-facing status file.

Rules:
- Run steps in order: 1 → 8.
- After each step, update this file before starting the next one.
- If a step is partial, failed, or blocked, stop and do not continue.
- Step 8 cleanup is not allowed until production is stable, verification passes, and independent R2 recovery exists.

What you need to do:
- Answer questions when asked.
- Provide env values, credentials, and approval for downtime/backups when needed.
- Do not skip backups, dry runs, or verification.

Current step:
- `4-dry-run-then-4-live-then-vacuum-then-8`

Go / no-go:
- [x] PostgreSQL backup completed before destructive work
- [ ] R2 recovery exists before cleanup: versioning or backup copy
- [x] Dry run passed before each migration script
- [x] Verification passed before moving to next step
- [ ] Rollback plan understood: old code + old DB restore together

Progress:

| Step | Status | Result |
|------|--------|--------|
| 1 | Done | storage-utils.ts created, storage.ts rewritten, next.config.ts updated, env var added |
| 2 | Done | photoKey added to students & employees, storageKey added to publication_attachments, migration 0181 generated and applied |
| 3 | Done | Re-run on 2026-03-08 against correct (restored) DB: 2,211 student photos (4 new + 2,207 skipped), 6,314 admissions documents (683 new + 5,477 skipped + 154 genuine orphans), 0 failures across all phases. The original 2026-03-07 run used a stale DB missing 3 days of records; DB was restored and migration re-run successfully. |
| 4 | Ready for dry-run + live run | Previous dry run (stale DB) found 1,595 base64 records; restored DB now has **1,820** base64 records. Must re-run dry-run first, then live. |
| 5 | Done | submitReceiptPayment updated to decode base64 → upload to R2 → store key in documents.fileUrl; orphan cleanup on failure |
| 6 | Done | Upload and delete flows now use storage keys and centralized server-side storage actions across student photos, employee photos, applicant documents, registry documents, term attachments, and library resources |
| 7 | Done | Retrieval paths now resolve stored R2 keys with getPublicUrl(), photo lookups no longer issue HEAD probes, and admissions/library document viewers were updated to render resolved URLs including PDF previews |
| 8 | Not started | Blocked until Step 4 live run completes and VACUUM FULL is done |

Last update:
- 2026-03-08: Step 3 re-run completed successfully on the restored (correct) database. All 20 previous failures now succeeded. 4 student photos previously wrongly orphaned are now correctly migrated. Step 4 is unblocked.

Blockers:
- None. Step 3 is fully complete. Step 4 is ready.

## Step 3 Recovery Summary (2026-03-08)

The first Step 3 run (2026-03-07) used a stale database backup missing ~3 days of records:
- 17 student photos were wrongly orphaned (students didn't exist in stale DB)
- 20 admissions document copies failed with `NoSuchKey`
- ~663 recent admissions documents were not migrated

**Recovery actions taken:**
1. Database restored to correct (most recent) version
2. Pending migrations applied (`pnpm db:migrate` — added `photo_key`, `storage_key` columns)
3. Dry-run verified correct record counts
4. Live re-run: `verifiedCopy` skipped 7,684 already-copied files, copied 687 new ones, 0 failures

**Final verified state:**
- 2,211 student `photo_key` values set (all `registry/students/photos/` prefix)
- 6,314 admissions `file_url` values migrated (all `admissions/` prefix)
- 0 old-format `https://` URLs remaining in documents table
- 1,820 base64 `data:` records remaining (to be handled by Step 4)

Migration logs:
- Original (stale DB): `scripts/migration-logs/r2-migration-2026-03-07T19-15-19-523Z.json`
- Recovery dry-runs: `scripts/migration-logs/r2-migration-2026-03-08T03-36-23-411Z.json` (student photos), `r2-migration-2026-03-08T03-39-44-482Z.json` (admissions)
- Recovery live runs: `scripts/migration-logs/r2-migration-2026-03-08T03-43-40-750Z.json` (student photos), `r2-migration-2026-03-08T03-57-04-963Z.json` (admissions)

## What to do now

### Step 4: Extract base64 deposit receipts to R2

The restored DB has **1,820 base64 records** (225 more than the previous dry-run). You must re-run the dry-run first.

**1. Run the dry-run** (safe, no changes):
```bash
pnpm tsx scripts/extract-base64-deposits.ts --dry-run
```
Expected: ~1,820 records processed, 0 failures. Verify the log in `scripts/logs/`.

**2. If dry-run passes, run live** (during maintenance window):
```bash
pnpm tsx scripts/extract-base64-deposits.ts
```
This uploads base64 images to R2 and replaces `documents.file_url` with R2 keys. Estimated ~1 GB of DB storage reclaimed.

**3. After live run succeeds, reclaim DB space**:
```sql
VACUUM FULL documents;
```
Run via: `psql postgresql://dev:111111@localhost:5432/registry -c "VACUUM FULL documents;"`

**4. After VACUUM, proceed to Step 8** (`08-cleanup-and-verification.md`):
- Run the verification SQL queries from Section 8.1
- Spot-check 10 files per category via HEAD requests
- Only then consider old-file cleanup

> **NOTE**: Do NOT skip the dry-run. The previous dry-run was against a stale DB with fewer records. The new dry-run confirms the script handles all 1,820 records correctly.