# Part 3: Add Filters to Remaining Layouts

## Goal

Add filters to the layouts that currently have none, using the shared filter pattern from Part 1 and extending the corresponding server-side list queries to support the new parameters.

## Rollout Rules

- Prefer `FilterMenu` for single-field filters.
- Use `FilterModal` only when the layout needs two or more fields.
- Do not add front-end-only filters. Every new filter must be backed by server-side query support.
- Keep list fetching reactive through `searchParams.toString()`.
- Reuse shared UI and shared state primitives instead of introducing feature-local shells.

---

## Single-Field Filters

Use `FilterMenu` for these layouts.

| # | Layout | File | Filter | Query Param |
|---|--------|------|--------|-------------|
| 3.1 | Graduation Requests | `registry/graduation/requests/layout.tsx` | status | `status` |
| 3.2 | Certificate Reprints | `registry/certificate-reprints/layout.tsx` | status | `status` |
| 3.3 | Blocked Students | `registry/blocked-students/layout.tsx` | status | `status` |
| 3.4 | Teaching Observations | `appraisals/teaching-observations/layout.tsx` | status | `status` |
| 3.5 | Appraisal Cycles | `appraisals/cycles/layout.tsx` | status | `status` |
| 3.6 | Mail Queue | `mail/queue/layout.tsx` | status | `status` |
| 3.7 | Recognized Schools | `admissions/recognized-schools/layout.tsx` | active | `active` |
| 3.8 | Permission Presets | `admin/permission-presets/layout.tsx` | role | `role` |

---

## Multi-Field And Feature-Specific Filters

Use `FilterModal` for multi-field cases and `FilterMenu` where the final design still has only one field.

| # | Layout | File | Filter Fields | Component Direction |
|---|--------|------|---------------|---------------------|
| 3.9 | Modules | `academic/modules/layout.tsx` | school, status | `ModulesFilter.tsx` |
| 3.10 | Semester Modules | `academic/semester-modules/layout.tsx` | term, school, program | `SemesterModulesFilter.tsx` |
| 3.11 | Lecturers | `academic/lecturers/layout.tsx` | school | `FilterMenu` if it stays single-field |
| 3.12 | Users | `admin/users/layout.tsx` | role, preset | `UsersFilter.tsx` |
| 3.13 | Audit Logs | `audit-logs/layout.tsx` | operation, table | `AuditLogsFilter.tsx` |
| 3.14 | Employees | `human-resource/employees/layout.tsx` | department, status | `EmployeesFilter.tsx` |
| 3.15 | Mail Sent | `mail/sent/layout.tsx` | status, triggerType | `SentFilter.tsx` |
| 3.16 | Venues | `timetable/venues/layout.tsx` | venueType | `FilterMenu` if it stays single-field |
| 3.17 | Applicants | `admissions/applicants/layout.tsx` | intake period | `FilterMenu` if it stays single-field |

---

## Required Server-Side Changes

Every new filter rollout must update the owning feature's server-side list pipeline.

- Extend the relevant `findAll*` query input types.
- Update service methods to pass the new filter object through without duplication.
- Update repositories to apply the new filters in the main query.
- Prefer one properly-filtered database query over sequential filtering or extra database round-trips.

## Acceptance Criteria

- All 17 targeted layouts expose a filter UI consistent with the shared pattern.
- Every filter affects the server-side query results, not just the client view.
- Layouts preserve state through the URL and refetch correctly.
- Multi-field filters live in dedicated feature components where needed.

## Verification

1. Run `pnpm tsc --noEmit` after each rollout batch.
2. Run `pnpm lint:fix` after each rollout batch.
3. Manually verify URL persistence, default states, active counts, and filtered query results on every affected layout.
