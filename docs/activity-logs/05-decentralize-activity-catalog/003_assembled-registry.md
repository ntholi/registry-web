# Step 3 — Assembled Registry

## Goal

Replace the monolithic `activity-catalog.ts` and `activity-types.ts` with a thin assembler that imports all module fragments, merges them, and re-exports the unified catalog, type, and derived structures.

## File: `src/app/admin/activity-tracker/_lib/registry.ts`

### 3.1 — Import All Fragments

```ts
import { mergeFragments, groupByDepartment } from '@/shared/lib/utils/activities';
import REGISTRY_ACTIVITIES from '@registry/_lib/activities';
import ACADEMIC_ACTIVITIES from '@academic/_lib/activities';
import FINANCE_ACTIVITIES from '@finance/_lib/activities';
import LIBRARY_ACTIVITIES from '@library/_lib/activities';
import ADMISSIONS_ACTIVITIES from '@admissions/_lib/activities';
import ADMIN_ACTIVITIES from '@admin/_lib/activities';
import TIMETABLE_ACTIVITIES from '@timetable/_lib/activities';
```

### 3.2 — Merge and Export

```ts
const ALL_FRAGMENTS = [
  REGISTRY_ACTIVITIES,
  ACADEMIC_ACTIVITIES,
  FINANCE_ACTIVITIES,
  LIBRARY_ACTIVITIES,
  ADMISSIONS_ACTIVITIES,
  ADMIN_ACTIVITIES,
  TIMETABLE_ACTIVITIES,
] as const;

export const ACTIVITY_CATALOG = mergeFragments(...ALL_FRAGMENTS);

export type ActivityType = keyof typeof ACTIVITY_CATALOG.catalog;

export const TABLE_OPERATION_MAP = ACTIVITY_CATALOG.tableOperationMap;

export const ACTIVITY_LABELS: Record<ActivityType, string> = Object.fromEntries(
  Object.entries(ACTIVITY_CATALOG.catalog).map(([key, val]) => [key, val.label])
) as Record<ActivityType, string>;

export const DEPARTMENT_ACTIVITIES = groupByDepartment(ACTIVITY_CATALOG.catalog);
```

### 3.3 — Re-export Utilities

```ts
export { getActivityLabel, isActivityType } from '@/shared/lib/utils/activities';
export { resolveTableActivity } from '@/shared/lib/utils/activities';
```

The `getActivityLabel` and `isActivityType` functions in shared utils will use the assembled catalog via a singleton pattern or accept it as a parameter. Since the tracker needs the full catalog and individual modules only need their own fragment, the shared functions should be parameterized.

### 3.4 — How `getActivityLabel` Works After Migration

Two options:

**Option A — Singleton (recommended):** The assembled registry calls `registerCatalog(ACTIVITY_CATALOG.catalog)` at module load time, and `getActivityLabel` reads from the registered singleton. This keeps the API unchanged for all consumers.

**Option B — Parameter passing:** Every call to `getActivityLabel(type, catalog)` passes the catalog explicitly. This is purer but requires updating every consumer.

Recommendation: **Option A** — a `registerCatalog` + singleton pattern keeps the migration non-breaking for the 5+ existing consumers.

## What Gets Deleted

After this step + Step 5:

| File | Action |
|------|--------|
| `src/app/admin/activity-tracker/_lib/activity-catalog.ts` | **Delete** — replaced by `registry.ts` + module fragments |
| `src/app/admin/activity-tracker/_lib/activity-types.ts` | **Delete** — `TABLE_OPERATION_MAP`, `DEPARTMENT_ACTIVITIES`, `ACTIVITY_LABELS`, `resolveTableActivity` all move to `registry.ts` or shared utils |

## Assembled File Size Comparison

| Before | After |
|--------|-------|
| `activity-catalog.ts`: ~409 lines | `registry.ts`: ~40 lines (imports + merge + exports) |
| `activity-types.ts`: ~193 lines | Each module `activities.ts`: 20–100 lines depending on module size |
| **Total: ~602 lines in 2 files** | **Total: ~450 lines across 9 files (7 fragments + 1 assembler + 1 shared contract)** |

Line count drops slightly, but more importantly the ownership is distributed. Adding a new library activity only touches `src/app/library/_lib/activities.ts` and optionally the assembler import (if it's a new module).

## Migration Path for Existing Imports

| Current Import | New Import |
|---------------|-----------|
| `from '@admin/activity-tracker/_lib/activity-catalog'` (tracker-internal) | `from '@admin/activity-tracker/_lib/registry'` |
| `from '@admin/activity-tracker/_lib/activity-catalog'` (external, e.g., student history) | `from '@/shared/lib/utils/activities'` |
| `from '@admin/activity-tracker/_lib/activity-types'` | `from '@admin/activity-tracker/_lib/registry'` |
| `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` (BaseRepository, BaseService) | `from '@/shared/lib/utils/activities'` (or use `string`) |
| `{ resolveTableActivity } from '@/app/admin/activity-tracker/_lib/activity-types'` (BaseRepository) | `from '@/shared/lib/utils/activities'` |
| `type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog'` (module services) | From own module's `_lib/activities` (e.g., `@registry/_lib/activities`) |
