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
- `8-cleanup-and-verification`

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
| 4 | Done | 1,820 base64 records extracted to R2, 0 failures, ~1.1 GB DB storage reclaimed via VACUUM FULL. Completed in two runs (1,279 + 541) due to interruption; idempotent resume worked correctly. |
| 5 | Done | submitReceiptPayment updated to decode base64 → upload to R2 → store key in documents.fileUrl; orphan cleanup on failure |
| 6 | Done | Upload and delete flows now use storage keys and centralized server-side storage actions across student photos, employee photos, applicant documents, registry documents, term attachments, and library resources |
| 7 | Done | Retrieval paths now resolve stored R2 keys with getPublicUrl(), photo lookups no longer issue HEAD probes, and admissions/library document viewers were updated to render resolved URLs including PDF previews |
| 8 | Ready | Steps 1–7 complete. Run verification queries and spot checks before cleanup. |

Last update:
- 2026-03-08: Step 4 completed. 1,820 base64 deposit receipts extracted to R2, VACUUM FULL run. All steps 1–7 are done. Step 8 (cleanup & verification) is unblocked.

Blockers:
- None. All migration steps are complete. Step 8 cleanup awaits verification.

## What to do now

### Step 8: Cleanup & Verification

All migration steps (1–7) are complete. Follow `08-cleanup-and-verification.md`.

**1. Run verification SQL queries** (safe, read-only):
```sql
-- Confirm no base64 data remains
SELECT COUNT(*) FROM documents WHERE file_url LIKE 'data:%';
-- Expected: 0

-- Confirm no old hardcoded URLs remain
SELECT COUNT(*) FROM documents WHERE file_url LIKE '%pub-2b37ce26bd70421e%';
-- Expected: 0

-- Confirm all publication attachments have storage keys
SELECT COUNT(*) FROM publication_attachments WHERE storage_key IS NULL;
-- Expected: 0
```

**2. Application smoke test** — Open the app and verify:
- Student photos load
- Employee photos load
- Student documents download
- Admissions applicant documents display
- Library resources open
- Deposit receipt images display in payment review

**3. Codebase grep** — Verify no old patterns remain:
```bash
grep -r "pub-2b37ce26bd70421e" src/
```
Expected: 0 results.

**4. When satisfied, tell Copilot to execute Step 8** (remove deprecated code, dead code, and optionally clean up old R2 objects).

> **NOTE**: Do NOT delete old R2 objects until R2 versioning or a backup copy is in place (see go/no-go checklist at top).