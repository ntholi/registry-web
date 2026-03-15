# Plan 006a: Admin + Finance + Auth + HR — Wrap Action Files

> Wrap all 10 action files across admin, finance, auth, and human-resource modules with `createAction`, plus handle any cross-action calls. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Action Files (10 files)

Use the same migration template as Plan 003.

### Admin (6 files)

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/admin/users/_server/actions.ts` | |
| 2 | `src/app/admin/tasks/_server/actions.ts` | |
| 3 | `src/app/admin/notifications/_server/actions.ts` | |
| 4 | `src/app/admin/activity-tracker/_server/actions.ts` | |
| 5 | `src/app/admin/tools/grade-finder/_server/actions.ts` | Specialized query actions |
| 6 | `src/app/admin/bulk/transcripts/_server/actions.ts` | Bulk operations — `createAction` catches timeouts |

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

## Part B: Update Cross-Action Calls

Minimal cross-action calls in this group. Verify at implementation time — admin/finance modules may call registry/academic actions that are already wrapped.

| # | File | Cross-action call | Import source |
|---|------|------------------|---------------|
| 1 | Verify at implementation time — search for action imports from other modules |

**Command to discover**:
```bash
grep -rn "from '@" src/app/admin/ src/app/finance/ src/app/auth/permission-presets/ src/app/human-resource/ --include="actions.ts" | grep -v "from '@/" | head -20
```

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero new type errors in these action files.

## Done When

- [ ] All 10 action files import and use `createAction`
- [ ] All cross-action calls (if any) wrapped with `unwrap()`
- [ ] `pnpm tsc --noEmit` passes (or only has warnings in consumer pages fixed in 006b)
