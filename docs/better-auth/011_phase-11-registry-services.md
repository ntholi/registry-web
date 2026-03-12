# Phase 11: Registry Services

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 10 complete. Read `000_overview.md` first.

This phase migrates all registry module services from role-array authorization to permission-based authorization.

## 11.1 Registry Module Services

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

## 11.2 Cleanup

For each service file:
- Remove any `import { Session } from 'next-auth'` (replace with `@/core/auth` if still needed)
- Remove position-checking helper functions
- Remove `userPositions` imports
- Update custom access check functions to use the new `Session` type

## Exit Criteria

- [ ] All 6 registry services migrated to permission-based auth config
- [ ] No `withAuth` imports remain in registry module
- [ ] No `next-auth` imports remain in registry service files
- [ ] No `userPositions` or `position` references in registry services
- [ ] `pnpm tsc --noEmit` passes for registry module
