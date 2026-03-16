# Plan 009: Cleanup & Type Tightening

> Remove backward compatibility layers and tighten `ActionResult.error` to `AppError` only. **Requires all modules migrated (Plans 003-008).**

## Prerequisites

- Plans 001-008 all completed (every mutation action file wrapped, query actions left as plain functions)

---

## Task 1: Tighten `ActionResult.error` type

**File**: `src/shared/lib/actions/actionResult.ts`

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

## Task 2: Remove unused compat code

- Search for any remaining local `isActionResult` implementations — remove, use shared import
- Verify `src/app/apply/_lib/errors.ts` is already deleted (Plan 008)
- Verify no action file imports `extractError` directly (only `createAction` uses it)
- Verify all direct `useMutation` callers have been converted to `useActionMutation`

---

## Verification

```bash
pnpm tsc --noEmit && pnpm lint:fix
```

## Done When

- [ ] `ActionResult.error` is `AppError` only (no `string` union)
- [ ] `failure()` only accepts `AppError`
- [ ] `getActionErrorMessage()` only accepts `AppError`
- [ ] No unused compat code remains
- [ ] `pnpm tsc --noEmit` passes — zero errors
