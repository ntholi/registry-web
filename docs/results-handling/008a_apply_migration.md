# Plan 008a: Apply Module — Special Migration

> Migrate the `apply/` module from its manual `try/catch` + `success()`/`failure()` pattern to `createAction`. Delete the local `errors.ts` file and update all imports. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Special

The `apply/` module **already uses `ActionResult<T>`** manually with `success()` / `failure()` and its own local `extractError` in `src/app/apply/_lib/errors.ts`. This plan converts it to use the shared `createAction` wrapper instead.

---

## Part A: Convert 6 Apply Action Files

### Migration Template (Apply-specific)

**Before** (current apply pattern):
```ts
export async function submitPayment(id: string, data: PaymentData): Promise<ActionResult<void>> {
  try {
    await paymentService.submit(id, data);
    return success(undefined);
  } catch (error) {
    return failure(extractError(error));
  }
}
```

**After**:
```ts
export const submitPayment = createAction(
  async (id: string, data: PaymentData) => {
    await paymentService.submit(id, data);
  }
);
```

### Steps for each file:
1. **Replace** manual `try/catch` + `success()` / `failure()` with `createAction`
2. Convert domain-specific catches to `throw new UserFacingError('message')` and let `createAction` handle it
3. **Remove** the local `extractError` import — `createAction` handles error extraction internally
4. **Add** `import { createAction } from '@/shared/lib/utils/actionResult'`

### Action Files

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/apply/[id]/(wizard)/review/_server/actions.ts` | Already uses ActionResult manually |
| 2 | `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` | Already uses ActionResult manually |
| 3 | `src/app/apply/[id]/(wizard)/program/_server/actions.ts` | Already uses ActionResult manually |
| 4 | `src/app/apply/[id]/(wizard)/personal-info/_server/actions.ts` | Already uses ActionResult manually |
| 5 | `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` | Already uses ActionResult manually |
| 6 | `src/app/apply/[id]/(wizard)/identity/_server/actions.ts` | Already uses ActionResult manually |

---

## Part B: Delete `apply/_lib/errors.ts` — Update Imports

After all apply actions are wrapped with `createAction`, the local `errors.ts` is no longer needed.

### Steps:

1. **Search** all files in `src/app/apply/` that import from `../_lib/errors` or `../../_lib/errors`:
```bash
grep -rn "_lib/errors" src/app/apply/ --include="*.ts" --include="*.tsx" -l
```

2. **Replace** each import:
```ts
// BEFORE
import { extractError, type ActionResult } from '../../_lib/errors';

// AFTER
import { type ActionResult } from '@/shared/lib/utils/actionResult';
```

3. **Delete** `src/app/apply/_lib/errors.ts`

**Note**: Some apply client components may also import `ActionResult` from the local file — update those to import from `@/shared/lib/utils/actionResult`.

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All 6 apply action files use `createAction` instead of manual `try/catch`
- [ ] No apply action file imports local `extractError`
- [ ] `src/app/apply/_lib/errors.ts` is **deleted**
- [ ] All apply imports updated to use shared paths (`@/shared/lib/utils/actionResult`)
- [ ] `pnpm tsc --noEmit` passes
