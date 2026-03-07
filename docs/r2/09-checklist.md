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
- `7`

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
| 2 | Done | photoKey added to students & employees, storageKey added to publication_attachments, migration 0181 generated |
| 3 | Done | migrate-r2-storage.ts dry run passed with 0 failures; review noted 20 student-photo orphans, 1 employee-photo orphan, and 154 admissions-document orphans |
| 4 | Done | extract-base64-deposits.ts created and dry run passed with 1,595 receipts, 0 failures, ~1000.79 MB estimated DB bytes replaced |
| 5 | Done | submitReceiptPayment updated to decode base64 → upload to R2 → store key in documents.fileUrl; orphan cleanup on failure |
| 6 | Done | Upload and delete flows now use storage keys and centralized server-side storage actions across student photos, employee photos, applicant documents, registry documents, term attachments, and library resources |
| 7 | Done | Retrieval paths now resolve stored R2 keys with getPublicUrl(), photo lookups no longer issue HEAD probes, and admissions/library document viewers were updated to render resolved URLs including PDF previews |
| 8 | Not started | - |

Last update:
- Step 7 completed: retrieval paths now resolve stored keys through getPublicUrl(), student and employee photo lookups read photoKey directly, and admissions/library document viewers now resolve storage keys before rendering or downloading

Blockers:
- None

## What to do now

1. **Proceed to Step 8**: run the cleanup and verification pass from `08-cleanup-and-verification.md`, keeping rollback readiness and R2 recovery as hard gates before any destructive cleanup
2. **Keep live execution for downtime only**: run `pnpm tsx scripts/migrate-r2-storage.ts --phase all` and `pnpm tsx scripts/extract-base64-deposits.ts` during the maintenance window after deploying the Step 1/2/5/6/7 code changes
3. **Use the dry-run logs as the operator baseline**:
	- Step 3 log: `scripts/migration-logs/r2-migration-2026-03-07T15-26-12-891Z.json`
	- Step 4 log: `scripts/logs/base64-extraction-2026-03-07T15-31-02-881Z.json`
4. **Run the Step 8 verification searches after deploy**: confirm there are no remaining hardcoded public R2 URLs, no HEAD-probe based photo retrievals, and all document/file viewers still load correctly in registry, admissions, HR, and library flows
5. **Call out the reviewed deltas in the maintenance notes**: Step 3 found 154 admissions-document orphans instead of the documented 153, plus 20 student-photo orphans and 1 employee-photo orphan; Step 4 found 1,595 base64 proof-of-payment records instead of the earlier 1,422 estimate

> **NOTE**: Per 00-overview.md, Steps 3 and 4 scripts are executed during the maintenance window alongside code deployment. The dry runs are complete; the live runs remain part of the downtime cutover.