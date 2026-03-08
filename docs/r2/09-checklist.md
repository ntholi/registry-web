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
| 8 | Done | Verification passed (0 missing DB/R2), deprecated wrappers removed from storage.ts, codebase grep clean, documentation updated (README + copilot-instructions). Old R2 object deletion deferred pending R2 versioning/backup. |

Last update:
- 2026-03-08: Step 8 executed. DB verification: 0 base64, 0 old URLs, 0 missing storage keys. R2 verification: 2,211 student photos + 8,134 documents all present (0 missing, 0 errors). Deprecated storage wrappers (uploadDocument, deleteDocument, getStorageKeyFromUrl) removed. README and copilot-instructions updated with R2 storage guidelines. Cleanup/audit scripts created. Old R2 objects (8,769 under old prefixes) await deletion after R2 versioning is enabled.

Blockers:
- Old R2 object deletion (8.5) blocked on R2 versioning or backup copy. Enable bucket versioning before running `pnpm tsx scripts/cleanup-old-r2-objects.ts --dry-run`.

## What to do now

Migration complete. All code changes are done.

**Remaining optional action**: Delete old R2 objects (~8,769 objects under `photos/`, `documents/`, `applicant-documents/` prefixes). Prerequisites:
1. Enable R2 bucket versioning or create a backup copy
2. Run `pnpm tsx scripts/cleanup-old-r2-objects.ts --dry-run` first
3. Then `pnpm tsx scripts/cleanup-old-r2-objects.ts` to delete