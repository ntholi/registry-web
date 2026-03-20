# Student Clearance Redesign — Overview

## Objective

Remove Library from student clearance workflows so Finance is the only non-academic clearance department.

## Target State

- **Registration clearance**: Finance only.
- **Graduation clearance**: Finance + Academic only.
- No new Library clearance rows are created.
- Historical approved/rejected Library rows preserved for audit; pending ones deleted.
- Library-rejected students migrated to `blocked_students` (skip if any existing row for that student).
- `emailSent` column dropped (never implemented).
- Library, Resource, and LEAP removed from all clearance access.

## Plan Structure

| File | Scope |
|------|-------|
| [001_core-logic-and-flow-changes.md](001_core-logic-and-flow-changes.md) | Phases 1–4: Constants, status utilities, bug fixes, registration & graduation flow changes |
| [002_access-migration-and-ui-cleanup.md](002_access-migration-and-ui-cleanup.md) | Phases 5–7: Navigation/permissions cleanup, data migration, UI text & history |

## Deployment Strategy

All phases deploy as a **single atomic release**. The two plans are logical groupings for implementation, not sequential deployments.

## Core Design Decisions

1. Keep the shared `clearance` table — no schema redesign.
2. Explicit required departments per flow (`['finance']` / `['finance', 'academic']`).
3. Preserve approved/rejected Library rows; delete pending ones.
4. Migrate library-rejected students to `blocked_students` with `byDepartment = 'registry'`. Skip students that already have ANY `blocked_students` row (trust prior admin decisions).
5. `library` stays in the `dashboard_users` DB enum (Library module itself is not removed).
6. Consolidate duplicate status utilities into shared code.
7. Fix ClearanceSwitch department-overwrite bug — repository-level exclusion only (exclude `department` from SET clause). No client-side change needed.
8. Service-level department validation allows admin to bypass department matching (admin acts on any clearance).
9. Historical library rows remain visible in ClearanceHistory/GraduationClearanceHistory (no 'Legacy' badge, no filtering).
10. Graduation `getStatusFromClearances` call sites: filter `graduationClearances` to `GRADUATION_CLEARANCE_DEPTS` at the **query level** to prevent stuck requests.
11. No explicit layout guards — navigation removal + permission preset revocation is sufficient.
12. No DB CHECK constraint on `auto_approvals.department` — rely on code validation.
13. Single custom migration file for all data cleanup steps (6a–6d).
