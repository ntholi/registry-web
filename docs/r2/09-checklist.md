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
- `1`

Go / no-go:
- [ ] PostgreSQL backup completed before destructive work
- [ ] R2 recovery exists before cleanup: versioning or backup copy
- [ ] Dry run passed before each migration script
- [ ] Verification passed before moving to next step
- [ ] Rollback plan understood: old code + old DB restore together

Progress:

| Step | Status | Result |
|------|--------|--------|
| 1 | Not started | - |
| 2 | Not started | - |
| 3 | Not started | - |
| 4 | Not started | - |
| 5 | Not started | - |
| 6 | Not started | - |
| 7 | Not started | - |
| 8 | Not started | - |

Last update:
- None yet

Blockers:
- None

Next action:
- Start Step 1