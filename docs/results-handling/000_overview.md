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

## Key Decisions

| Decision | Choice |
|----------|--------|
| Action wrapper | `createAction(fn)` — variadic, type-safe, server-logged |
| Error type | `AppError` with `message`, `code`, optional `fieldErrors` |
| RSC unwrap | `unwrap(result)` throws for `error.tsx` to catch |
| ListLayout getData | Keeps positional `(page, search)` during migration, adds ActionResult unwrapping on return value |
| Error boundaries | Root `error.tsx` + mandatory `global-error.tsx` |
| QueryClient | Global `mutations.onError` fallback toast |
| Top-level export style | `export const` for `createAction`-wrapped actions (only exception) |
| Transition error type | `ActionResult.error` is `AppError \| string` union during migration (cleaned up in 009) |

## Non-Breaking Incremental Strategy

**After completing any single plan, the app must compile and run.** This is achieved by:

1. **Backward compatibility in shared types**: `ActionResult.error` uses `AppError | string` union during transition. `getActionErrorMessage()` handles both formats. `failure()` accepts both.
2. **UI components accept both old and new response formats**: `Form`, `DeleteButton`, `ListLayout` handle both raw `T` and `ActionResult<T>` return values, and both `string` and `AppError` error fields.
3. **ListLayout keeps positional params**: `getData(page, search)` signature stays unchanged during migration. Only the return value gets ActionResult unwrapping. This avoids breaking all 44 layout callers.
4. **Per-module vertical slices**: Plans 003–008 each migrate one module group **end-to-end** — wrapping actions, updating RSC pages, and verifying ListLayout callers together. Unmigrated modules continue working with the old pattern.
5. **Cleanup at the end**: Plan 009 removes the `string` compat from `ActionResult.error`, and optionally switches to object params.

## Reference Document

Full architecture details, code snippets, type definitions, and rationale:
→ [error-handling-plan.md](./error-handling-plan.md)

## Plan Files

| # | File | Scope | Status |
|---|------|-------|--------|
| 1 | [001_shared_infrastructure.md](./001_shared_infrastructure.md) | `extractError.ts`, `actionResult.ts`, `UserFacingError` — backward-compatible | ⬜ Not started |
| 2 | [002_ui_components.md](./002_ui_components.md) | `StatusPage`, `error.tsx`, `global-error.tsx`, `QueryClient`, `Form`, `DeleteButton`, `DetailsViewHeader`, `ListLayout` — dual-format support | ⬜ Not started |
| 3 | [003_academic.md](./003_academic.md) | Academic module: 13 actions + ~18 RSC pages + layouts | ⬜ Not started |
| 4 | [004_registry.md](./004_registry.md) | Registry module: 18 actions + ~24 RSC pages + layouts | ⬜ Not started |
| 5 | [005_admissions.md](./005_admissions.md) | Admissions module: 17 actions + ~16 RSC pages + layouts | ⬜ Not started |
| 6 | [006_admin_finance.md](./006_admin_finance.md) | Admin + Finance + Auth + HR: 10 actions + ~19 RSC pages + layouts | ⬜ Not started |
| 7 | [007_lms_library_timetable.md](./007_lms_library_timetable.md) | LMS + Library + Timetable: 26 actions + ~34 RSC pages + layouts | ⬜ Not started |
| 8 | [008_remaining.md](./008_remaining.md) | Apply + Reports + Student Portal + Audit-Logs + Feedback: 17 actions + ~15 RSC pages + layouts | ⬜ Not started |
| 9 | [009_cleanup.md](./009_cleanup.md) | Remove backward compat: `error` → `AppError` only, optional object params for ListLayout | ⬜ Not started |
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
