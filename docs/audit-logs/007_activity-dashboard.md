# Step 007: Department Activity Dashboard

## Introduction

This step adds a dashboard that shows what each user and department has been doing, based on the unified `audit_logs` table. It focuses on staff output and time distribution by table, module, and operation type.

## Context

Audit logs already capture who changed what and when. This step converts those events into actionable management metrics for registry leadership:

- Activity by user
- Activity by department/module
- Time-spent approximation from event streams
- Which tables receive the most operational work

## Requirements

### 1. Analytics Query Layer

Create analytics methods in `src/app/audit-logs/_server/repository.ts`:

| Method | Input | Output | Purpose |
|-------|-------|--------|---------|
| `findUserActivitySummary` | `from, to, module?` | per-user totals | User workload ranking |
| `findDepartmentActivitySummary` | `from, to` | per-department totals | Department workload comparison |
| `findTableActivitySummary` | `from, to, module?` | per-table totals | Identify highest-change tables |
| `findUserTimeBuckets` | `from, to, userId` | bucketed activity series | Time-spent approximation |
| `findRecentDepartmentEvents` | `from, to, module?, page, search` | paginated events | Drill-down evidence |

Use single-query aggregates with joins to `users` where possible.

### 2. Service and Actions

Add role-protected methods in:

- `src/app/audit-logs/_server/service.ts`
- `src/app/audit-logs/_server/actions.ts`

Expose server actions:

| Action | Input | Output |
|-------|-------|--------|
| `getUserActivitySummary` | `from, to, module?` | user activity aggregates |
| `getDepartmentActivitySummary` | `from, to` | department aggregates |
| `getTableActivitySummary` | `from, to, module?` | table activity aggregates |
| `getUserTimeBuckets` | `from, to, userId` | time buckets |
| `getRecentDepartmentEvents` | `page, search, from, to, module?` | paginated event list |

### 3. Dashboard Route

Create route: `src/app/audit-logs/activity/page.tsx`

Sections:

1. Date range filter (`YYYY-MM-DD`) and module selector
2. Department summary cards (registry, academic, finance, admissions, admin, library, timetable)
3. User leaderboard (top active staff)
4. Tables activity panel (top changed tables and operation mix)
5. Recent events list for traceability

### 4. Time-Spent Approximation Rules

Because audit logs are write-only events, time is estimated by sessionized event gaps:

- Group events per user ordered by `changed_at`
- If gap between consecutive events is <= 15 minutes, count gap as active time
- If gap > 15 minutes, cap contribution to 2 minutes for the prior event
- Daily cap per user: 8 hours

Store this logic in a shared utility:

- `src/shared/lib/utils/audit/activity.ts`

### 5. Audited Tables Coverage Panel

The dashboard must include an explicit audited-table coverage section:

- Total audited tables configured
- Total excluded tables configured
- List of excluded tables with reason
- Top audited tables by event volume in selected period

Source these values from the trigger configuration in Step 003.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/audit-logs/_server/repository.ts` | Analytics queries over `audit_logs` |
| `src/app/audit-logs/_server/service.ts` | Role-based activity analytics service |
| `src/app/audit-logs/_server/actions.ts` | Server actions for activity dashboard |
| `src/app/audit-logs/activity/page.tsx` | Department/user activity dashboard page |
| `src/app/audit-logs/_components/ActivitySummaryCards.tsx` | Department totals cards |
| `src/app/audit-logs/_components/UserActivityLeaderboard.tsx` | Per-user activity table |
| `src/app/audit-logs/_components/TableActivityPanel.tsx` | Per-table activity and operation mix |
| `src/shared/lib/utils/audit/activity.ts` | Time-spent approximation utility |

## Validation Criteria

1. Dashboard loads with date/module filters
2. User leaderboard and department summaries match SQL aggregates
3. Table activity panel shows audited tables and operation counts
4. Time-spent estimate is computed from event streams without client-side mutation
5. Role restrictions are enforced on analytics actions
6. `pnpm tsc --noEmit && pnpm lint:fix` passes

## Notes

- This dashboard measures write activity, not passive page viewing
- For exact screen-time tracking, add explicit frontend activity telemetry in a future step
- Keep analytics queries index-friendly: use `changed_at`, `changed_by`, and `table_name` predicates first
