# Error & Result Handling Migration — Overview

> Standardize **mutation** actions to return `ActionResult<T>`. Query actions stay as plain functions.

## Goal

Replace the inconsistent mix of direct throws, pass-throughs, and partial `ActionResult` usage with a targeted error handling pattern — wrapping **only mutations** (create/update/delete) with `createAction`, while leaving **queries** (get/findAll) as plain functions.

## Core Principle: Mutations Only

Actions are split into two categories:

| Category | Examples | Wrapped? | Returns |
|----------|----------|----------|--------|
| **Queries** | `get*`, `find*`, `getAll*`, `search*` | No | Raw `T` (throws on error) |
| **Mutations** | `create*`, `update*`, `delete*`, `add*`, `remove*` | Yes | `ActionResult<T>` |

**Why not wrap queries?** RSC pages run on the server — if a query throws, `error.tsx` catches it. ListLayout uses TanStack Query which handles thrown errors via `isError`. Wrapping queries only to `unwrap()` them in every RSC page is a round-trip to nowhere that produces ~350+ `unwrap()` calls scattered across the codebase.

## Core Pattern

```
DB → Repository (throws) → Service (throws / UserFacingError) → Mutation Action (createAction → ActionResult<T>) → Client
DB → Repository (throws) → Service (throws / UserFacingError) → Query Action (plain fn → T) → RSC/Client
```

- **Mutation** actions wrap with `createAction(fn)`, returning `ActionResult<T>`
- **Query** actions stay as plain `async function` exports, returning raw `T`
- Client components (`Form`, `DeleteButton`) read `.success` / `.error` from mutation results
- RSC pages call query actions directly — no `unwrap()` needed
- ListLayout calls `getData` (a query) — TanStack Query handles errors natively
- `extractError()` normalizes PostgreSQL, Moodle, network, rate limit, file, and storage errors into safe `AppError` messages
- `UserFacingError` is the only way custom service messages reach the UI
- `useActionMutation` hook unwraps `ActionResult<T>` for direct `useMutation` callers of mutation actions

## Key Decisions

| Decision | Choice |
|----------|--------|
| Wrapping scope | **Mutations only** — queries stay as plain functions |
| Action wrapper | `createAction(fn)` — variadic, type-safe, server-logged |
| Error type | `AppError` with `message`, optional `code` |
| Next.js sentinels | `createAction` re-throws `redirect`, `notFound`, `unauthorized`, `forbidden` via `isNextNavigationError` — never swallows them |
| RSC pages | Call query actions directly — no `unwrap()` needed. `error.tsx` catches thrown errors. |
| Cross-action calls | Query→query: plain `await`. Mutation→query: plain `await`. Mutation→mutation: `unwrap()` (rare, ~5-10 cases). |
| ListLayout getData | Queries keep positional `(page, search)` and return raw data. TanStack Query handles errors. |
| Error boundaries | Root `error.tsx` + mandatory `global-error.tsx` |
| Client mutations | `useActionMutation` hook unwraps `ActionResult` for `useMutation` callers |
| Top-level export style | `export const` for `createAction`-wrapped mutations (only exception) |
| Transition error type | `ActionResult.error` is `AppError \| string` union during migration (cleaned up in 009) |

## Cross-Action Calls

Since queries stay as plain functions, the vast majority of cross-action calls require **no changes**:

| Caller | Callee | `unwrap()` needed? |
|--------|--------|--------------------|
| Query action | Query action | No — both return raw `T` |
| Mutation action | Query action | No — query returns raw `T`, mutation's `createAction` catches any thrown error |
| Query action | Mutation action | Rare — use `unwrap()` |
| Mutation action | Mutation action | Rare — use `unwrap()` |

**Example — mutation calling a query (no unwrap):**
```ts
export const createAssessmentFromQuiz = createAction(async (input: QuizInput) => {
  const term = await getActiveTerm();  // query, returns raw Term
  return quizzesService.link(input.quizId, term.code);
});
```

**Example — mutation calling a mutation (unwrap needed):**
```ts
export const createAssessmentFromQuiz = createAction(async (input: QuizInput) => {
  const assessment = unwrap(await createAssessment(data));  // mutation, returns ActionResult
  return quizzesService.link(input.quizId, assessment.id);
});
```

**Estimated total `unwrap()` calls in the entire codebase: ~5-10** (only mutation→mutation cross-calls).

Each module plan (003–008) includes a **Part E** listing cross-action calls, now significantly reduced.

## Service-Level Action Imports (ARCHITECTURE FIX)

**Problem**: Several **service files** import action functions (e.g., `getActiveTerm` from `@/app/registry/terms`). This violates the data flow rule (UI → Actions → Services → Repositories — services must NOT call actions).

