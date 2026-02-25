# Step 007c: Delete reports/clearance

## Introduction

Delete the `reports/clearance/` module entirely. Its functionality — per-employee clearance approved/rejected/pending counts with approval rates — has been absorbed into the Activity Tracker (Steps 007a/007b) as inline columns in the employee list for clearance departments (`finance`, `library`, `resource`).

## Prerequisites

- Step 007a and 007b must be implemented and verified working first
- The `getClearanceStats` query in `ActivityTrackerRepository` must return equivalent data to `getClearanceStatsByDepartment`

## Requirements

### 1. Delete Files

Remove the entire `reports/clearance/` directory:

| File | Purpose (being removed) |
|------|------------------------|
| `src/app/reports/clearance/_server/repository.ts` | `getClearanceStatsByDepartment`, `getUserNamesByIds` |
| `src/app/reports/clearance/_server/service.ts` | `getDepartmentClearanceStats` |
| `src/app/reports/clearance/_server/actions.ts` | `fetchClearanceStats` |
| `src/app/reports/clearance/_components/StatsTable.tsx` | Per-employee clearance stats table |
| `src/app/reports/clearance/_components/StatsSummary.tsx` | Overall clearance stat cards |
| `src/app/reports/clearance/[department]/page.tsx` | Clearance reports page |
| `src/app/reports/clearance/[department]/layout.tsx` | Department access guard |
| `src/app/reports/clearance/index.ts` | Barrel exports |

### 2. Remove Navigation Entry

In `src/app/reports/reports.config.ts`, remove the Clearance nav item:

```typescript
// DELETE this block:
{
  label: 'Clearance',
  href: (department: string) => `/reports/clearance/${department}`,
  icon: IconReportMoney,
  isVisible: (session) => {
    const userRole = session?.user?.role;
    return !!(
      session?.user?.position === 'manager' &&
      userRole &&
      ['finance', 'library', 'resource'].includes(userRole)
    );
  },
},
```

Also remove the `IconReportMoney` import if it's no longer used by other nav items.

### 3. Verify No Other Imports

Search for any remaining imports from `reports/clearance`:
- `@reports/clearance`
- `reports/clearance`
- `StatsSummary` from clearance
- `StatsTable` from clearance
- `fetchClearanceStats`

All references must be removed or redirected to the activity tracker equivalent.

### 4. Functional Equivalence Check

Verify the activity tracker provides equivalent or better coverage:

| `reports/clearance` feature | Activity tracker equivalent |
|---------------------------|---------------------------|
| Overall stats (total/approved/rejected/pending) | `DepartmentOverview` cards show total operations; clearance-specific approved/rejected/pending available via `getClearanceStats` aggregated in the UI |
| Per-staff approved/rejected/total | `EmployeeList` inline columns: Approved, Rejected, Approval Rate |
| Approval rate with progress bar | `EmployeeList` Approval Rate column with `Progress` component |
| Date range filter | `DateRangeFilter` with presets (today/7d/30d/custom) |
| Clearance type filter (registration/graduation) | **Not ported** — the activity tracker does not distinguish registration vs. graduation clearances. If needed, this can be added later as a filter on the `getClearanceStats` query |
| Department routing (`/reports/clearance/[department]`) | Auto-scoped by manager's role — no manual department selection needed |

> **Note**: The clearance type filter (registration vs. graduation) from the old report is NOT carried over. The old report allowed filtering by `registration` or `graduation` clearance types via subqueries on `registration_clearance` / `graduation_clearance` tables. If this is needed, it can be added as a `Select` filter in the Activity Tracker's employee list, passing the type to `getClearanceStats`. This is left as a future enhancement.

## Validation Criteria

1. `src/app/reports/clearance/` directory is fully deleted
2. Navigation entry removed from `reports.config.ts`
3. No broken imports referencing deleted files
4. `pnpm tsc --noEmit` passes
5. `pnpm lint:fix` passes
6. Activity tracker clearance columns work for finance/library/resource managers
7. Non-clearance departments (registry, academic) do NOT show clearance columns
