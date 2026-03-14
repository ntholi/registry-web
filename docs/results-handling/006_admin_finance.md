# Plan 006: Admin + Finance + Auth + HR Modules

> Migrate `admin/` (6 actions), `finance/` (2 actions), `auth/` (1 action), and `human-resource/` (1 action) end-to-end. **Non-breaking**.

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

## Part B: Update RSC Pages (~19 pages)

### Admin

| # | File | Action calls to wrap |
|---|------|---------------------|
| 1 | `src/app/admin/users/[id]/page.tsx` | `getUser(id)` |
| 2 | `src/app/admin/users/[id]/edit/page.tsx` | `getUser(id)` |
| 3 | `src/app/admin/tasks/[id]/page.tsx` | `getTask(id)` |
| 4 | `src/app/admin/tasks/[id]/edit/page.tsx` | `getTask(id)` |
| 5 | `src/app/admin/notifications/[id]/page.tsx` | `getNotification(id)` |
| 6 | `src/app/admin/notifications/[id]/edit/page.tsx` | `getNotification(id)` |
| 7 | `src/app/admin/activity-tracker/page.tsx` | Check for direct calls |

### Finance

| # | File | Action calls to wrap |
|---|------|---------------------|
| 8 | `src/app/finance/sponsors/[id]/page.tsx` | `getSponsor(id)` |
| 9 | `src/app/finance/sponsors/[id]/edit/page.tsx` | `getSponsor(id)` |
| 10 | `src/app/finance/payment-receipts/page.tsx` | Check for direct calls |

### Auth

| # | File | Action calls to wrap |
|---|------|---------------------|
| 11 | `src/app/auth/permission-presets/[id]/page.tsx` | `getPermissionPreset(id)` |

### Human Resource

| # | File | Action calls to wrap |
|---|------|---------------------|
| 12 | `src/app/human-resource/employees/[id]/page.tsx` | `getEmployee(id)` |
| 13 | `src/app/human-resource/employees/[id]/edit/page.tsx` | `getEmployee(id)` |

---

## Part C: Verify/Update ListLayout Callers

### Direct References — Verify Only

| # | File |
|---|------|
| 1 | `src/app/admin/users/layout.tsx` |
| 2 | `src/app/finance/sponsors/layout.tsx` |
| 3 | `src/app/finance/payment-receipts/layout.tsx` |
| 4 | `src/app/human-resource/employees/layout.tsx` |

### Arrow Function Wrappers — Must Update

| # | File | Notes |
|---|------|-------|
| 5 | `src/app/admin/tasks/layout.tsx` | Arrow wrapper |
| 6 | `src/app/admin/notifications/layout.tsx` | Arrow wrapper |
| 7 | `src/app/admin/activity-tracker/layout.tsx` | Arrow wrapper |
| 8 | `src/app/auth/permission-presets/layout.tsx` | Arrow wrapper |

**Arrow wrappers**: These receive `(page, search)` from ListLayout, call the action, and pass the result back. Since the action's return type is now `ActionResult`, and ListLayout handles both formats, these should auto-work. Update only if type errors occur.

---

## Part D: Update Direct `useMutation` Callers

Client components in admin/finance/auth/HR modules that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Discovery

Search `_components/` folders in `src/app/admin/`, `src/app/finance/`, `src/app/auth/`, `src/app/human-resource/` for `useMutation({ mutationFn:` patterns.

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All 10 action files import and use `createAction`
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified/updated
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Admin + Finance + Auth + HR modules fully migrated; all other modules still work**
