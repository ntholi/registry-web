# Plan 008: Apply + Reports + Student Portal + Remaining

> Migrate `apply/` (6 actions), `reports/` (8 actions), `student-portal/` (1 action), `audit-logs/` (1 action), and `feedback/` (1 action) end-to-end. Also update `apply/_lib/errors.ts` to re-export from shared. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Action Files (17 files)

### Apply (6 files) — SPECIAL MIGRATION

The `apply/` module **already uses `ActionResult<T>`** manually with `success()` / `failure()` and its own `extractError`. Migration steps:

1. **Replace** manual `try/catch` + `success()` / `failure()` with `createAction`
2. Convert domain-specific catches to `throw new UserFacingError('message')` and let `createAction` handle it
3. **After all apply actions are migrated**, update `src/app/apply/_lib/errors.ts` to re-export from shared:

```ts
export { extractError, UserFacingError } from '@/shared/lib/utils/extractError';
export type { ActionResult, AppError } from '@/shared/lib/utils/actionResult';
```

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

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/apply/[id]/(wizard)/review/_server/actions.ts` | Already uses ActionResult |
| 2 | `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` | Already uses ActionResult |
| 3 | `src/app/apply/[id]/(wizard)/program/_server/actions.ts` | Already uses ActionResult |
| 4 | `src/app/apply/[id]/(wizard)/personal-info/_server/actions.ts` | Already uses ActionResult |
| 5 | `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` | Already uses ActionResult |
| 6 | `src/app/apply/[id]/(wizard)/identity/_server/actions.ts` | Already uses ActionResult |

### Reports (8 files) — Query-only

Still wrap with `createAction` for consistent error handling and logging.

| # | File |
|---|------|
| 7 | `src/app/reports/registry/student-enrollments/progression/_server/actions.ts` |
| 8 | `src/app/reports/registry/student-enrollments/enrollments/_server/actions.ts` |
| 9 | `src/app/reports/registry/student-enrollments/distribution/_server/actions.ts` |
| 10 | `src/app/reports/finance/sponsored-students/_server/actions.ts` |
| 11 | `src/app/reports/registry/graduations/student-graduations/_server/actions.ts` |
| 12 | `src/app/reports/academic/course-summary/_server/actions.ts` |
| 13 | `src/app/reports/academic/boe/_server/actions.ts` |
| 14 | `src/app/reports/academic/attendance/_server/actions.ts` |

### Student Portal (1 file)

| # | File |
|---|------|
| 15 | `src/app/student-portal/fortinet-registration/_server/actions.ts` |

### Audit Logs (1 file)

| # | File |
|---|------|
| 16 | `src/app/audit-logs/_server/actions.ts` |

### Feedback (1 file)

| # | File |
|---|------|
| 17 | `src/app/feedback/_server/actions.ts` |

---

## Part B: Update RSC Pages (~15 pages)

### Apply

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/apply/new/page.tsx` | Check for direct calls |
| 2 | `src/app/apply/welcome/page.tsx` | Check for direct calls |
| 3 | `src/app/apply/courses/page.tsx` | Check for direct calls |

*Note*: Apply wizard pages (under `[id]/(wizard)/`) may consume ActionResult directly in client components rather than RSC pages — verify the pattern before adding `unwrap()`.

### Reports

| # | File |
|---|------|
| 4 | `src/app/reports/registry/student-enrollments/progression/page.tsx` |
| 5 | `src/app/reports/registry/student-enrollments/enrollments/page.tsx` |
| 6 | `src/app/reports/registry/student-enrollments/distribution/page.tsx` |
| 7 | `src/app/reports/finance/sponsored-students/page.tsx` |
| 8 | `src/app/reports/registry/graduations/student-graduations/page.tsx` |
| 9 | `src/app/reports/academic/course-summary/page.tsx` |
| 10 | `src/app/reports/academic/boe/page.tsx` |
| 11 | `src/app/reports/academic/attendance/page.tsx` |

### Other

| # | File |
|---|------|
| 12 | `src/app/audit-logs/page.tsx` |
| 13 | `src/app/audit-logs/[id]/page.tsx` |
| 14 | `src/app/feedback/page.tsx` |

---

## Part C: Verify/Update ListLayout Callers

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/audit-logs/layout.tsx` | Arrow wrapper |

---

## Part D: Update `apply/_lib/errors.ts`

After all apply actions are wrapped with `createAction`, replace the local implementation with re-exports:

```ts
export { extractError, UserFacingError } from '@/shared/lib/utils/extractError';
export type { ActionResult, AppError } from '@/shared/lib/utils/actionResult';
```

This ensures any remaining `apply/` imports of `extractError` or `ActionResult` continue working via the re-export.

---

## Verification

```bash
pnpm tsc --noEmit
```

After this plan, **all action files across the entire codebase should be wrapped**. Combined with Plans 003-007.

## Done When

- [ ] All 17 action files import and use `createAction`
- [ ] Apply module no longer manually wraps with `success()`/`failure()` + `try/catch`
- [ ] `src/app/apply/_lib/errors.ts` re-exports from shared
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified/updated
- [ ] `pnpm tsc --noEmit` passes
- [ ] **All modules fully migrated; entire codebase uses new pattern**
