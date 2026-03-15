# Plan 009a: Type Tightening + Compat Removal

> Remove backward compatibility layers and tighten `ActionResult.error` from `AppError | string` to `AppError` only. Remove unused compat code. **Requires all modules migrated (Plans 004–008).**

## Prerequisites

- Plans 001–008 all completed (every action file wrapped, every RSC page updated, every `useMutation` caller migrated)

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

## Task 2: Remove unused compat code

Search for and clean up any remaining backward-compat artifacts:

1. **Local `isActionResult` implementations** — search codebase, remove, use shared import:
```bash
grep -rn "function isActionResult" src/ --include="*.ts" --include="*.tsx"
```

2. **Verify `src/app/apply/_lib/errors.ts` is deleted** (should be done in Plan 008a)

3. **Verify no action file imports `extractError` directly** — only `createAction` uses it:
```bash
grep -rn "from.*extractError" src/ --include="*.ts" --include="*.tsx" | grep -v "actionResult"
```

4. **Verify all direct `useMutation` callers converted** — no remaining `useMutation({ mutationFn: wrappedAction })` patterns:
```bash
grep -rn "useMutation({" src/app/ --include="*.ts" --include="*.tsx" -l
```

5. **Verify no remaining `success()`/`failure()` manual usage** outside of `actionResult.ts`:
```bash
grep -rn "return success(" src/app/ --include="*.ts" | grep -v "actionResult"
grep -rn "return failure(" src/app/ --include="*.ts" | grep -v "actionResult"
```

---

## Verification

```bash
pnpm tsc --noEmit && pnpm lint:fix
```

## Done When

- [x] `ActionResult.error` is `AppError` only (no `string` union)
- [x] `failure()` only accepts `AppError`
- [x] `getActionErrorMessage()` only accepts `AppError`
- [x] No remaining local `isActionResult` implementations
- [x] No remaining direct `extractError` imports in action files
- [x] No remaining manual `success()`/`failure()` usage
- [ ] `pnpm tsc --noEmit` passes — zero errors
