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
- `3`

Go / no-go:
- [ ] PostgreSQL backup completed before destructive work
- [ ] R2 recovery exists before cleanup: versioning or backup copy
- [ ] Dry run passed before each migration script
- [ ] Verification passed before moving to next step
- [ ] Rollback plan understood: old code + old DB restore together

Progress:

| Step | Status | Result |
|------|--------|--------|
| 1 | Done | storage-utils.ts created, storage.ts rewritten, next.config.ts updated, env var added |
| 2 | Done | photoKey added to students & employees, storageKey added to publication_attachments, migration 0181 generated |
| 3 | Done | migrate-r2-storage.ts created with 6 phases, dry-run support, integrity verification, batch processing |
| 4 | Not started | - |
| 5 | Not started | - |
| 6 | Not started | - |
| 7 | Not started | - |
| 8 | Not started | - |

Last update:
- Step 3 completed: migration script created at scripts/migrate-r2-storage.ts

Blockers:
- None

## What to do now

Step 3 script is written but NOT yet executed. Before proceeding to Step 4:

1. **Take a DB backup**: `pg_dump --format=custom -d registry -f backup_db/pre-r2-migration.dump`
2. **Run dry run**: `pnpm tsx scripts/migrate-r2-storage.ts --dry-run`
3. **Review the log** in `scripts/migration-logs/` — check for unexpected failures, orphans, or duplicates
4. **If dry run is clean**: tell Copilot to proceed to Step 4 (or run live with `pnpm tsx scripts/migrate-r2-storage.ts --phase all` if you want to execute now)

> **NOTE**: Per 00-overview.md, Steps 3 and 4 scripts are executed during the maintenance window alongside code deployment. You can write both scripts first (Steps 3 + 4), then execute them together during downtime. Dry runs can be done anytime.