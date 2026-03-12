# Phase 9: Academic Services — Part 1

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 8 complete. Read `000_overview.md` first.

This phase migrates the first five academic module services from role-array authorization to permission-based authorization using the new `withPermission`/`BaseService` API.

## 9.1 Services To Migrate (This Phase)

| Service | File |
|---------|------|
| AssessmentService | `src/app/academic/assessments/_server/service.ts` |
| SemesterModuleService | `src/app/academic/semester-modules/_server/service.ts` |
| ModuleService | `src/app/academic/modules/_server/service.ts` |
| SchoolStructureService | `src/app/academic/schools/structures/_server/service.ts` |
| FeedbackQuestionService | `src/app/academic/feedback/questions/_server/service.ts` |

## 9.2 Migration Pattern

For each service:

1. Remove imports of `withAuth`, `Session` from `next-auth`
2. Import `Session` from `@/core/auth` (if used in custom access functions)
3. Replace `byIdRoles` → `byIdAuth`, `findAllRoles` → `findAllAuth`, etc.
4. Convert role arrays to `PermissionRequirement` objects
5. Remove position-checking helper functions (replaced by preset permissions)

## 9.3 Detailed Conversions

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

## Exit Criteria

- [ ] All 5 services migrated to permission-based auth config
- [ ] Position-checking helper functions removed where applicable
- [ ] No `withAuth` imports remain in these service files
- [ ] No `next-auth` imports remain in these service files
- [ ] `pnpm tsc --noEmit` passes for migrated services
