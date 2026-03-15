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
| ListLayout getData | Keeps positional `(page, search)` during migration, adds ActionResult unwrapping on return value |
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

**Why this works safely**: `unwrap` throws `UserFacingError` (not plain `Error`), so when an inner action fails, the message propagates correctly through the outer `createAction`'s `extractError` chain. The error gets logged at each layer, and the user-facing message is preserved.

**Key cross-action hotspots** (handled in their respective module plans):
- `getActiveTerm()` — called from 5+ action files across academic/LMS
- `apply/` wizard — 30+ calls into admissions actions
- LMS → academic (`createAssessment`, `linkCourseToAssignment`)
- Reports → finance (`getAllSponsors`)
- Admissions documents → applicants, academic-records, subjects

Each module plan (003–008) includes a **Part E** listing the cross-action calls within that module.

## Non-Breaking Incremental Strategy

**After completing any single plan, the app must compile and run.** This is achieved by:

1. **Backward compatibility in shared types**: `ActionResult.error` uses `AppError | string` union during transition. `getActionErrorMessage()` handles both formats. `failure()` accepts both.
2. **UI components accept both old and new response formats**: `Form`, `DeleteButton`, `ListLayout` handle both raw `T` and `ActionResult<T>` return values, and both `string` and `AppError` error fields.
3. **`useActionMutation` hook**: Unwraps `ActionResult<T>` for ~150+ client components that use `useMutation` directly. Provides `T` to `onSuccess` and throws for `onError`, preserving existing component patterns.
4. **ListLayout keeps positional params**: `getData(page, search)` signature stays unchanged during migration. Only the return value gets ActionResult unwrapping. This avoids breaking all 44 layout callers.
5. **Per-module vertical slices**: Plans 003–008 each migrate one module group **end-to-end** — wrapping actions, updating RSC pages, verifying ListLayout callers, and updating direct `useMutation` clients together. Unmigrated modules continue working with the old pattern.
6. **Cleanup at the end**: Plan 009 removes the `string` compat from `ActionResult.error`, and optionally switches to object params.

## Reference Document

Full architecture details, code snippets, type definitions, and rationale:
→ [error-handling-plan.md](./error-handling-plan.md)

## Plan Files

| # | File | Scope | Status |
|---|------|-------|--------|
| 1 | [001_shared_infrastructure.md](./001_shared_infrastructure.md) | `extractError.ts`, `actionResult.ts`, `UserFacingError` — backward-compatible | ✅ Completed |
| 2 | [002_ui_components.md](./002_ui_components.md) | `StatusPage`, `error.tsx`, `global-error.tsx`, `useActionMutation`, `Form`, `DeleteButton`, `DetailsViewHeader`, `ListLayout` — dual-format support | ✅ Completed |
| 3 | [003_academic.md](./003_academic.md) | Academic module: 13 actions + ~18 RSC pages + layouts + client components | ✅ Completed |
| 4a | [004a_registry_actions.md](./004a_registry_actions.md) | Registry: wrap 18 action files + 2 cross-action calls | ✅ Completed |
| 4b | [004b_registry_pages_layouts.md](./004b_registry_pages_layouts.md) | Registry: ~14 RSC pages + ~12 ListLayout callers | ✅ Completed |
| 4c | [004c_registry_client_components.md](./004c_registry_client_components.md) | Registry: direct `useMutation` → `useActionMutation` | ✅ Completed |
| 5a | [005a_admissions_actions.md](./005a_admissions_actions.md) | Admissions: wrap 17 action files | ✅ Completed |
| 5b | [005b_admissions_pages_layouts.md](./005b_admissions_pages_layouts.md) | Admissions: ~10 RSC pages + ~8 ListLayout callers + 10 cross-action calls | ✅ Completed |
| 5c | [005c_admissions_client_components.md](./005c_admissions_client_components.md) | Admissions: direct `useMutation` → `useActionMutation` | ✅ Completed |
| 6a | [006a_admin_finance_actions.md](./006a_admin_finance_actions.md) | Admin + Finance + Auth + HR: wrap 10 action files + cross-action calls | ⬜ Not started |
| 6b | [006b_admin_finance_pages_clients.md](./006b_admin_finance_pages_clients.md) | Admin + Finance + Auth + HR: ~13 RSC pages + ~8 ListLayout callers + `useMutation` callers | ⬜ Not started |
| 7a | [007a_lms_library_timetable_actions.md](./007a_lms_library_timetable_actions.md) | LMS + Library + Timetable: wrap 26 action files + 9 cross-action calls | ⬜ Not started |
| 7b | [007b_lms_library_timetable_pages.md](./007b_lms_library_timetable_pages.md) | LMS + Library + Timetable: ~19 RSC pages + ~11 ListLayout callers | ⬜ Not started |
| 7c | [007c_lms_library_timetable_clients.md](./007c_lms_library_timetable_clients.md) | LMS + Library + Timetable: ~40 `useMutation` → `useActionMutation` (LMS-heavy) | ⬜ Not started |
| 8a | [008a_apply_migration.md](./008a_apply_migration.md) | Apply: special migration (6 files manual → `createAction`) + delete `errors.ts` | ⬜ Not started |
| 8b | [008b_remaining_actions_pages.md](./008b_remaining_actions_pages.md) | Reports + Student Portal + Audit Logs + Feedback: 11 actions + RSC pages + ListLayout | ⬜ Not started |
| 8c | [008c_cross_actions_clients.md](./008c_cross_actions_clients.md) | Apply/Reports: ~24 cross-action calls + `useMutation` callers | ⬜ Not started |
| 9a | [009a_type_tightening.md](./009a_type_tightening.md) | Tighten `ActionResult.error` → `AppError` only + remove compat code | ⬜ Not started |
| 9b | [009b_listlayout_object_params.md](./009b_listlayout_object_params.md) | (Optional) Switch ListLayout to `({ page, search })` object params | ⬜ Not started |
| 10 | [010_verification.md](./010_verification.md) | Full verification, type-check, lint, manual testing checklist | ⬜ Not started |

