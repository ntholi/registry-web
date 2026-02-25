# Step 1 — Shared Activity Contract

## Goal

Define the shared types, fragment shape, and utility functions that all modules will use to declare and consume activity definitions.

## File: `src/shared/lib/utils/activities.ts`

### 1.1 — Fragment Type

```ts
type Department =
  | 'registry'
  | 'academic'
  | 'finance'
  | 'library'
  | 'marketing'
  | 'admin'
  | 'resource';

interface ActivityEntry {
  label: string;
  department: Department;
}

interface ActivityFragment<T extends Record<string, ActivityEntry> = Record<string, ActivityEntry>> {
  catalog: T;
  tableOperationMap?: Record<string, keyof T & string>;
}
```

Each module will export a const-typed `ActivityFragment`. The generic parameter `T` preserves the exact keys so the module gets a narrow type for its own activity keys.

### 1.2 — Assembly Utilities

```ts
function mergeFragments<T extends ActivityFragment[]>(
  ...fragments: T
): {
  catalog: Record<string, ActivityEntry>;
  tableOperationMap: Record<string, string>;
}
```

Takes all module fragments and merges them into a single catalog + table operation map. This replaces the current monolith.

### 1.3 — Label Resolution

```ts
function getActivityLabel(activityType: string, catalog: Record<string, ActivityEntry>): string
```

Moved from `activity-catalog.ts` to shared. Accepts the assembled catalog as a parameter (or uses a module-level singleton).

### 1.4 — Department Grouping

```ts
function groupByDepartment(catalog: Record<string, ActivityEntry>): Record<Department, string[]>
```

Replaces the current `DEPARTMENT_ACTIVITIES` runtime computation. Called once at assembly time.

### 1.5 — Type Guard

```ts
function isActivityType(value: string, catalog: Record<string, ActivityEntry>): boolean
```

Generic guard that works against any assembled catalog.

## Implementation Notes

- Export all types and functions from `src/shared/lib/utils/activities.ts`
- Do NOT export a pre-assembled catalog from shared — that's the assembler's job (Step 3)
- Keep the file focused on contracts and pure functions; no database imports
- The `Department` type should be re-exported so modules and the tracker UI can reference it

## Why Not Put Assembly in Shared?

The assembled catalog imports from every module (`@registry/...`, `@academic/...`, `@library/...`). Putting that in `src/shared/` would create a dependency from shared → app modules, violating the dependency direction. The assembly lives in `admin/activity-tracker/_lib/` where the tracker consumes it.
