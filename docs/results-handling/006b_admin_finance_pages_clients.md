# Plan 006b: Admin + Finance + Auth + HR — Pages, Layouts & Client Components

> Update RSC pages with `unwrap()`, verify/update ListLayout callers, and migrate direct `useMutation` callers across admin, finance, auth, and human-resource modules. **Non-breaking**.

## Prerequisites

- Plan 006a completed (all 10 action files wrapped with `createAction`)

---

## Part A: Update RSC Pages (~13 pages)

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

## Part B: Verify/Update ListLayout Callers (~8 files)

### Direct References — Verify Only

| # | File |
|---|------|
| 1 | `src/app/admin/users/layout.tsx` |
| 2 | `src/app/finance/sponsors/layout.tsx` |
| 3 | `src/app/finance/payment-receipts/layout.tsx` |
| 4 | `src/app/human-resource/employees/layout.tsx` |

### Arrow Function Wrappers — Must Verify & Update

| # | File | Notes |
|---|------|-------|
| 5 | `src/app/admin/tasks/layout.tsx` | Arrow wrapper |
| 6 | `src/app/admin/notifications/layout.tsx` | Arrow wrapper |
| 7 | `src/app/admin/activity-tracker/layout.tsx` | Arrow wrapper |
| 8 | `src/app/auth/permission-presets/layout.tsx` | Arrow wrapper |

**Arrow wrappers**: These receive `(page, search)` from ListLayout, call the action, and pass the result back. Since the action's return type is now `ActionResult`, and ListLayout handles both formats, these should auto-work. Update only if type errors occur.

---

## Part C: Update Direct `useMutation` Callers

Search `_components/` folders in `src/app/admin/`, `src/app/finance/`, `src/app/auth/`, `src/app/human-resource/` for `useMutation` patterns.

```bash
grep -rn "useMutation" src/app/admin/ src/app/finance/ src/app/auth/ src/app/human-resource/ --include="*.tsx" --include="*.ts" -l
```

Known candidates:
- `src/app/admin/users/_components/` (RoleSelector, PermissionEditor, etc.)
- `src/app/admin/tasks/_components/` (TaskActions, StatusToggle)
- `src/app/admin/notifications/_components/` (NotificationActions)
- `src/app/finance/payment-receipts/_components/` (ReceiptVerification)

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All ~13 RSC pages with direct `await` calls use `unwrap()`
- [ ] All 4 direct ListLayout callers verified working
- [ ] All 4 arrow-wrapper ListLayout callers verified/updated
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Admin + Finance + Auth + HR modules fully migrated; all other modules still work**
