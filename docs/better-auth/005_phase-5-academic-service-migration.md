# Phase 5: Academic Module Service Migration

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 4 complete. Read `000_steering.md` first.

This phase migrates all academic module services from role-array authorization to permission-based authorization using the new `withPermission`/`BaseService` API.

## 5.1 Services To Migrate

| Service | File |
|---------|------|
| AssessmentService | `src/app/academic/assessments/_server/service.ts` |
| SemesterModuleService | `src/app/academic/semester-modules/_server/service.ts` |
| ModuleService | `src/app/academic/modules/_server/service.ts` |
| SchoolStructureService | `src/app/academic/schools/structures/_server/service.ts` |
| FeedbackQuestionService | `src/app/academic/feedback/questions/_server/service.ts` |
| FeedbackCategoryService | `src/app/academic/feedback/categories/_server/service.ts` |
| FeedbackCycleService | `src/app/academic/feedback/cycles/_server/service.ts` |
| FeedbackReportService | `src/app/academic/feedback/reports/_server/service.ts` |
| LecturerService | `src/app/academic/lecturers/_server/service.ts` |

## 5.2 Migration Pattern

For each service:

1. Remove imports of `withAuth`, `Session` from `next-auth`
2. Import `Session` from `@/core/auth` (if used in custom access functions)
3. Replace `byIdRoles` → `byIdAuth`, `findAllRoles` → `findAllAuth`, etc.
4. Convert role arrays to `PermissionRequirement` objects
5. Remove position-checking helper functions (replaced by preset permissions)

## 5.3 Detailed Conversions

### AssessmentService

**Before:**
```ts
constructor() {
  super(repo, {
    byIdRoles: ['academic', 'leap'],
    findAllRoles: ['academic', 'leap'],
    createRoles: ['academic', 'leap'],
    updateRoles: ['academic', 'leap'],
    deleteRoles: ['academic', 'leap'],
  });
}
```

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { assessments: ['read'] },
    findAllAuth: { assessments: ['read'] },
    createAuth: { assessments: ['create'] },
    updateAuth: { assessments: ['update'] },
    deleteAuth: { assessments: ['delete'] },
  });
}
```

### SemesterModuleService

**Before:** `['dashboard']` for read, `['registry']` for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: 'dashboard',
    findAllAuth: 'dashboard',
    createAuth: { 'semester-modules': ['create'] },
    updateAuth: { 'semester-modules': ['update'] },
  });
}
```

### ModuleService

**Before:** `['dashboard']` for read, `['registry']` for create

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: 'dashboard',
    findAllAuth: 'dashboard',
    createAuth: { modules: ['create'] },
  });
}
```

### SchoolStructureService

**Before:** `['dashboard']` for read, position-based for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: 'dashboard',
    findAllAuth: 'dashboard',
    updateAuth: { 'school-structures': ['update'] },
    deleteAuth: { 'school-structures': ['delete'] },
  });
}
```

### FeedbackQuestionService

**Before:** `['academic']` for read, position in `['manager', 'program_leader', 'admin']` for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'feedback-questions': ['read'] },
    findAllAuth: { 'feedback-questions': ['read'] },
    createAuth: { 'feedback-questions': ['create'] },
    updateAuth: { 'feedback-questions': ['update'] },
    deleteAuth: { 'feedback-questions': ['delete'] },
  });
}
```

### FeedbackCategoryService

**Before:** `['academic']` for read, position-based for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'feedback-categories': ['read'] },
    findAllAuth: { 'feedback-categories': ['read'] },
    createAuth: { 'feedback-categories': ['create'] },
    updateAuth: { 'feedback-categories': ['update'] },
    deleteAuth: { 'feedback-categories': ['delete'] },
  });
}
```

### FeedbackCycleService

**Before:**
```ts
const CRUD_POSITIONS = ['admin', 'manager'];
const VIEW_POSITIONS = ['admin', 'manager', 'year_leader'];

function canManageCycles(session: Session) {
  return Promise.resolve(
    session.user?.role === 'academic' &&
    CRUD_POSITIONS.includes(session.user.position ?? '')
  );
}
```

**After:**
```ts
constructor() {
  super(repo, {
    findAllAuth: { 'feedback-cycles': ['read'] },
    byIdAuth: { 'feedback-cycles': ['read'] },
    createAuth: { 'feedback-cycles': ['create'] },
    updateAuth: { 'feedback-cycles': ['update'] },
    deleteAuth: { 'feedback-cycles': ['delete'] },
  });
}
```

Remove `canManageCycles`, `CRUD_POSITIONS`, `VIEW_POSITIONS` helper functions — no longer needed.

### FeedbackReportService

**Before:** academic + HR for read, position in `['manager', 'admin']` for full

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'feedback-reports': ['read'] },
    findAllAuth: { 'feedback-reports': ['read'] },
    updateAuth: { 'feedback-reports': ['manage'] },
  });
}
```

### LecturerService

**Before:** academic + position in `['manager', 'program_leader', 'admin']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { lecturers: ['read'] },
    findAllAuth: { lecturers: ['read'] },
    createAuth: { lecturers: ['manage'] },
    updateAuth: { lecturers: ['manage'] },
    deleteAuth: { lecturers: ['manage'] },
  });
}
```

## 5.4 Cleanup Per Service

For each service file, also:
- Remove any `import { Session } from 'next-auth'` (replace with `@/core/auth` if still needed)
- Remove any position-checking helper functions that are no longer referenced
- Remove any `userPositions` imports
- Update any custom access check functions to use the new `Session` type

## Exit Criteria

- [ ] All 9 academic services migrated to permission-based auth config
- [ ] All position-checking helper functions removed
- [ ] No `withAuth` imports remain in academic module
- [ ] No `next-auth` imports remain in academic service files
- [ ] No `userPositions` or `position` references in academic services
- [ ] `pnpm tsc --noEmit` passes for academic module
