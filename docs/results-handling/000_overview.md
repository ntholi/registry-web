# Error & Result Handling Migration — Overview

> Standardize all server actions to return `ActionResult<T>` — no thrown errors leak to the UI, ever.

## Goal

Replace the inconsistent mix of direct throws, pass-throughs, and partial `ActionResult` usage across **96 action files**, **150+ RSC pages**, and **44 ListLayout callers** with a single, unified error handling pattern.

## Core Pattern

```
DB → Repository (throws) → Service (throws / UserFacingError) → Action (createAction → ActionResult<T>) → Client/RSC
```

- **Every** server action wraps its logic with `createAction(fn)`, returning `ActionResult<T>`
- Client components (`Form`, `DeleteButton`, `ListLayout`) read `.success` / `.error` from the result
- RSC pages use `unwrap(await action(input))` to extract data, with `error.tsx` as safety net
- `extractError()` normalizes PostgreSQL, Moodle, network, rate limit, file, and storage errors into safe `AppError` messages
- `UserFacingError` is the only way custom service messages reach the UI
- `useActionMutation` hook unwraps `ActionResult<T>` for direct `useMutation` callers (~150+ components)

## Key Decisions

| Decision | Choice |
|----------|--------|
| Action wrapper | `createAction(fn)` — variadic, type-safe, server-logged |
| Error type | `AppError` with `message`, optional `code` |
| Next.js sentinels | `createAction` re-throws `redirect`, `notFound`, `unauthorized`, `forbidden` via `isNextNavigationError` — never swallows them |
| RSC unwrap | `unwrap(result)` throws `UserFacingError` for `error.tsx` to catch |
| Cross-action calls | Callers use `unwrap()` — `UserFacingError` preserves messages through `extractError` chains |
| ListLayout getData | Keeps positional `(page, search)` throughout the migration. |
| Error boundaries | Root `error.tsx` + mandatory `global-error.tsx` |
| Client mutations | `useActionMutation` hook unwraps `ActionResult` for `useMutation` callers |
| Top-level export style | `export const` for `createAction`-wrapped actions (only exception) |
| Transition error type | `ActionResult.error` is `AppError \| string` union during migration (cleaned up in 009) |

## Cross-Action Calls (CRITICAL)

40+ action files call other modules' actions (e.g., `getActiveTerm()`, `createAssessment()`, `getApplicant()`). Once those are wrapped with `createAction`, they return `ActionResult<T>` instead of `T`.

**Strategy**: Callers use `unwrap()` to extract the data:

```ts
// BEFORE
const term = await getActiveTerm();

// AFTER
const term = unwrap(await getActiveTerm());
```

**Why this works safely**: `unwrap` throws `UserFacingError` (not plain `Error`), so when an inner action fails, the message propagates correctly through the outer `createAction`'s `extractError` chain. The error gets logged at each layer (inner as `error`, outer as `warn` for `UserFacingError`), and the user-facing message is preserved. This double-logging is intentional — each layer has its own audit trail with distinguishable severity.

**Key cross-action hotspots** (handled in their respective module plans):
- `getActiveTerm()` — called from 5+ action files across academic/LMS
- `apply/` wizard — 30+ calls into admissions actions
- LMS → academic (`createAssessment`, `linkCourseToAssignment`)
- Reports → finance (`getAllSponsors`)
- Admissions documents → applicants, academic-records, subjects

Each module plan (003–008) includes a **Part E** listing the cross-action calls within that module.

## Service-Level Action Imports (ARCHITECTURE FIX)

**Problem**: Several **service files** import action functions (e.g., `getActiveTerm` from `@/app/registry/terms`). This violates the data flow rule (UI → Actions → Services → Repositories — services must NOT call actions). When these actions are wrapped with `createAction`, their return type changes from `T` to `ActionResult<T>`, breaking all service callers.

**Affected pattern** (5 service files import `getActiveTerm`):
```ts
// WRONG — service importing an action
import { getActiveTerm } from '@/app/registry/terms';
const term = await getActiveTerm(); // returns Term today, ActionResult<Term> after wrapping
```

**Fix**: Each module plan that wraps a heavily-imported action must also:
1. Ensure the service layer exposes the core logic (e.g., `termsService.getActiveOrThrow()`)
2. Update all **service-level callers** to import from the service directly
3. Only then wrap the action with `createAction`

```ts
// CORRECT — service importing a service
import { termsService } from '@registry/terms/_server/service';
const term = await termsService.getActiveOrThrow();
```

**Known service-level action imports** (fixed in their respective module plans):
- `getActiveTerm()` → 5 service files (fixed in Plan 004, Part A.0)
- Verify others at implementation time per module

## Non-Breaking Incremental Strategy

**After completing any single plan, the app must compile and run.** This is achieved by:

