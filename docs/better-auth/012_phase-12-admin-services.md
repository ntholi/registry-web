# Phase 12: Admin Services & Non-Service Files

> Estimated Implementation Time: 0.5 to 1 hour

**Prerequisites**: Phase 11 complete. Read `000_overview.md` first.

This phase migrates admin module services and non-service files from role-array authorization to permission-based authorization.

## 12.1 Admin Module Services

| Service | File |
|---------|------|
| UserService | `src/app/admin/users/_server/service.ts` |
| TaskService | `src/app/admin/tasks/_server/service.ts` |
| ActivityTrackerService | `src/app/admin/activity-tracker/_server/service.ts` |
| NotificationService | `src/app/admin/notifications/_server/service.ts` |

### UserService

**Before:** `['dashboard']` for CRUD (+ admin for nav)

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { users: ['read'] },
    findAllAuth: { users: ['read'] },
    createAuth: { users: ['create'] },
    updateAuth: { users: ['update'] },
    deleteAuth: { users: ['delete'] },
  });
}
```

### TaskService

**Before:** `['admin']` (+ manager position check)

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { tasks: ['read'] },
    findAllAuth: { tasks: ['read'] },
    createAuth: { tasks: ['create'] },
    updateAuth: { tasks: ['update'] },
    deleteAuth: { tasks: ['delete'] },
  });
}
```

### ActivityTrackerService

**Before:** `['admin']` (+ manager position check)

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'activity-tracker': ['read'] },
    findAllAuth: { 'activity-tracker': ['read'] },
  });
}
```

### NotificationService

**Before:** Uses `withAuth` directly

**After:** Update `src/app/admin/notifications/_server/actions.ts` to use `withPermission` with `'auth'` requirement.

## 12.2 Additional Non-Service Files

These files use `withAuth` or session directly in the admin module and must be migrated:

| File | Reason |
|------|--------|
| `src/app/admin/notifications/_server/actions.ts` | Uses `withAuth` directly |
| `src/app/admin/reports.config.ts` | References session role/position |

## 12.3 Cleanup

For each service file:
- Remove any `import { Session } from 'next-auth'` (replace with `@/core/auth` if still needed)
- Remove position-checking helper functions
- Remove `userPositions` imports
- Update custom access check functions to use the new `Session` type

## Exit Criteria

- [ ] All 4 admin services/actions migrated to permission-based auth config
- [ ] `reports.config.ts` updated to remove position references
- [ ] No `withAuth` imports remain in admin module
- [ ] No `next-auth` imports remain in admin service files
- [ ] No `userPositions` or `position` references in admin module
- [ ] `pnpm tsc --noEmit` passes for admin module
