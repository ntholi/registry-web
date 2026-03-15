# Plan 004a: Registry — Wrap Action Files

> Wrap all 18 registry action files with `createAction` and handle cross-action calls within those files. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

Same as Plan 003 — ListLayout and Form already handle both formats. Unmigrated modules keep working. Wrapping actions only changes return types from `T` to `ActionResult<T>`, which all updated UI components already accept.

---

## Part A: Wrap Action Files (18 files)

Use the same migration template as Plan 003. Key rules:
- Wrap all actions with `createAction`
- **Keep positional params** — `findAll(page, search)` stays as-is
- `export const` for wrapped actions
- No manual `try/catch`
- Keep `revalidatePath` / `revalidateTag` calls inside the handler

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

// AFTER
'use server';

import { createAction } from '@/shared/lib/utils/actionResult';

export const createThing = createAction(
  async (data: Input) => thingService.create(data)
);

export const findAllThings = createAction(
  async (page: number, search: string) => thingService.findAll({ page, search })
);
```

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

- **`registry/students/_server/actions.ts`**: Likely the largest action file. May have complex multi-step actions — wrap the entire body in `createAction`.
- **Actions with `revalidatePath`**: Keep `revalidatePath` calls inside the `createAction` handler.

---

## Part B: Update Cross-Action Calls (2 call sites)

When an action in this module calls a wrapped action from another module, wrap with `unwrap()`.

### Migration Template

```ts
// BEFORE (inside createAction handler)
const term = await getActiveTerm();

// AFTER
const term = unwrap(await getActiveTerm());
```

### Cross-Action Calls in Registry Module

| # | File | Cross-action call | Import source |
|---|------|------------------|---------------|
| 1 | `students/_server/actions.ts` | `getUnpublishedTermCodes()` | `@/app/registry/terms/settings/_server/actions` |
| 2 | `terms/settings/_server/actions.ts` | `createNotification()` | `@admin/notifications/_server/actions` |

**Note**: Add `import { unwrap } from '@/shared/lib/utils/actionResult'` to each file and wrap each cross-action `await` call with `unwrap()`.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero new type errors in registry action files. RSC pages and ListLayout callers may show warnings (fixed in 004b). Other modules unchanged.

## Done When

- [ ] All 18 action files import and use `createAction`
- [ ] All cross-action calls wrapped with `unwrap()` (2 call sites)
- [ ] `pnpm tsc --noEmit` passes (or only has warnings in RSC pages/layouts fixed in 004b)
