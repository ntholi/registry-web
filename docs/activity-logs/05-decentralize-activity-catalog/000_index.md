# Decentralize Activity Catalog — Implementation Plan

## Problem

The activity catalog (`activity-catalog.ts`, ~409 lines) and its companion `activity-types.ts` (~193 lines) are monolithic God files living inside `src/app/admin/activity-tracker/_lib/`. Every module's activity definitions — registry, academic, finance, library, admissions, timetable, admin — are packed into a single centralized location.

### Pain Points

1. **Ownership violation**: Library activity types (`book_added`, `loan_deleted`) are defined inside the `admin` module. Same for registry, finance, academic, timetable, and admissions activities.
2. **Scalability bottleneck**: Adding a new feature to *any* module requires editing files in `admin/activity-tracker/_lib/`. As the system grows, the catalog becomes unmanageable.
3. **No type safety at point of use**: Services hardcode activity type strings (`'venue_created'`, `'book_added'`) without importing from the catalog. There is zero compile-time guarantee that a string literal matches a catalog key.
4. **Merge conflicts**: Multiple developers working on different modules will frequently collide on the same two files.
5. **`TABLE_OPERATION_MAP` is similarly centralized**: 147 table-operation mappings for all modules live in one file.
6. **`DEPARTMENT_ACTIVITIES` is derived at runtime**: grouping by department is computed dynamically from the monolith instead of being declared by each module.

### Current Consumer Map

| Consumer | What It Uses | Location |
|----------|-------------|----------|
| `BaseRepository` | `ActivityType` (type), `resolveTableActivity` (function) | `src/core/platform/BaseRepository.ts` |
| `BaseService` | `ActivityType` (type) for `activityTypes: { create, update, delete }` config | `src/core/platform/BaseService.ts` |
| All module services | `ActivityType` (type) + string literals (e.g., `'book_added'`) | `*/_server/service.ts` across all modules (~53 services) |
| Activity Tracker UI | `getActivityLabel`, `ACTIVITY_CATALOG`, `DEPARTMENT_ACTIVITIES`, `ACTIVITY_LABELS` | `src/app/admin/activity-tracker/_components/` |
| Activity Tracker Repository | `getActivityLabel` | `src/app/admin/activity-tracker/_server/repository.ts` |
| Student History UI | `getActivityLabel` | `src/app/registry/students/_components/history/StudentHistoryView.tsx` |

## Solution

Decentralize activity definitions into each owning module via a **fragment registration pattern**:

1. Each module declares its own activity fragment in a local `_lib/activities.ts` file
2. A shared contract in `src/shared/lib/utils/activities.ts` defines the fragment shape and aggregation utilities
3. The centralized catalog is replaced by an auto-assembled registry that merges all fragments
4. Services import their activity type constants from their own module, gaining compile-time safety
5. `TABLE_OPERATION_MAP` entries move alongside activity definitions into each module

## Plan Structure

| Step | File | Description |
|------|------|-------------|
| 1 | [001_shared-activity-contract.md](001_shared-activity-contract.md) | Define shared types, fragment shape, registry builder, and utility functions in `src/shared/lib/utils/` |
| 2 | [002_module-fragments.md](002_module-fragments.md) | Create `_lib/activities.ts` in each module defining that module's activity entries and table mappings |
| 3 | [003_assembled-registry.md](003_assembled-registry.md) | Replace the monolith files with a thin assembler that imports all module fragments |
| 4 | [004_type-safe-services.md](004_type-safe-services.md) | Update services to import activity constants from their own module instead of hardcoding strings |
| 5 | [005_cleanup-and-validation.md](005_cleanup-and-validation.md) | Remove old monolith files, update all imports, verify with `pnpm tsc --noEmit & pnpm lint:fix` |

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fragment location | `src/app/{module}/_lib/activities.ts` | Co-located with the module that owns the activities; follows existing `_lib/` convention |
| Shared contract location | `src/shared/lib/utils/activities.ts` | Cross-module utilities live in shared; mirrors `colors.ts`, `status.tsx`, `dates.ts` |
| Fragment shape | `{ catalog, tableOperationMap }` | Each module exports both its catalog entries and its table→activity mappings together |
| Type safety approach | Const objects with `as const` + derived union types per module | Services get module-scoped types; global `ActivityType` is union of all module types |
| Assembly location | `src/app/admin/activity-tracker/_lib/registry.ts` | The tracker remains the consumer of the full assembled catalog; it imports all fragments |
| `DEPARTMENT_ACTIVITIES` | Derived at assembly time from fragment metadata | Each fragment declares its department; grouping is computed once during assembly |
| `getActivityLabel` stays in shared | Yes | Used by multiple modules (tracker UI, student history); belongs in shared utils |

## Verification Checklist

1. `pnpm tsc --noEmit` — zero type errors after all migration steps
2. `pnpm lint:fix` — zero lint issues
3. Every `activityType` string literal in services is replaced with a typed constant import
4. No remaining imports from the deleted monolith files
5. Activity Tracker UI renders identically (labels, department grouping, charts unchanged)
6. Student History UI `getActivityLabel` works unchanged
7. `BaseService.activityTypes` config in all services uses module-local constants
8. `BaseRepository.ts` and `BaseService.ts` imports updated from monolith to shared utils
9. Adding a new activity to any module only requires editing files within that module (+ the assembler import)
10. Total activity count matches: registry (50) + academic (30) + finance (8) + library (29) + marketing (27) + admin (16) + resource (12) = 172 entries