## Execution Order

Plans **must** be executed in numerical order. Within each module group (e.g., 004a → 004b → 004c), subtasks must be completed sequentially. The subtask breakdown allows progress tracking at a finer granularity.

1. **001** creates shared types and utilities — **non-breaking** (new files, backward-compatible types)
2. **002** updates UI components to accept both old and new formats — **non-breaking** (existing callers still work)
3. **003** migrates the academic module end-to-end — **non-breaking**
4. **004a → 004b → 004c** migrates the registry module in three steps: actions → pages/layouts → client components
5. **005a → 005b → 005c** migrates the admissions module in three steps
6. **006a → 006b** migrates admin/finance/auth/HR in two steps
7. **007a → 007b → 007c** migrates LMS/library/timetable in three steps (largest client component migration)
8. **008a → 008b → 008c** migrates apply (special) + remaining modules in three steps (largest cross-action migration)
9. **009a → 009b** removes backward compat + optional object params — **requires all modules migrated first**
10. **010** runs full verification

### Why this order is safe

| After completing | App state |
|---|---|
| 001 | ✅ New shared files added. No consumers changed. All existing code works. |
| 002 | ✅ UI components handle both formats. Old actions still return raw data → components handle it. New ActionResult → components handle it too. |
| 003 | ✅ Academic module fully migrated. All other modules unchanged and working. |
| 004a | ✅ Registry action files wrapped. Return types changed to `ActionResult<T>`. |
| 004b | ✅ Registry RSC pages + ListLayout callers updated. |
| 004c | ✅ Registry client components migrated. **Registry module fully complete.** |
| 005a | ✅ Admissions action files wrapped. |
| 005b | ✅ Admissions RSC pages + ListLayout + cross-action calls updated. |
| 005c | ✅ Admissions client components migrated. **Admissions module fully complete.** |
| 006a | ✅ Admin/Finance/Auth/HR action files wrapped. |
| 006b | ✅ Admin/Finance/Auth/HR pages + clients migrated. **Module group fully complete.** |
| 007a | ✅ LMS/Library/Timetable action files wrapped. |
| 007b | ✅ LMS/Library/Timetable RSC pages + ListLayout callers updated. |
| 007c | ✅ LMS/Library/Timetable client components migrated. **Module group fully complete.** |
| 008a | ✅ Apply module converted from manual pattern to `createAction`. `errors.ts` deleted. |
| 008b | ✅ Reports/Portal/AuditLogs/Feedback actions + pages migrated. |
| 008c | ✅ All cross-action calls wrapped + `useMutation` callers migrated. **All modules complete.** |
| 009a | ✅ Types tightened. `AppError \| string` → `AppError` only. Compat code removed. |
| 009b | ✅ (Optional) ListLayout object params. Types fully strict. |
| 010 | ✅ Full verification pass. **The entire migration is complete.** |

## Progress Tracking

Update status in the table above as each plan completes:
- ⬜ Not started
- 🔄 In progress
- ✅ Completed
