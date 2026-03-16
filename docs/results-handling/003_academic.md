# Plan 003: Academic Module

> Migrate the entire `academic/` module end-to-end: wrap actions with `createAction`, update RSC pages with `unwrap()`, verify ListLayout callers. **Non-breaking** — all other modules continue working unchanged.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

- `ListLayout` (updated in Plan 002) already handles both `ActionResult<GetDataResult<T>>` and raw `GetDataResult<T>` — so academic layouts auto-work with the new return types
- `Form.tsx` already handles both `ActionResult<T>` and raw `T` — so academic forms auto-work
- Other modules are untouched and continue using old patterns

---

## Part A: Wrap Action Files (13 files)

### Migration Template

```ts
// BEFORE
'use server';

export async function createThing(data: Input) {
  return thingService.create(data);
}

export async function findAllThings(page: number, search: string) {
  return thingService.findAll({ page, search });
}

export async function getThing(id: number) {
  return thingService.get(id);
}

// AFTER
'use server';

import { createAction } from '@/shared/lib/actions/actionResult';

export const createThing = createAction(
  async (data: Input) => thingService.create(data)
);

export const findAllThings = createAction(
  async (page: number, search: string) => thingService.findAll({ page, search })
);

export const getThing = createAction(
  async (id: number) => thingService.get(id)
);
```

### Rules

1. **ALL** actions get wrapped — mutations, queries, GETs, everything
2. **Keep positional params as-is** — `findAll(page, search)` stays `(page, search)`, NOT `({page, search})`
3. Use `export const` (only exception to top-level `function` rule)
4. Keep `revalidatePath` / `revalidateTag` calls inside the handler
5. If the action already uses `success()` / `failure()` manually, replace with `createAction`
6. No manual `try/catch` — `createAction` handles all error catching

### Action Files

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/academic/lecturers/_server/actions.ts` | |
| 2 | `src/app/academic/semester-modules/_server/actions.ts` | |
| 3 | `src/app/academic/schools/_server/actions.ts` | |
| 4 | `src/app/academic/schools/structures/_server/actions.ts` | |
| 5 | `src/app/academic/modules/_server/actions.ts` | |
| 6 | `src/app/academic/assessments/_server/actions.ts` | |
| 7 | `src/app/academic/feedback/cycles/_server/actions.ts` | |
| 8 | `src/app/academic/feedback/categories/_server/actions.ts` | |
| 9 | `src/app/academic/feedback/questions/_server/actions.ts` | |
| 10 | `src/app/academic/feedback/reports/_server/actions.ts` | |
| 11 | `src/app/academic/attendance/_server/actions.ts` | |
| 12 | `src/app/academic/assessment-marks/_server/actions.ts` | |
| 13 | `src/app/academic/assigned-modules/_server/actions.ts` | |

---

## Part B: Update RSC Pages (~18 pages)

### Migration Template

```ts
// BEFORE
import { getThing } from '../_server/actions';

export default async function ThingPage({ params }: Props) {
  const { id } = await params;
  const thing = await getThing(Number(id));
  if (!thing) notFound();
  return <ThingDetails thing={thing} />;
}

// AFTER
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getThing } from '../_server/actions';

export default async function ThingPage({ params }: Props) {
  const { id } = await params;
  const thing = unwrap(await getThing(Number(id)));
  if (!thing) notFound();
  return <ThingDetails thing={thing} />;
}
```

### Rules

1. **Every** `await actionFn(...)` call in an RSC page gets wrapped: `unwrap(await actionFn(...))`
2. Keep `notFound()` checks after `unwrap()`
3. If a page calls multiple actions, wrap each one separately
4. Pages that only pass action references (e.g., `<Form action={updateThing}>`) do NOT need `unwrap` — only direct `await` calls
5. **List pages (`page.tsx` at feature root)**: Many render `{children}` only. Check if they actually call actions before modifying.

### RSC Pages

| # | File | Action calls to wrap |
|---|------|---------------------|
| 1 | `src/app/academic/modules/[id]/page.tsx` | `getModule(id)` |
| 2 | `src/app/academic/modules/[id]/edit/page.tsx` | `getModule(id)` |
| 3 | `src/app/academic/lecturers/[id]/page.tsx` | `getLecturer(id)` |
| 4 | `src/app/academic/semester-modules/[id]/page.tsx` | `getSemesterModule(id)` |
| 5 | `src/app/academic/semester-modules/[id]/edit/page.tsx` | `getSemesterModule(id)` |
| 6 | `src/app/academic/schools/structures/page.tsx` | Check for direct calls |
| 7 | `src/app/academic/assessments/[id]/page.tsx` | `getAssessment(id)` |
| 8 | `src/app/academic/assessments/[id]/edit/page.tsx` | `getAssessment(id)` |
| 9 | `src/app/academic/feedback/cycles/[id]/page.tsx` | `getCycle(id)` |
| 10 | `src/app/academic/feedback/cycles/[id]/edit/page.tsx` | `getCycle(id)` |
| 11 | `src/app/academic/attendance/page.tsx` | Check for direct calls |

*Note*: List pages (e.g., `modules/page.tsx`, `lecturers/page.tsx`) often only render `{children}` — verify before modifying. Only wrap actual `await actionFn()` calls.

---

## Part C: Verify ListLayout Callers

These layouts pass `getData={findAllAction}` directly. Since `findAllAction` now returns `ActionResult<GetDataResult<T>>` instead of `GetDataResult<T>`, and ListLayout (updated in Plan 002) handles both formats, these should **auto-work** without any changes.

**Verify only** — no code changes expected:

| # | File |
|---|------|
| 1 | `src/app/academic/semester-modules/layout.tsx` |
| 2 | `src/app/academic/modules/layout.tsx` |
| 3 | `src/app/academic/lecturers/layout.tsx` |
| 4 | `src/app/academic/schools/layout.tsx` |
| 5 | `src/app/academic/feedback/cycles/layout.tsx` |
| 6 | `src/app/academic/feedback/questions/layout.tsx` |
| 7 | `src/app/academic/assessments/layout.tsx` (may use internal function — update if needed) |

---

## Part D: Update Direct `useMutation` Callers

Client components in the academic module that use `useMutation({ mutationFn: someAction })` directly (not through `Form` or `DeleteButton`) must switch to `useActionMutation` to handle the new `ActionResult<T>` return type.

### Migration Template

```ts
// BEFORE
import { useMutation } from '@tanstack/react-query';
import { updateThing } from '../_server/actions';

