# Plan 010: Verification

> Final full-codebase verification — type-check, lint, and manual testing checklist.

## Prerequisites

- Plans 001-009 all completed

### Step 1: Type-check

```bash
pnpm tsc --noEmit
```

**Expected**: Zero errors. If errors remain, fix them before proceeding.

Common residual issues:
- Action callers still expecting unwrapped return types → add `unwrap()` or update type annotation
- `AppError` vs `string` type mismatches in error handling code (should be clean after Plan 009)
- Missing `import { unwrap } from '@/shared/lib/utils/actionResult'`

### Step 2: Lint

```bash
pnpm lint:fix
```

**Expected**: Clean or auto-fixable issues only.

### Step 3: Combined (standard project verification)

```bash
pnpm tsc --noEmit & pnpm lint:fix
```

---

## Manual Verification Checklist

### Shared Infrastructure

- [ ] `src/shared/lib/utils/extractError.ts` exists and exports `extractError`, `UserFacingError`
- [ ] `src/shared/lib/utils/actionResult.ts` exports `AppError`, `ActionResult`, `success`, `failure`, `createAction`, `unwrap`, `isActionResult`, `getActionErrorMessage`
- [ ] `src/app/apply/_lib/errors.ts` re-exports from shared

### Error Boundaries

- [ ] `src/app/error.tsx` exists — shows generic message, never `error.message`
- [ ] `src/app/global-error.tsx` exists — standalone `<html>`, `<body>`, `MantineProvider`
- [ ] `src/app/not-found.tsx` exists (should already exist)

### UI Components

- [ ] `StatusPage` has `onRetry` prop
- [ ] `Form.tsx` uses shared `isActionResult` + `getActionErrorMessage`
- [ ] `DeleteButton.tsx` detects `ActionResult` in `onSuccess`
- [ ] `DetailsViewHeader.tsx` has updated `handleDelete` type
- [ ] `ListLayout.tsx` unwraps `ActionResult`, shows error state + retry
- [ ] If Plan 009 Task 2 was done: `ListLayout.tsx` uses object params `{ page, search }`

### QueryClient

- [ ] `src/app/providers.tsx` has `defaultOptions.mutations.onError` with notification toast

### Action Files (spot check)

Pick 5 random action files from different modules and verify:
- [ ] Uses `import { createAction } from '@/shared/lib/utils/actionResult'`
- [ ] All exports use `export const ... = createAction(async (...) => ...)`
- [ ] No manual `try/catch` blocks

### RSC Pages (spot check)

Pick 5 random `[id]/page.tsx` files and verify:
- [ ] Uses `import { unwrap } from '@/shared/lib/utils/actionResult'`
- [ ] Direct `await` calls wrapped: `unwrap(await getEntity(id))`
- [ ] `notFound()` check remains after `unwrap()`

### ListLayout Callers (spot check)

Pick 5 random `layout.tsx` files and verify:
- [ ] `getData` prop passes compatible function
- [ ] If Plan 009 Task 2 was done: arrow wrappers use `({ page, search })` not `(page, search)`

---

## Smoke Test (Manual in Browser)

### Happy Paths
- [ ] Navigate to any list page → data loads in ListLayout
- [ ] Click an item → detail page renders
- [ ] Edit an item → form submits, success notification shows
- [ ] Delete an item → confirmation modal, item removed, redirect works

### Error Paths
- [ ] Disconnect database → ListLayout shows inline error with "Retry" button
- [ ] Navigate to `/registry/students/99999999` (non-existent) → 404 page
- [ ] Submit a form with duplicate unique constraint → error toast with "A record with this value already exists"
- [ ] Visit any page after simulating root layout crash → `global-error.tsx` renders

---

## Cleanup

- [ ] Remove any remaining local `isActionResult` implementations (search codebase)
- [ ] Remove any unused `success()` / `failure()` imports from old manual pattern
- [ ] Verify no action file imports `extractError` directly (only `createAction` uses it)

## Done When

- [ ] `pnpm tsc --noEmit` — zero errors
- [ ] `pnpm lint:fix` — clean
- [ ] Manual spot checks pass
- [ ] Smoke test in browser passes
- [ ] **The entire migration is complete**
