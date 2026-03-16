# Plan 006: Admin + Finance + Auth + HR Modules

> Wrap **mutation** actions with `createAction`. Query actions stay as plain functions. RSC pages and ListLayout callers require **no changes**. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Mutation Actions Only (10 files)

Use the same mutations-only template as Plan 003. Key rules:
- Only mutations get wrapped with `createAction`
- Queries stay as plain `async function` exports
- `export const` for wrapped mutations
- No manual `try/catch`

### Admin (6 files)

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/admin/users/_server/actions.ts` | |
| 2 | `src/app/admin/tasks/_server/actions.ts` | |
| 3 | `src/app/admin/notifications/_server/actions.ts` | |
| 4 | `src/app/admin/activity-tracker/_server/actions.ts` | |
| 5 | `src/app/admin/tools/grade-finder/_server/actions.ts` | **Query-only — skip entirely** |
| 6 | `src/app/admin/bulk/transcripts/_server/actions.ts` | Bulk operations — wrap mutations only |

### Finance (2 files)

| # | File |
|---|------|
| 7 | `src/app/finance/sponsors/_server/actions.ts` |
| 8 | `src/app/finance/payment-receipts/_server/actions.ts` |

### Auth (1 file)

| # | File |
|---|------|
| 9 | `src/app/auth/permission-presets/_server/actions.ts` |

### Human Resource (1 file)

| # | File |
|---|------|
| 10 | `src/app/human-resource/employees/_server/actions.ts` |

---

## Part B: RSC Pages — No Changes Needed

Since query actions stay as plain functions, all RSC pages continue calling them with plain `await`. **No `unwrap()` needed.**

---

## Part C: ListLayout Callers — No Changes Needed

Since `findAll*` actions stay as plain functions returning raw data, all ListLayout callers continue working as-is. **No changes needed.**

---

## Part D: Update Direct `useMutation` Callers

Client components in admin/finance/auth/HR modules that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Discovery

Search `_components/` folders in `src/app/admin/`, `src/app/finance/`, `src/app/auth/`, `src/app/human-resource/` for `useMutation({ mutationFn:` patterns.

---

## Part E: Cross-Action Calls (Minimal)

Under the mutations-only strategy, most cross-action calls are queries and need no changes.

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 1 | Verify at implementation time — admin/finance modules may call registry/academic mutation actions | | | Add `unwrap()` only for mutation→mutation calls |

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All mutation actions across 10 files wrapped with `createAction`
- [ ] All query actions remain as plain `async function` exports
- [ ] Query-only files (grade-finder) left completely untouched
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Admin + Finance + Auth + HR module mutations wrapped; queries/pages/layouts untouched**