const mutation = useMutation({
  mutationFn: updateThing,
  onSuccess: (data) => { /* data was T */ },
  onError: (error) => { /* fired on throws */ },
});

// AFTER
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { updateThing } from '../_server/actions';

const mutation = useActionMutation(updateThing, {
  onSuccess: (data) => { /* data is T (unwrapped) */ },
  onError: (error) => { /* fires on ActionResult failure */ },
});
```

### Discovery

Search all `_components/` folders in `src/app/academic/` for:
- `useMutation({ mutationFn:` patterns where the `mutationFn` references a wrapped action
- Replace with `useActionMutation` import and call

Known candidates (verify at implementation time):
- `src/app/academic/feedback/questions/_components/` (EditQuestionModal, QuestionsList)
- `src/app/academic/gradebook/_components/` (MarksInput)
- `src/app/academic/assessments/_components/`
- `src/app/academic/attendance/_components/`

---

## Part E: Update Cross-Action Calls

When an action in this module calls a wrapped action from another module (or within this module), it must use `unwrap()` to extract the data. `unwrap` throws `UserFacingError`, so the outer `createAction` preserves the error message through `extractError`.

### Ordering Rule

`unwrap()` can only be added for actions that are **already wrapped** with `createAction`. Cross-action calls to actions in **later** plans stay as raw `await` calls — the target module's plan adds `unwrap()` retroactively when it wraps those actions. TypeScript enforces this: `unwrap(rawValue)` would be a type error.

### Migration Template

```ts
// BEFORE (inside createAction handler)
const term = await getActiveTerm();

// AFTER (only after getActiveTerm is wrapped in Plan 004)
const term = unwrap(await getActiveTerm());
```

### Cross-Action Calls in Academic Module

| # | File | Cross-action call | Import source | Wrapped in | Action |
|---|------|------------------|---------------|------------|--------|
| 1 | `assessments/_server/actions.ts` | `getActiveTerm()` ×2 | `@/app/registry/terms` | Plan 004 | **Deferred** — add `unwrap()` in Plan 004 |
| 2 | `assigned-modules/_server/actions.ts` | `getActiveTerm()` ×3 | `@/app/registry/terms` | Plan 004 | **Deferred** — add `unwrap()` in Plan 004 |
| 3 | `assessment-marks/_server/actions.ts` | `getActiveTerm()` | `@/app/registry/terms` | Plan 004 | **Deferred** — add `unwrap()` in Plan 004 |
| 4 | `assessment-marks/_server/actions.ts` | `updateGradeByStudentModuleId()` | `@academic/semester-modules` | Plan 003 (this plan) | Add `unwrap()` now |
| 5 | `feedback/cycles/_server/actions.ts` | `getAllTerms()` | `@registry/terms/_server/actions` | Plan 004 | **Deferred** — add `unwrap()` in Plan 004 |
| 6 | `feedback/cycles/_server/actions.ts` | `getAllSchools()` | `@academic/schools/_server/actions` | Plan 003 (this plan) | Add `unwrap()` now |
| 7 | `feedback/cycles/_server/actions.ts` | `getUserSchools(userId)` | `@admin/users/_server/actions` | Plan 006 | **Deferred** — add `unwrap()` in Plan 006 |

### Service Files Importing Actions (ARCHITECTURE FIX)

These service files import `getActiveTerm` (an action) in violation of the data flow rule. They must be refactored to use `termsService` directly **before** `getActiveTerm` is wrapped in Plan 004. This is tracked in Plan 004 Part A.0, but listed here for awareness:

| # | File | Current import | Fix |
|---|------|---------------|-----|
| 1 | `attendance/_server/service.ts` | `getActiveTerm` from `@/app/registry/terms` | Use `termsService.getActiveOrThrow()` |
| 2 | `assigned-modules/_server/service.ts` | `getActiveTerm` from `@/app/registry/terms` | Use `termsService.getActiveOrThrow()` |

**Note**: These are fixed in Plan 004 Part A.0, not in this plan.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors in academic module files. Other modules unchanged and passing.

## Done When

- [ ] All 13 action files import and use `createAction`
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified working
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] Intra-module cross-action calls (#4, #6) wrapped with `unwrap()`
- [ ] Cross-module calls to unmigrated actions (#1–3, #5, #7) left as raw `await` — deferred to target plans
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Academic module fully migrated; all other modules still work**
