# Phase 10: Academic Services — Part 2

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 9 complete. Read `000_overview.md` first.

This phase migrates the remaining four academic module services and performs cleanup of the academic module.

## 10.1 Services To Migrate (This Phase)

| Service | File |
|---------|------|
| FeedbackCategoryService | `src/app/academic/feedback/categories/_server/service.ts` |
| FeedbackCycleService | `src/app/academic/feedback/cycles/_server/service.ts` |
| FeedbackReportService | `src/app/academic/feedback/reports/_server/service.ts` |
| LecturerService | `src/app/academic/lecturers/_server/service.ts` |

## 10.2 Detailed Conversions

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

**Before:** academic + HR for read, position in `['manager', 'admin']` for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'feedback-reports': ['read'] },
    findAllAuth: { 'feedback-reports': ['read'] },
    updateAuth: { 'feedback-reports': ['update'] },
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
    createAuth: { lecturers: ['create'] },
    updateAuth: { lecturers: ['update'] },
    deleteAuth: { lecturers: ['delete'] },
  });
}
```

## 10.3 Cleanup

For each service file, also:
- Remove any `import { Session } from 'next-auth'` (replace with `@/core/auth` if still needed)
- Remove any position-checking helper functions that are no longer referenced
- Remove any `userPositions` imports
- Update any custom access check functions to use the new `Session` type

## Exit Criteria

- [ ] All 9 academic services migrated to permission-based auth config (including 5 from Phase 9)
- [ ] All position-checking helper functions removed
- [ ] No `withAuth` imports remain in academic module
- [ ] No `next-auth` imports remain in academic service files
- [ ] No `userPositions` or `position` references in academic services
- [ ] `pnpm tsc --noEmit` passes for academic module