**Note**: Under the mutations-only strategy, `getActiveTerm` stays as a plain function (it's a query), so its return type does NOT change. Service callers won't break from a type perspective. However, the architecture violation should still be fixed:

```ts
// WRONG — service importing an action
import { getActiveTerm } from '@/app/registry/terms';

// CORRECT — service importing a service
import { termsService } from '@registry/terms/_server/service';
const term = await termsService.getActiveOrThrow();
```

**Known service-level action imports** (fixed in Plan 004, Part A.0):
- `getActiveTerm()` → 5 service files
- Verify others at implementation time per module

## Non-Breaking Incremental Strategy

**After completing any single plan, the app must compile and run.** This is achieved by:

1. **Backward compatibility in shared types**: `ActionResult.error` uses `AppError | string` union during transition. `getActionErrorMessage()` handles both formats. `failure()` accepts both.
2. **UI components accept both old and new response formats**: `Form`, `DeleteButton` handle both raw `T` and `ActionResult<T>` return values, and both `string` and `AppError` error fields.
3. **`useActionMutation` hook**: Unwraps `ActionResult<T>` for client components that use `useMutation` directly with mutation actions.
4. **Queries unchanged**: Query actions stay as plain functions returning raw data. RSC pages, ListLayout callers, and cross-action query calls require **zero changes**. This dramatically reduces migration surface.
5. **ListLayout keeps positional params**: `getData(page, search)` returns raw data from query actions. ListLayout's dual-format support handles edge cases where a wrapped action is passed.
6. **Per-module vertical slices**: Plans 003–008 each migrate one module group — wrapping mutation actions and updating direct `useMutation` clients. Unmigrated modules continue working.
7. **Minimal cross-action unwrap**: Only mutation→mutation cross-calls (~5-10 total) need `unwrap()`. Query calls need no changes.
8. **Architecture fix**: Service files importing query actions should be refactored to import services directly (architecture hygiene, not type-safety).
9. **Cleanup at the end**: Plan 009 removes the `string` compat from `ActionResult.error`.

## Reference Document

Full architecture details, code snippets, type definitions, and rationale:
→ [error-handling-plan.md](./error-handling-plan.md)

## Plan Files

| # | File | Scope | Status |
|---|------|-------|--------|
| 1 | [001_shared_infrastructure.md](./001_shared_infrastructure.md) | `extractError.ts`, `actionResult.ts`, `UserFacingError` — backward-compatible | ✅ Completed |
| 2 | [002_ui_components.md](./002_ui_components.md) | `StatusPage`, `error.tsx`, `global-error.tsx`, `useActionMutation`, `Form`, `DeleteButton`, `DetailsViewHeader`, `ListLayout` — dual-format support | ✅ Completed |
| 3 | [003_academic.md](./003_academic.md) | Academic module: mutations only + `useMutation` clients | ✅ Completed |
| 4 | [004_registry.md](./004_registry.md) | Registry module: mutations only + `useMutation` clients | ⬜ Not started |
| 5 | [005_admissions.md](./005_admissions.md) | Admissions module: mutations only + `useMutation` clients | ⬜ Not started |
| 6 | [006_admin_finance.md](./006_admin_finance.md) | Admin + Finance + Auth + HR: mutations only + `useMutation` clients | ⬜ Not started |
| 7 | [007_lms_library_timetable.md](./007_lms_library_timetable.md) | LMS + Library + Timetable: mutations only + `useMutation` clients | ⬜ Not started |
| 8 | [008_remaining.md](./008_remaining.md) | Apply + Reports + Student Portal + Audit-Logs + Feedback: mutations only + `useMutation` clients | ⬜ Not started |
| 9 | [009_cleanup.md](./009_cleanup.md) | Remove backward compat: `error` → `AppError` only | ⬜ Not started |
| 10 | [010_verification.md](./010_verification.md) | Full verification, type-check, lint, manual testing checklist | ⬜ Not started |

## Execution Order

Plans **must** be executed in numerical order:

1. **001** creates shared types and utilities — **non-breaking** (new files, backward-compatible types)
2. **002** updates UI components to accept both old and new formats — **non-breaking** (existing callers still work)
3. **003–008** each wrap mutation actions + update `useMutation` clients — **non-breaking** (queries/RSC pages/layouts unchanged)
4. **009** removes backward compat, tightens types — **requires all modules migrated first**
5. **010** runs full verification

### Why this order is safe

| After completing | App state |
|---|---|
| 001 | ✅ New shared files added. No consumers changed. All existing code works. |
| 002 | ✅ UI components handle both formats. Old actions still return raw data → components handle it. New ActionResult → components handle it too. |
| 003 | ✅ Academic mutations wrapped. Queries/pages/layouts untouched. |
| 004 | ✅ + Registry mutations wrapped. |
| 005 | ✅ + Admissions mutations wrapped. |
| 006 | ✅ + Admin/Finance/Auth/HR mutations wrapped. |
| 007 | ✅ + LMS/Library/Timetable mutations wrapped. |
| 008 | ✅ All mutations wrapped. Backward compat still in place. |
| 009 | ✅ Compat removed. Types fully strict. |
| 010 | ✅ Full verification pass. |

## Progress Tracking

Update status in the table above as each plan completes:
- ⬜ Not started
- 🔄 In progress
- ✅ Completed