1. **Backward compatibility in shared types**: `ActionResult.error` uses `AppError | string` union during transition. `getActionErrorMessage()` handles both formats. `failure()` accepts both.
2. **UI components accept both old and new response formats**: `Form`, `DeleteButton`, `ListLayout` handle both raw `T` and `ActionResult<T>` return values, and both `string` and `AppError` error fields.
3. **`useActionMutation` hook**: Unwraps `ActionResult<T>` for ~150+ client components that use `useMutation` directly. Provides `T` to `onSuccess` and throws for `onError`, preserving existing component patterns.
4. **ListLayout keeps positional params**: `getData(page, search)` signature stays unchanged during migration. Only the return value gets ActionResult unwrapping. This avoids breaking all 44 layout callers.
5. **Per-module vertical slices**: Plans 003–008 each migrate one module group **end-to-end** — wrapping actions, updating RSC pages, verifying ListLayout callers, and updating direct `useMutation` clients together. Unmigrated modules continue working with the old pattern.
6. **Cross-module Part E ordering**: A module's Part E (cross-action `unwrap()` calls) can only add `unwrap()` for actions that are **already wrapped** in a prior plan. Cross-action calls to actions in **later** plans are deferred — they stay as raw `await` calls until the target module is migrated, then that plan adds `unwrap()` retroactively. TypeScript enforces this: `unwrap()` on a non-`ActionResult` value is a type error.
7. **Service-level callers fixed first**: Before wrapping an action that services also import (e.g., `getActiveTerm`), the service callers are refactored to use the service layer directly. This prevents breaking service files.
8. **Cleanup at the end**: Plan 009 removes the `string` compat from `ActionResult.error`.

## Reference Document

Full architecture details, code snippets, type definitions, and rationale:
→ [error-handling-plan.md](./error-handling-plan.md)

## Plan Files

| # | File | Scope | Status |
|---|------|-------|--------|
| 1 | [001_shared_infrastructure.md](./001_shared_infrastructure.md) | `extractError.ts`, `actionResult.ts`, `UserFacingError` — backward-compatible | ✅ Completed |
| 2 | [002_ui_components.md](./002_ui_components.md) | `StatusPage`, `error.tsx`, `global-error.tsx`, `useActionMutation`, `Form`, `DeleteButton`, `DetailsViewHeader`, `ListLayout` — dual-format support | ✅ Completed |
| 3 | [003_academic.md](./003_academic.md) | Academic module: 13 actions + ~18 RSC pages + layouts | 🔄 In progress |
| 4 | [004_registry.md](./004_registry.md) | Registry module: 18 actions + ~24 RSC pages + layouts | ⬜ Not started |
| 5 | [005_admissions.md](./005_admissions.md) | Admissions module: 17 actions + ~16 RSC pages + layouts | ⬜ Not started |
| 6 | [006_admin_finance.md](./006_admin_finance.md) | Admin + Finance + Auth + HR: 10 actions + ~19 RSC pages + layouts | ⬜ Not started |
| 7 | [007_lms_library_timetable.md](./007_lms_library_timetable.md) | LMS + Library + Timetable: 26 actions + ~34 RSC pages + layouts | ⬜ Not started |
| 8 | [008_remaining.md](./008_remaining.md) | Apply + Reports + Student Portal + Audit-Logs + Feedback: 17 actions + ~15 RSC pages + layouts | ⬜ Not started |
| 9 | [009_cleanup.md](./009_cleanup.md) | Remove backward compat: `error` → `AppError` only | ⬜ Not started |
| 10 | [010_verification.md](./010_verification.md) | Full verification, type-check, lint, manual testing checklist | ⬜ Not started |

## Execution Order

Plans **must** be executed in numerical order:

1. **001** creates shared types and utilities — **non-breaking** (new files, backward-compatible types)
2. **002** updates UI components to accept both old and new formats — **non-breaking** (existing callers still work)
3. **003–008** each migrate one module group end-to-end (actions + RSC pages + layouts) — **non-breaking** (unmigrated modules keep working with old pattern)
4. **009** removes backward compat, tightens types — **requires all modules migrated first**
5. **010** runs full verification

### Why this order is safe

| After completing | App state |
|---|---|
| 001 | ✅ New shared files added. No consumers changed. All existing code works. |
| 002 | ✅ UI components handle both formats. Old actions still return raw data → components handle it. New ActionResult → components handle it too. |
| 003 | ✅ Academic module fully migrated. All other modules unchanged and working. |
| 004 | ✅ Academic + Registry migrated. Others unchanged. |
| 005 | ✅ + Admissions migrated. |
| 006 | ✅ + Admin/Finance/Auth/HR migrated. |
| 007 | ✅ + LMS/Library/Timetable migrated. |
| 008 | ✅ All modules migrated. Backward compat still in place. |
| 009 | ✅ Compat removed. Types fully strict. |
| 010 | ✅ Full verification pass. |

## Progress Tracking

Update status in the table above as each plan completes:
- ⬜ Not started
- 🔄 In progress
- ✅ Completed
