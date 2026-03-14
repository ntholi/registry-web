# Plan 009: Cleanup & Type Tightening

> Remove backward compatibility layers, tighten `ActionResult.error` to `AppError` only. Optionally switch ListLayout to object params. **Requires all modules migrated (Plans 003-008).**

## Prerequisites

- Plans 001-008 all completed (every action file wrapped, every RSC page updated)

---

## Task 1: Tighten `ActionResult.error` type

**File**: `src/shared/lib/utils/actionResult.ts`

Change the union to strict `AppError`:

```ts
// BEFORE (migration compat)
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError | string };

// AFTER (strict)
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };
```

Also update `failure()`:
```ts
// BEFORE
export function failure<T>(error: AppError | string): ActionResult<T>

// AFTER
export function failure<T>(error: AppError): ActionResult<T>
```

And simplify `getActionErrorMessage()`:
```ts
// BEFORE
export function getActionErrorMessage(error: AppError | string): string {
  return typeof error === 'string' ? error : error.message;
}

// AFTER
export function getActionErrorMessage(error: AppError): string {
  return error.message;
}
```

**Run `pnpm tsc --noEmit`** after this change. Fix any remaining callers that still pass strings to `failure()`.

---

## Task 2 (Optional): Switch ListLayout to object params

This is a cosmetic improvement — the app works fine without it. Only do this if desired.

### 2a: Update ListLayout `getData` signature

```ts
// BEFORE
getData: (
  page: number,
  search: string
) => Promise<ActionResult<GetDataResult<T>> | GetDataResult<T>>;

// AFTER
getData: (
  params: { page: number; search: string }
) => Promise<ActionResult<GetDataResult<T>>>;
```

Also remove the raw `GetDataResult<T>` from the union since all actions now return `ActionResult`.

### 2b: Update ListLayout `queryFn`

```ts
// BEFORE
queryFn: async () => {
  const result = await getData(page, search);
  // ... handle both formats
}

// AFTER
queryFn: async () => {
  const result = await getData({ page, search });
  if (!result.success) throw new Error(getActionErrorMessage(result.error));
  return result.data;
}
```

### 2c: Update all `findAll` actions to object params

```ts
// BEFORE
export const findAllThings = createAction(
  async (page: number, search: string) => thingService.findAll({ page, search })
);

// AFTER
export const findAllThings = createAction(
  async ({ page, search }: { page: number; search: string }) =>
    thingService.findAll({ page, search })
);
```

### 2d: Update ListLayout callers

**Direct references** (`getData={findAllAction}`) — auto-work if action params match.

**Arrow wrappers** — update from positional to object:
```tsx
// BEFORE
getData={(page, search) => findAllThings(page, search, extra)}

// AFTER
getData={({ page, search }) => findAllThings({ page, search, extra })}
```

**Files to update** (arrow wrappers / internal functions — same list from original Plan 009):

| # | File | Type |
|---|------|------|
| 1 | `src/app/admissions/applications/layout.tsx` | Arrow wrapper |
| 2 | `src/app/audit-logs/layout.tsx` | Arrow wrapper |
| 3 | `src/app/registry/student-notes/layout.tsx` | Arrow wrapper |
| 4 | `src/app/admin/tasks/layout.tsx` | Arrow wrapper |
| 5 | `src/app/admin/notifications/layout.tsx` | Arrow wrapper |
| 6 | `src/app/admin/activity-tracker/layout.tsx` | Arrow wrapper |
| 7 | `src/app/auth/permission-presets/layout.tsx` | Arrow wrapper |
| 8 | `src/app/registry/blocked-students/layout.tsx` | Inline async |
| 9 | `src/app/registry/registration/requests/layout.tsx` | Inline async |
| 10 | `src/app/registry/registration/clearance/layout.tsx` | Inline async |
| 11 | `src/app/registry/graduation/clearance/layout.tsx` | Inline async |
| 12 | `src/app/admissions/subjects/layout.tsx` | Internal function |
| 13 | `src/app/academic/assessments/layout.tsx` | Internal function |
| 14 | `src/app/admissions/entry-requirements/layout.tsx` | Internal function |

---

## Task 3: Remove unused compat code

- Search for any remaining local `isActionResult` implementations — remove, use shared import
- Search for any remaining `success()` / `failure()` imports from `apply/_lib/errors.ts` — should now use `createAction`
- Verify no action file imports `extractError` directly (only `createAction` uses it)

---

## Verification

```bash
pnpm tsc --noEmit && pnpm lint:fix
```

## Done When

- [ ] `ActionResult.error` is `AppError` only (no `string` union)
- [ ] `failure()` only accepts `AppError`
- [ ] `getActionErrorMessage()` only accepts `AppError`
- [ ] (If Task 2 done) ListLayout uses object params, all callers updated
- [ ] No unused compat code remains
- [ ] `pnpm tsc --noEmit` passes — zero errors
