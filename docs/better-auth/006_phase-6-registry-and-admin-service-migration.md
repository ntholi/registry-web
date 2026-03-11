# Phase 6: Registry & Admin Service Migration

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 5 complete. Read `000_steering-document.md` first.

This phase migrates registry and admin module services from role-array authorization to permission-based authorization.

## 6.1 Registry Module Services

| Service | File |
|---------|------|
| StudentService | `src/app/registry/students/_server/service.ts` |
| RegistrationRequestService | `src/app/registry/registration/requests/_server/requests/service.ts` |
| StudentStatusService | `src/app/registry/student-statuses/_server/service.ts` |
| DocumentService | `src/app/registry/documents/_server/service.ts` |
| TermSettingService | `src/app/registry/terms/settings/_server/service.ts` |
| CertificateReprintService | `src/app/registry/certificate-reprints/_server/service.ts` |

### StudentService

**Before:** `['dashboard']` for read, `['registry', 'student_services']` for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { students: ['read'] },
    findAllAuth: { students: ['read'] },
    updateAuth: { students: ['update'] },
    deleteAuth: { students: ['manage'] },
  });
}
```

### RegistrationRequestService

**Before:** `['registry', 'leap', 'student_services', 'academic']` (with position checks for academic)

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { registration: ['read'] },
    findAllAuth: { registration: ['read'] },
    createAuth: { registration: ['create'] },
    updateAuth: { registration: ['update'] },
  });
}
```

### StudentStatusService

**Before:** `['registry', 'admin', 'student_services', 'finance']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'student-statuses': ['read'] },
    findAllAuth: { 'student-statuses': ['read'] },
    createAuth: { 'student-statuses': ['create'] },
    updateAuth: { 'student-statuses': ['update'] },
    deleteAuth: { 'student-statuses': ['delete'] },
  });
}
```

### DocumentService

**Before:** `['admin', 'registry', 'student_services']` (with manager position checks)

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { documents: ['read'] },
    findAllAuth: { documents: ['read'] },
    createAuth: { documents: ['create'] },
  });
}
```

### TermSettingService

**Before:** `['registry']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'terms-settings': ['read'] },
    findAllAuth: { 'terms-settings': ['read'] },
    updateAuth: { 'terms-settings': ['update'] },
  });
}
```

### CertificateReprintService

**Before:** `['registry']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'certificate-reprints': ['read'] },
    findAllAuth: { 'certificate-reprints': ['read'] },
    createAuth: { 'certificate-reprints': ['create'] },
    updateAuth: { 'certificate-reprints': ['update'] },
    deleteAuth: { 'certificate-reprints': ['delete'] },
  });
}
```

## 6.2 Admin Module Services

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

## 6.3 Additional Non-Service Files

These files use `withAuth` or session directly in the admin module and must be migrated:

| File | Reason |
|------|--------|
| `src/app/admin/notifications/_server/actions.ts` | Uses `withAuth` directly |
| `src/app/admin/reports.config.ts` | References session role/position |

## 6.4 Cleanup

For each service file:
- Remove any `import { Session } from 'next-auth'` (replace with `@/core/auth` if still needed)
- Remove position-checking helper functions
- Remove `userPositions` imports
- Update custom access check functions to use the new `Session` type

## Exit Criteria

- [ ] All 6 registry services migrated to permission-based auth config
- [ ] All 4 admin services/actions migrated to permission-based auth config
- [ ] `reports.config.ts` updated to remove position references
- [ ] No `withAuth` imports remain in registry or admin modules
- [ ] No `next-auth` imports remain in registry or admin service files
- [ ] No `userPositions` or `position` references in these modules
- [ ] `pnpm tsc --noEmit` passes for registry and admin modules
