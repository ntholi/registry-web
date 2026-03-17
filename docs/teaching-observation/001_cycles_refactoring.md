# Part 1: Cycles Refactoring (Prerequisite)

> Move cycles out of `student-feedback/` to be a shared resource under `appraisals/`, and rename TS exports.

## Why

Teaching observations and student feedback both operate within **feedback cycles**. Currently cycles live under `student-feedback/cycles/` and the TypeScript exports are prefixed with `studentFeedback*`. Moving them up makes them a shared appraisals concept.

## Important

The PostgreSQL table names are **already generic**:
- `feedback_cycles` (not `student_feedback_cycles`)
- `feedback_cycle_schools` (not `student_feedback_cycle_schools`)

So **no DB migration is needed**. Only TypeScript-level renames and file moves.

## Changes

### 1. Move Folder

```
FROM: src/app/appraisals/student-feedback/cycles/
  TO: src/app/appraisals/cycles/
```

This includes all subfolders: `_schema/`, `_server/`, `_components/`, pages, layout.

### 2. Rename Schema Exports

| File | Old Export | New Export |
|------|-----------|-----------|
| `_schema/studentFeedbackCycles.ts` → `_schema/feedbackCycles.ts` | `studentFeedbackCycles` | `feedbackCycles` |
| `_schema/studentFeedbackCycleSchools.ts` → `_schema/feedbackCycleSchools.ts` | `studentFeedbackCycleSchools` | `feedbackCycleSchools` |
| `_schema/studentFeedbackPassphrases.ts` (stays) | `studentFeedbackPassphrases` | No rename (student-specific) |
| `_schema/relations.ts` | `studentFeedbackCyclesRelations` | `feedbackCyclesRelations` |
| | `studentFeedbackCycleSchoolsRelations` | `feedbackCycleSchoolsRelations` |

### 3. Rename Repository & Service

| File | Old Name | New Name |
|------|----------|----------|
| `_server/repository.ts` | `StudentFeedbackCycleRepository` | `FeedbackCycleRepository` |
| `_server/service.ts` | `StudentFeedbackCycleService` | `FeedbackCycleService` |
| `_server/service.ts` | `studentFeedbackCyclesService` | `feedbackCyclesService` |

### 4. Update Barrel Exports

**`appraisals/_database/index.ts`** — update paths:

```diff
- export * from '../student-feedback/cycles/_schema/relations';
- export * from '../student-feedback/cycles/_schema/studentFeedbackCycleSchools';
- export * from '../student-feedback/cycles/_schema/studentFeedbackCycles';
- export * from '../student-feedback/cycles/_schema/studentFeedbackPassphrases';
+ export * from '../cycles/_schema/relations';
+ export * from '../cycles/_schema/feedbackCycleSchools';
+ export * from '../cycles/_schema/feedbackCycles';
+ export * from '../cycles/_schema/studentFeedbackPassphrases';
```

### 5. Update `core/database` Aggregated Imports

The aggregated database barrel at `src/core/database/` re-exports from `appraisals/_database`. Since the barrel export names change (`studentFeedbackCycles` → `feedbackCycles`), all server code importing from `@/core/database` will need their destructured names updated.

**Affected imports pattern**:
```diff
- import { studentFeedbackCycles, studentFeedbackCycleSchools } from '@/core/database';
+ import { feedbackCycles, feedbackCycleSchools } from '@/core/database';
```

### 6. Update Navigation

**`appraisals.config.ts`** — Cycles moves out of Student Feedback children:

```diff
  navigation: {
    dashboard: [
      {
        label: 'Student Feedback',
        icon: IconMessageStar,
        children: [
          { label: 'Questions', href: '/appraisals/student-feedback/questions' },
-         { label: 'Cycles', href: '/appraisals/student-feedback/cycles' },
          { label: 'Reports', href: '/appraisals/student-feedback/reports' },
        ],
      },
+     {
+       label: 'Cycles',
+       href: '/appraisals/cycles',
+       icon: IconCalendarEvent,
+       permissions: [{ resource: 'feedback-cycles', action: 'read' }],
+     },
    ],
  },
```

### 7. Update Permission Resource Names

In the permission catalog (`src/app/auth/permission-presets/_lib/catalog.ts`):

```diff
- 'student-feedback-cycles'
+ 'feedback-cycles'
```

Update all preset definitions that reference this resource. Also update the service permission config:

```diff
  // In FeedbackCycleService constructor
  super(repo, {
-   findAllAuth: { 'student-feedback-cycles': ['read'] },
-   createAuth: { 'student-feedback-cycles': ['create'] },
+   findAllAuth: { 'feedback-cycles': ['read'] },
+   createAuth: { 'feedback-cycles': ['create'] },
    // ...
  });
```

### 8. Update Activity Logging

**`appraisals/_lib/activities.ts`** — table operation map keys are already `feedback_cycles:*`, so no change needed for those. But the relation names in repository `db.query.*` calls will need updating from `studentFeedbackCycles` to `feedbackCycles`.

### 9. Update Internal Path References

Files that use `router.push` or `href` pointing to `/appraisals/student-feedback/cycles/`:

- `cycles/_components/Form.tsx` — redirect path after create/update
- `cycles/layout.tsx` — back link path and ListLayout href

## Files Affected (Complete List)

| File | Change Type |
|------|-------------|
| `appraisals/student-feedback/cycles/` (entire folder) | Move to `appraisals/cycles/` |
| `appraisals/_database/index.ts` | Update import paths |
| `appraisals/appraisals.config.ts` | Move Cycles nav item |
| `appraisals/_lib/activities.ts` | No change (table names already correct) |
| `appraisals/student-feedback/reports/_server/repository.ts` | Update schema import names |
| `appraisals/student-feedback/reports/_server/service.ts` | Update schema import names |
| `appraisals/student-feedback/reports/_server/actions.ts` | Update cycle action imports |
| `appraisals/student-feedback/_schema/relations.ts` | Update import paths to cycles |
| `src/core/database/` barrel | Re-exports auto-updated from `_database/` |
| `src/app/auth/permission-presets/_lib/catalog.ts` | Rename resource |
| All presets referencing `student-feedback-cycles` | Update resource name |

## Verification

After refactoring:
1. `pnpm tsc --noEmit` — no type errors
2. `pnpm lint:fix` — no lint errors
3. Student feedback cycles CRUD still works
4. Student feedback reports still load cycle data
5. Passphrase generation still works
6. Navigation links resolve correctly
