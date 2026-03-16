# Plan 004: Registry Module

> Migrate the entire `registry/` module end-to-end: wrap actions with `createAction`, update RSC pages with `unwrap()`, verify/update ListLayout callers. **Non-breaking** — all other modules (except already-migrated academic) continue working unchanged.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

Same as Plan 003 — ListLayout and Form already handle both formats. Unmigrated modules keep working.

---

## Part A.0: Fix Service-Level Action Imports (PREREQUISITE)

Before wrapping `getActiveTerm()` with `createAction`, all **service files** that import it must be refactored to use the service layer directly. Otherwise wrapping would change the return type from `Term` to `ActionResult<Term>`, breaking those service callers.

### Step 1: Add `getActiveOrThrow()` to `termsService`

Add a helper to `src/app/registry/terms/_server/service.ts` that encapsulates the null-check + throw:

```ts
import { UserFacingError } from '@/shared/lib/actions/extractError';

// Inside the service class or as a method:
async getActiveOrThrow() {
  const term = await this.getActive();
  if (!term) throw new UserFacingError('No active term', 'NO_ACTIVE_TERM');
  return term;
}
```

### Step 2: Update service callers

| # | File | Before | After |
|---|------|--------|-------|
| 1 | `src/app/academic/attendance/_server/service.ts` | `import { getActiveTerm } from '@/app/registry/terms'` | `import { termsService } from '@registry/terms/_server/service'` → use `termsService.getActiveOrThrow()` |
| 2 | `src/app/academic/assigned-modules/_server/service.ts` | `import { getActiveTerm } from '@/app/registry/terms'` | `import { termsService } from '@registry/terms/_server/service'` → use `termsService.getActiveOrThrow()` |
| 3 | `src/app/registry/registration/requests/_server/requests/service.ts` | `import { getActiveTerm } from '@/app/registry/terms'` | `import { termsService } from '@registry/terms/_server/service'` → use `termsService.getActiveOrThrow()` |
| 4 | `src/app/registry/registration/requests/_server/clearance/service.ts` | `import { getActiveTerm } from '@/app/registry/terms'` | `import { termsService } from '@registry/terms/_server/service'` → use `termsService.getActiveOrThrow()` |
| 5 | `src/app/registry/students/_server/service.ts` | `import { getActiveTerm } from '@/app/registry/terms'` | `import { termsService } from '@registry/terms/_server/service'` → use `termsService.getActiveOrThrow()` |

### Step 3: Retroactive `unwrap()` for academic action callers (deferred from Plan 003)

After `getActiveTerm` is wrapped with `createAction` (Part A below), add `unwrap()` to all **action-level** callers from Plan 003:

| # | File | Calls to wrap with `unwrap()` |
|---|------|-------------------------------|
| 1 | `src/app/academic/assessments/_server/actions.ts` | `getActiveTerm()` ×2 |
| 2 | `src/app/academic/assigned-modules/_server/actions.ts` | `getActiveTerm()` ×3 |
| 3 | `src/app/academic/assessment-marks/_server/actions.ts` | `getActiveTerm()` |
| 4 | `src/app/academic/feedback/cycles/_server/actions.ts` | `getAllTerms()` |

---

## Part A: Wrap Action Files (18 files)

Use the same migration template as Plan 003. Key rules:
- Wrap all actions with `createAction`
- **Keep positional params** — `findAll(page, search)` stays as-is
- `export const` for wrapped actions
- No manual `try/catch`

