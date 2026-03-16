# Plan 004: Registry Module

> Wrap **mutation** actions with `createAction`. Query actions stay as plain functions. RSC pages and ListLayout callers require **no changes**. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

Same as Plan 003 — only mutations are wrapped. Queries/pages/layouts untouched. Unmigrated modules keep working.

---

## Part A.0: Fix Service-Level Action Imports (ARCHITECTURE FIX)

`getActiveTerm` is a query and stays as a plain function, so its return type does NOT change. Service callers won't break from wrapping. However, the architecture violation (services importing actions) should still be fixed.

### Step 1: Add `getActiveOrThrow()` to `termsService`

Add a helper to `src/app/registry/terms/_server/service.ts`:

```ts
import { UserFacingError } from '@/shared/lib/actions/extractError';

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

**Note**: No retroactive `unwrap()` needed for academic callers of `getActiveTerm` — it's a query and stays raw.

---

## Part A: Wrap Mutation Actions Only (18 action files)

Use the same mutations-only template as Plan 003. Key rules:
- Only mutations get wrapped with `createAction`
- Queries stay as plain `async function` exports
- `export const` for wrapped mutations
- No manual `try/catch`

### Action Files

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/registry/terms/_server/actions.ts` | `getActiveTerm` stays raw (query) |
| 2 | `src/app/registry/terms/settings/_server/actions.ts` | |
| 3 | `src/app/registry/students/_server/actions.ts` | Large file — many queries stay raw |
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

---

## Part B: RSC Pages — No Changes Needed

Since query actions stay as plain functions, all RSC pages continue calling them with plain `await`. **No `unwrap()` needed.**

---

## Part C: ListLayout Callers — No Changes Needed

Since `findAll*` actions stay as plain functions returning raw data, all ListLayout callers continue working as-is. **No changes needed.**

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

## Part E: Cross-Action Calls (Minimal)

Under the mutations-only strategy, most cross-action calls are queries and need no changes.

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 1 | `students/_server/actions.ts` | `getUnpublishedTermCodes()` | No (query) | No change needed |
| 2 | `terms/settings/_server/actions.ts` | `createNotification()` | **Yes (mutation)** | Add `unwrap()` when Plan 006 wraps it |

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors in registry module files.

## Done When

- [x] **Part A.0**: `termsService.getActiveOrThrow()` added
- [x] **Part A.0**: All 5 service files refactored from action import to service import
- [x] All mutation actions across 18 files wrapped with `createAction`
- [x] All query actions remain as plain `async function` exports
- [x] All direct `useMutation` callers switched to `useActionMutation`
- [x] `pnpm tsc --noEmit` passes
- [x] **Registry module mutations wrapped; queries/pages/layouts untouched**
- [x] All direct `useMutation` callers switched to `useActionMutation`
- [x] Intra-module cross-action calls wrapped with `unwrap()`; cross-module to later plans deferred
- [x] `pnpm tsc --noEmit` passes
- [x] **Registry module fully migrated; all other modules still work**
