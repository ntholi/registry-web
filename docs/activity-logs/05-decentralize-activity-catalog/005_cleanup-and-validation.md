# Step 5 — Cleanup and Validation

## Goal

Remove the old monolithic files, update all remaining imports, and verify the system is fully functional with zero type/lint errors.

## 5.1 — Delete Old Files

| File | Status |
|------|--------|
| `src/app/admin/activity-tracker/_lib/activity-catalog.ts` | **Delete** |
| `src/app/admin/activity-tracker/_lib/activity-types.ts` | **Delete** |

## 5.2 — Update All Remaining Imports

### Internal Tracker Imports (within `admin/activity-tracker/`)

| File | Old Import | New Import |
|------|-----------|-----------|
| `_server/repository.ts` | `from '../_lib/activity-catalog'` | `from '../_lib/registry'` |
| `_components/DailyTrendsChart.tsx` | `from '../_lib/activity-catalog'` | `from '../_lib/registry'` |
| `_components/EmployeeList.tsx` | `from '../_lib/activity-catalog'` | `from '../_lib/registry'` |

### Core Platform Imports (`src/core/platform/`)

| File | Old Import | New Import |
|------|-----------|------------|
| `BaseRepository.ts` | `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` | `type { ActivityType } from '@/shared/lib/utils/activities'` (or use `string`) |
| `BaseRepository.ts` | `{ resolveTableActivity } from '@/app/admin/activity-tracker/_lib/activity-types'` | `{ resolveTableActivity } from '@/shared/lib/utils/activities'` |
| `BaseService.ts` | `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` | `type { ActivityType } from '@/shared/lib/utils/activities'` (or use `string`) |

### External Imports (outside `admin/activity-tracker/`)

| File | Old Import | New Import |
|------|-----------|------------|
| `registry/students/_components/history/StudentHistoryView.tsx` | `from '@admin/activity-tracker/_lib/activity-catalog'` | `from '@/shared/lib/utils/activities'` |
| `registry/students/_server/service.ts` | `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` | `type { RegistryActivityType } from '@registry/_lib/activities'` |
| `registry/registration/requests/_server/clearance/service.ts` | `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` | `type { RegistryActivityType } from '@registry/_lib/activities'` |
| `admin/tasks/_server/service.ts` | `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` | `type { AdminActivityType } from '@admin/_lib/activities'` |
| `admin/notifications/_server/service.ts` | `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` | `type { AdminActivityType } from '@admin/_lib/activities'` |

### Import What?

| Symbol | Available From |
|--------|---------------|
| `getActivityLabel` | `@/shared/lib/utils/activities` |
| `isActivityType` | `@/shared/lib/utils/activities` |
| `ActivityType` (global union) | `@admin/activity-tracker/_lib/registry` |
| `ACTIVITY_CATALOG` | `@admin/activity-tracker/_lib/registry` |
| `TABLE_OPERATION_MAP` | `@admin/activity-tracker/_lib/registry` |
| `ACTIVITY_LABELS` | `@admin/activity-tracker/_lib/registry` |
| `DEPARTMENT_ACTIVITIES` | `@admin/activity-tracker/_lib/registry` |
| `resolveTableActivity` | `@/shared/lib/utils/activities` |
| `RegistryActivityType` | `@registry/_lib/activities` |
| `LibraryActivityType` | `@library/_lib/activities` |
| etc. | Each module's `_lib/activities` |

## 5.3 — Validation Steps

Run in order:

```bash
pnpm tsc --noEmit
```

Fix any type errors. Common issues:
- Missing imports after file deletion
- Activity type string literals that don't match new constant names
- Fragment shape mismatches (missing `as const` or `satisfies`)

```bash
pnpm lint:fix
```

Fix any lint issues (unused imports, formatting).

```bash
# Verify no remaining references to deleted files
grep -r "activity-catalog" src/ --include="*.ts" --include="*.tsx"
grep -r "activity-types" src/ --include="*.ts" --include="*.tsx"
```

Both should return zero results.

## 5.4 — Functional Verification

| Test | Expected Result |
|------|----------------|
| Activity Tracker dashboard loads | Department summaries display correctly |
| Employee drill-down shows labels | `getActivityLabel` resolves all types |
| Student history tab | Timeline entries show activity labels |
| Perform an action (e.g., edit a student) | `audit_logs.activity_type` is populated correctly |
| Add a new activity to library module | Only requires editing `library/_lib/activities.ts` + assembler import (if new module) |

## 5.5 — Future-Proofing: Adding New Modules

When a new module (e.g., `hostel/`) needs activities:

1. Create `src/app/hostel/_lib/activities.ts` with its fragment
2. Add `@hostel/*` path alias to `tsconfig.json` (if not present)
3. Add one import line to `src/app/admin/activity-tracker/_lib/registry.ts`
4. Include the fragment in the `ALL_FRAGMENTS` array
5. Done — no other files need modification

## 5.6 — File Impact Summary

| Action | Count | Files |
|--------|-------|-------|
| **Created** | 9 | 7 module fragments + 1 assembler + 1 shared contract |
| **Deleted** | 2 | `activity-catalog.ts` + `activity-types.ts` |
| **Modified (core)** | 2 | `BaseRepository.ts` + `BaseService.ts` (import path changes) |
| **Modified (imports)** | 8 | 3 tracker components/server + 1 student history + 4 services importing `ActivityType` directly |
| **Modified (services)** | ~53 | All services using `activityType` strings (type-safety upgrade) |
| **Net new files** | +7 | Better distributed across the codebase |