### Action Files

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/registry/terms/_server/actions.ts` | |
| 2 | `src/app/registry/terms/settings/_server/actions.ts` | |
| 3 | `src/app/registry/students/_server/actions.ts` | Large file, many actions |
| 4 | `src/app/registry/student-statuses/_server/actions.ts` | |
| 5 | `src/app/registry/student-notes/_server/actions.ts` | |
| 6 | `src/app/registry/certificates/_server/actions.ts` | |
| 7 | `src/app/registry/graduation/dates/_server/actions.ts` | |
| 8 | `src/app/registry/certificate-reprints/_server/actions.ts` | |
| 9 | `src/app/registry/blocked-students/_server/actions.ts` | |
| 10 | `src/app/registry/documents/_server/actions.ts` | |
| 11 | `src/app/registry/print/transcript/_server/actions.ts` | |
| 12 | `src/app/registry/print/student-card/_server/actions.ts` | |
| 13 | `src/app/registry/print/statement-of-results/_server/actions.ts` | |
| 14 | `src/app/registry/clearance/auto-approve/_server/actions.ts` | |
| 15 | `src/app/registry/registration/requests/_server/actions.ts` | |
| 16 | `src/app/registry/registration/clearance/_server/actions.ts` | |
| 17 | `src/app/registry/graduation/requests/_server/actions.ts` | |
| 18 | `src/app/registry/graduation/clearance/_server/actions.ts` | |

### Special Cases

- **`registry/students/`**: Likely the largest action file. May have complex multi-step actions — wrap the entire body in `createAction`.
- **Actions with `revalidatePath`**: Keep `revalidatePath` calls inside the `createAction` handler.

---

## Part B: Update RSC Pages (~24 pages)

Wrap all direct `await actionFn()` calls with `unwrap()`. See Plan 003 for template.

### RSC Pages

| # | File | Action calls to wrap |
|---|------|---------------------|
| 1 | `src/app/registry/students/[id]/page.tsx` | `getStudent(stdNo)` |
| 2 | `src/app/registry/terms/[code]/page.tsx` | `getTerm(code)` |
| 3 | `src/app/registry/terms/[code]/edit/page.tsx` | `getTerm(code)` |
| 4 | `src/app/registry/student-statuses/[id]/page.tsx` | `getStudentStatus(id)` |
| 5 | `src/app/registry/student-statuses/[id]/edit/page.tsx` | `getStudentStatus(id)` |
| 6 | `src/app/registry/student-notes/[id]/page.tsx` | `getStudentNote(id)` |
| 7 | `src/app/registry/blocked-students/[id]/page.tsx` | `getBlockedStudent(id)` |
| 8 | `src/app/registry/certificate-reprints/[id]/page.tsx` | `getCertificateReprint(id)` |
| 9 | `src/app/registry/certificate-reprints/[id]/edit/page.tsx` | `getCertificateReprint(id)` |
| 10 | `src/app/registry/graduation/dates/[date]/page.tsx` | `getGraduationDate(date)` |
| 11 | `src/app/registry/graduation/dates/[date]/edit/page.tsx` | `getGraduationDate(date)` |
| 12 | `src/app/registry/graduation/requests/[id]/page.tsx` | `getGraduationRequest(id)` |
| 13 | `src/app/registry/registration/requests/[id]/page.tsx` | `getRegistrationRequest(id)` |
| 14 | `src/app/registry/clearance/auto-approve/page.tsx` | Check for direct calls |

*Note*: List pages that only render `{children}` don't need changes. Verify before modifying.

---

## Part C: Verify/Update ListLayout Callers

### Direct References — Verify Only

These pass `getData={findAllAction}` directly and should auto-work:

| # | File |
|---|------|
| 1 | `src/app/registry/terms/layout.tsx` |
| 2 | `src/app/registry/students/layout.tsx` |
| 3 | `src/app/registry/student-statuses/layout.tsx` |
| 4 | `src/app/registry/certificates/layout.tsx` |
| 5 | `src/app/registry/certificate-reprints/layout.tsx` |
| 6 | `src/app/registry/graduation/dates/layout.tsx` |
| 7 | `src/app/registry/graduation/requests/layout.tsx` |

### Arrow Function Wrappers — Must Update

These wrap `getData` with arrow functions using positional params. Since the underlying action's return type changed (now `ActionResult`), the arrow wrapper's return type also changes. ListLayout handles both formats, so these should still work. But verify and update the arrow function if it does any transformation:

| # | File | Notes |
|---|------|-------|
| 8 | `src/app/registry/student-notes/layout.tsx` | Arrow wrapper |
| 9 | `src/app/registry/blocked-students/layout.tsx` | May have inline filtering |
| 10 | `src/app/registry/registration/requests/layout.tsx` | Status filtering |
| 11 | `src/app/registry/registration/clearance/layout.tsx` | Complex multi-step logic |
| 12 | `src/app/registry/graduation/clearance/layout.tsx` | Complex multi-step logic |

**For layouts with complex logic**: If the layout unwraps the action result manually (e.g., destructures `items`, `totalPages`), it needs updating to handle `ActionResult`. Use `isActionResult` + `unwrap` pattern or let ListLayout handle it by passing the raw result through.

---

## Part D: Update Direct `useMutation` Callers

Client components in the registry module that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Discovery

Search all `_components/` folders in `src/app/registry/` for `useMutation({ mutationFn:` patterns. Replace with `useActionMutation`.

Known candidates:
- `src/app/registry/students/_components/sponsors/` (EditSponsorModal, etc.)
- `src/app/registry/student-notes/_components/` (NoteModal)
- `src/app/registry/certificate-reprints/_components/` (StatusSwitch)
- `src/app/registry/registration/` components
- `src/app/registry/graduation/` components

---

## Part E: Update Cross-Action Calls

When an action in this module calls a wrapped action from another module, wrap with `unwrap()`. See Plan 003 for template.

### Cross-Action Calls in Registry Module

| # | File | Cross-action call | Import source | Wrapped in | Action |
|---|------|------------------|---------------|------------|--------|
| 1 | `students/_server/actions.ts` | `getUnpublishedTermCodes()` | `@/app/registry/terms/settings/_server/actions` | Plan 004 (this plan) | Add `unwrap()` now |
| 2 | `terms/settings/_server/actions.ts` | `createNotification()` | `@admin/notifications/_server/actions` | Plan 006 | **Deferred** — add `unwrap()` in Plan 006 |

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors in registry module files.

## Done When

- [ ] **Part A.0**: `termsService.getActiveOrThrow()` added
- [ ] **Part A.0**: All 5 service files refactored from action import to service import
- [ ] **Part A.0**: Retroactive `unwrap()` added to academic action callers of `getActiveTerm`
- [ ] All 18 action files import and use `createAction`
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified/updated
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] Intra-module cross-action calls wrapped with `unwrap()`; cross-module to later plans deferred
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Registry module fully migrated; all other modules still work**
