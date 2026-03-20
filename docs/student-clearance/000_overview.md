# Student Clearance Redesign — Overview

## Objective

Remove Library from student clearance workflows so Finance is the only non-academic clearance department.

## Target State

- **Registration clearance**: Finance only.
- **Graduation clearance**: Finance + Academic only.
- No new Library clearance rows are created.
- Historical approved/rejected Library rows preserved for audit; pending ones deleted.
- Library-rejected students migrated to `blocked_students`.
- `emailSent` column dropped (never implemented).
- Library, Resource, and LEAP removed from all clearance access.

## Estimated Effort

**~30 files across 7 phases** | **~4 hours AI-assisted**

## Plan Structure

| File | Scope | Est. Hours |
|------|-------|------------|
| [001_core-logic-and-flow-changes.md](001_core-logic-and-flow-changes.md) | Phases 1–4: Constants, status utilities, bug fixes, registration & graduation flow changes | ~2.25 |
| [002_access-migration-and-ui-cleanup.md](002_access-migration-and-ui-cleanup.md) | Phases 5–7: Navigation/permissions cleanup, data migration, UI text & history filters | ~1.75 |

## Deployment Strategy

All phases deploy as a **single atomic release**. The two plans are logical groupings for implementation, not sequential deployments.

## Core Design Decisions

1. Keep the shared `clearance` table — no schema redesign.
2. Explicit required departments per flow (`['finance']` / `['finance', 'academic']`).
3. Preserve approved/rejected Library rows; delete pending ones.
4. Migrate library-rejected students to `blocked_students` with `byDepartment = 'registry'`.
5. `library` stays in the `dashboard_users` DB enum (Library module itself is not removed).
6. Consolidate duplicate status utilities into shared code.
7. Fix ClearanceSwitch department-overwrite bug (department immutable after creation).
