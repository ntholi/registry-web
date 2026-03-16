# Plan 008: Apply + Reports + Student Portal + Remaining

> Wrap **mutation** actions with `createAction`. Query actions stay as plain functions. RSC pages and ListLayout callers require **no changes**. Also update `apply/_lib/errors.ts` to re-export from shared. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Mutation Actions Only (17 files)

### Apply (6 files) — SPECIAL MIGRATION

The `apply/` module **already uses `ActionResult<T>`** manually with `success()` / `failure()` and its own `extractError`. Migration steps:

1. **Replace** manual `try/catch` + `success()` / `failure()` with `createAction`
2. Convert domain-specific catches to `throw new UserFacingError('message')` and let `createAction` handle it
3. **Update all apply imports** to use shared paths directly (e.g., `import { createAction } from '@/shared/lib/actions/actionResult'`) — `extractError` is no longer needed since `createAction` handles it internally
4. **Delete** `src/app/apply/_lib/errors.ts` (Part D below)

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

**Query-only — skip entirely.** These files contain only data-fetching queries with no mutations.

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

## Part B: RSC Pages — No Changes Needed

Since query actions stay as plain functions, all RSC pages continue calling them with plain `await`. **No `unwrap()` needed.**

Apply wizard pages consume ActionResult directly in client components (via `useActionMutation`) — that pattern is already correct.

---

## Part C: ListLayout Callers — No Changes Needed

Since `findAll*` actions stay as plain functions returning raw data, all ListLayout callers continue working as-is. **No changes needed.**

---

## Part D: Delete `apply/_lib/errors.ts` — update imports directly

After all apply actions are wrapped with `createAction`, the local `errors.ts` is no longer needed. Per project guidelines ("NEVER create redundant files whose sole purpose is to re-export"), update all apply imports to use shared paths directly and delete the file.

1. **Search** all files in `src/app/apply/` that import from `../_lib/errors` or `../../_lib/errors`
2. **Replace** each import:
```ts
// BEFORE
import { extractError, type ActionResult } from '../../_lib/errors';

// AFTER
import { type ActionResult } from '@/shared/lib/actions/actionResult';
// (extractError is no longer needed — createAction handles it internally)
```
3. **Delete** `src/app/apply/_lib/errors.ts`

---

## Part E: Update Direct `useMutation` Callers

Client components in apply/reports/student-portal/audit-logs that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Discovery

Search `_components/` folders in `src/app/apply/`, `src/app/reports/`, `src/app/student-portal/`, `src/app/audit-logs/`, `src/app/feedback/` for `useMutation({ mutationFn:` patterns.

---

## Part F: Cross-Action Calls (Apply Wizard — Mutation-Only)

The `apply/` wizard has the most cross-action calls in the codebase (~22+). Under the mutations-only strategy, only calls to **mutation** actions need `unwrap()`. Calls to query actions need no changes.

### Cross-Action Calls in Apply Wizard

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 1 | `review/_server/actions.ts` | `getApplicant()` | No (query) | No change |
| 2 | `review/_server/actions.ts` | `findApplicationsByApplicant()` | No (query) | No change |
| 3 | `review/_server/actions.ts` | `changeApplicationStatus()` | **Yes (mutation)** | Add `unwrap()` |
| 4 | `program/_server/actions.ts` | `getEligibleProgramsForApplicant()` | No (query) | No change |
| 5 | `program/_server/actions.ts` | `findApplicationsByApplicant()` | No (query) | No change |
| 6 | `program/_server/actions.ts` | `findActiveIntakePeriod()` | No (query) | No change |
| 7 | `program/_server/actions.ts` | `getOpenProgramIds()` | No (query) | No change |
| 8 | `qualifications/_server/actions.ts` | `getOrCreateApplicantForCurrentUser()` | **Yes (mutation)** | Add `unwrap()` |
| 9 | `qualifications/_server/actions.ts` | `findCertificateTypeByName()` | No (query) | No change |
| 10 | `qualifications/_server/actions.ts` | `getApplication()` | No (query) | No change |
| 11 | `qualifications/_server/actions.ts` | `getStudentByUserId()` | No (query) | No change |
| 12 | `qualifications/_server/actions.ts` | `createAcademicRecord()` | **Yes (mutation)** | Add `unwrap()` |
| 13 | `qualifications/_server/actions.ts` | `createAcademicRecordFromDocument()` | **Yes (mutation)** | Add `unwrap()` |
| 14 | `qualifications/_server/actions.ts` | `deleteAcademicRecord()` | **Yes (mutation)** | Add `unwrap()` |
| 15 | `identity/_server/actions.ts` | `getApplicant()` | No (query) | No change |
| 16 | `identity/_server/actions.ts` | `findDocumentsByType()` | No (query) | No change |
| 17 | `identity/_server/actions.ts` | `saveApplicantDocument()` | **Yes (mutation)** | Add `unwrap()` |
| 18 | `identity/_server/actions.ts` | `updateApplicantFromIdentity()` | **Yes (mutation)** | Add `unwrap()` |
| 19 | `identity/_server/actions.ts` | `deleteApplicantDocument()` | **Yes (mutation)** | Add `unwrap()` |
| 20 | `personal-info/_server/actions.ts` | `updateApplicant()` | **Yes (mutation)** | Add `unwrap()` |
| 21 | `payment/_server/actions.ts` | `getApplicant()` | No (query) | No change |
| 22 | `payment/_server/actions.ts` | `getApplicationForPayment()` | No (query) | No change |

### Cross-Action Calls in Reports

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 23 | `reports/registry/.../enrollments/_server/actions.ts` | `getAllSponsors()` | No (query) | No change |
| 24 | `reports/registry/.../student-graduations/_server/actions.ts` | `getAllSponsors()` | No (query) | No change |

**Summary**: ~10 cross-action calls need `unwrap()` (mutations only). The remaining ~14 are queries and need no changes.

---

## Verification

```bash
pnpm tsc --noEmit
```

After this plan, **all mutation actions across the entire codebase should be wrapped**. Query actions remain as plain functions. Combined with Plans 003-007.

## Done When

- [ ] All 6 apply action files use `createAction` (replacing manual try/catch)
- [ ] Report action files (8) left completely untouched (query-only)
- [ ] `src/app/apply/_lib/errors.ts` is **deleted**; all apply imports updated to shared paths
- [ ] All query actions remain as plain `async function` exports
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] All mutation→mutation cross-action calls wrapped with `unwrap()` (~10 call sites)
- [ ] `pnpm tsc --noEmit` passes
- [ ] **All modules’ mutations wrapped; queries/pages/layouts untouched**
