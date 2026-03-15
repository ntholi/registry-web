# Plan 009b: (Optional) ListLayout Object Params

> Switch ListLayout `getData` from positional `(page, search)` to object `({ page, search })` params and update all callers. This is a **cosmetic improvement** — the app works fine without it. **Requires Plan 009a completed.**

## Prerequisites

- Plan 009a completed (types tightened, compat removed)

---

## Task 1: Update ListLayout `getData` signature

**File**: `src/shared/ui/adease/ListLayout.tsx`

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

---

## Task 2: Update ListLayout `queryFn`

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

---

## Task 3: Update all `findAll` actions to object params

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

---

## Task 4: Update ListLayout callers

**Direct references** (`getData={findAllAction}`) — auto-work if action params match.

**Arrow wrappers** — update from positional to object:
```tsx
// BEFORE
getData={(page, search) => findAllThings(page, search, extra)}

// AFTER
getData={({ page, search }) => findAllThings({ page, search, extra })}
```

### Files to update (arrow wrappers / internal functions):

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

## Verification

```bash
pnpm tsc --noEmit && pnpm lint:fix
```

## Done When

- [ ] `ListLayout.getData` uses `({ page, search })` object params
- [ ] All `findAll` actions use object params
- [ ] All 14 arrow-wrapper/internal-function layouts updated
- [ ] All direct-reference layouts verified auto-working
- [ ] `pnpm tsc --noEmit` passes — zero errors
