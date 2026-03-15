# Plan 004b: Registry — RSC Pages + ListLayout Callers

> Update all registry RSC pages with `unwrap()` and verify/update ListLayout callers. **Non-breaking**.

## Prerequisites

- Plan 004a completed (all 18 registry action files wrapped with `createAction`)

---

## Part A: Update RSC Pages (~24 pages)

Wrap all direct `await actionFn()` calls with `unwrap()`.

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
import { unwrap } from '@/shared/lib/utils/actionResult';
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

## Part B: Verify/Update ListLayout Callers (~12 files)

### Direct References — Verify Only

These pass `getData={findAllAction}` directly. Since `findAllAction` now returns `ActionResult<GetDataResult<T>>` instead of `GetDataResult<T>`, and ListLayout (updated in Plan 002) handles both formats, these should **auto-work** without any changes.

| # | File |
|---|------|
| 1 | `src/app/registry/terms/layout.tsx` |
| 2 | `src/app/registry/students/layout.tsx` |
| 3 | `src/app/registry/student-statuses/layout.tsx` |
| 4 | `src/app/registry/certificates/layout.tsx` |
| 5 | `src/app/registry/certificate-reprints/layout.tsx` |
| 6 | `src/app/registry/graduation/dates/layout.tsx` |
| 7 | `src/app/registry/graduation/requests/layout.tsx` |

### Arrow Function Wrappers — Must Verify & Update If Needed

These wrap `getData` with arrow functions. Since the underlying action's return type changed (now `ActionResult`), the arrow wrapper's return type also changes. ListLayout handles both formats, so these should still work. But verify and update the arrow function if it does any transformation on the result (e.g., destructuring `items`, `totalPages`):

| # | File | Notes |
|---|------|-------|
| 8 | `src/app/registry/student-notes/layout.tsx` | Arrow wrapper |
| 9 | `src/app/registry/blocked-students/layout.tsx` | May have inline filtering |
| 10 | `src/app/registry/registration/requests/layout.tsx` | Status filtering |
| 11 | `src/app/registry/registration/clearance/layout.tsx` | Complex multi-step logic |
| 12 | `src/app/registry/graduation/clearance/layout.tsx` | Complex multi-step logic |

**For layouts with complex logic**: If the layout unwraps the action result manually (e.g., destructures `items`, `totalPages`), it needs updating to handle `ActionResult`. Use `isActionResult` + `unwrap` pattern or let ListLayout handle it by passing the raw result through.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors in registry RSC pages and layouts.

## Done When

- [x] All RSC pages with direct `await` calls use `unwrap()`
- [x] All 7 direct ListLayout callers verified working
- [x] All 5 arrow-wrapper ListLayout callers verified/updated
- [x] Component type derivations updated from `Awaited<ReturnType<typeof action>>` to `ActionData<typeof action>`
- [x] `pnpm tsc --noEmit` passes for 004b scope (pre-existing 004a errors remain in client components, handled by 004c)
