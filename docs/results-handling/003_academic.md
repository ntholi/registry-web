# Plan 003: Academic Module

> Wrap **mutation** actions with `createAction`. Query actions stay as plain functions. RSC pages and ListLayout callers require **no changes**. **Non-breaking.** ✅ Completed.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

- Only mutation actions are wrapped — query actions stay as plain functions returning raw data
- RSC pages call queries directly with `await` — no `unwrap()` needed
- `ListLayout` receives raw `{ items, totalPages }` from query actions — no changes needed
- `Form.tsx` already handles both `ActionResult<T>` and raw `T`
- Other modules are untouched

---

## Part A: Wrap Mutation Actions Only (13 action files)

### Migration Template

```ts
// Queries stay as plain functions — NO wrapping
export async function findAllThings(page: number, search: string) {
  return thingService.findAll({ page, search });
}

export async function getThing(id: number) {
  return thingService.get(id);
}

// Only mutations get createAction wrapping
import { createAction } from '@/shared/lib/actions/actionResult';

export const createThing = createAction(
  async (data: Input) => thingService.create(data)
);

export const deleteThing = createAction(
  async (id: number) => { await thingService.delete(id); }
);
```

### Rules

1. **Only mutations** get wrapped (create, update, delete, add, remove, assign, link, publish, etc.)
2. **Queries stay raw** (get, find, findAll, search, getAll, check, export) — plain `async function` exports
3. Use `export const` for wrapped mutations (only exception to top-level `function` rule)
4. Keep `revalidatePath` / `revalidateTag` calls inside the handler
5. If a mutation already uses `success()` / `failure()` manually, replace with `createAction`
6. No manual `try/catch` — `createAction` handles all error catching

### Action Files (mutations to wrap)

| # | File | Mutations | Queries (unchanged) |
|---|------|-----------|---------|
| 1 | `lecturers/_server/actions.ts` | (none) | `getLecturer`, `getLecturers`, `searchAllLecturers` |
| 2 | `semester-modules/_server/actions.ts` | `createModule`, `updateModule`, `updateModuleVisibility`, `deleteModule`, `updateGradeByStudentModuleId` | `getSemesterModule`, `findAllModules`, `findModulesByStructure`, `getStructuresByModule`, `getModulePrerequisites`, `getModulesForStructure`, `getVisibleModulesForStructure`, `searchModulesWithDetails`, `getStudentCountForModule`, `getModuleGradesByModuleId` |
| 3 | `schools/_server/actions.ts` | (none — all queries) | `getAllSchools`, `getActiveSchools`, `getSchool`, `getProgramsBySchoolId`, `getAllPrograms`, `getAllProgramsWithLevel`, `getProgramsBySchoolIds` |
| 4 | `schools/structures/_server/actions.ts` | `createStructureSemester` | `getStructure`, `getStructuresByProgramId`, `getStructureModules`, `getStructureSemestersByStructureId` |
| 5 | `modules/_server/actions.ts` | `createModule`, `updateModule` | `getModule`, `getModules` |
| 6 | `assessments/_server/actions.ts` | `createAssessment`, `updateAssessment`, `deleteAssessment` | `getAssessment`, `getAssessmentByModuleId`, `getAssessmentByLmsId`, `getAssessmentAuditHistory` |
| 7 | `feedback/cycles/_server/actions.ts` | `createCycle`, `updateCycle`, `deleteCycle`, `generatePassphrases` | `getCycles`, `getCycle`, `getClassesForCycle`, `getPassphraseStats`, `getPassphrasesForClass`, `getTerms`, `getSchools`, `getSchoolsForUser` |
| 8 | `feedback/categories/_server/actions.ts` | `createCategory`, `updateCategory`, `deleteCategory` | `getCategories`, `getCategory`, `getAllCategories` |
| 9 | `feedback/questions/_server/actions.ts` | `createQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions`, `reorderCategories` | `getQuestions`, `getAllQuestionsWithCategories`, `getQuestionBoard`, `getQuestion` |
| 10 | `feedback/reports/_server/actions.ts` | (none — all queries) | `getFeedbackReportData`, `getFeedbackLecturerDetail`, `getFeedbackCyclesByTerm`, `getFeedbackModulesForFilter`, `checkFullReportAccess`, `exportFeedbackReportExcel` |
| 11 | `attendance/_server/actions.ts` | `markAttendance`, `deleteAttendanceForWeek`, `exportAttendanceForm` | `getWeeksForTerm`, `getAttendanceForWeek`, `getAttendanceSummary`, `getAssignedModulesForCurrentUser` |
| 12 | `assessment-marks/_server/actions.ts` | `createAssessmentMark`, `createOrUpdateMarksInBulk`, `updateAssessmentMark`, `calculateAndSaveModuleGrade` | `getAssessmentMarksByModuleId`, `getMarksAudit`, `getStudentMarks` |
| 13 | `assigned-modules/_server/actions.ts` | `deleteAssignedModule`, `assignModulesToLecturer`, `linkCourseToAssignment` | `getAssignedModuleByUserAndModule`, `getLecturersByModule`, `getAssignedModulesByUser`, `getAssignedModulesByCurrentUser`, `getAllAssignedModulesByCurrentUser`, `getAssignedModuleByLmsCourseId` |

---

## Part B: RSC Pages — No Changes Needed

Since query actions stay as plain functions, all RSC pages continue calling them with plain `await`. **No `unwrap()` needed.**

If any RSC pages were already updated with `unwrap()` during early migration, **revert them** back to plain `await` calls.

---

## Part C: ListLayout Callers — No Changes Needed

Since `findAll*` actions stay as plain functions returning raw `{ items, totalPages }`, all ListLayout callers continue working as-is. **No changes needed.**

---

## Part D: Update Direct `useMutation` Callers

Client components in the academic module that use `useMutation({ mutationFn: someAction })` directly (not through `Form` or `DeleteButton`) must switch to `useActionMutation` to handle the new `ActionResult<T>` return type.

### Migration Template

```ts
// BEFORE
import { useMutation } from '@tanstack/react-query';
import { updateThing } from '../_server/actions';

const mutation = useMutation({
  mutationFn: updateThing,
  onSuccess: (data) => { /* data was T */ },
  onError: (error) => { /* fired on throws */ },
});

// AFTER
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { updateThing } from '../_server/actions';

const mutation = useActionMutation(updateThing, {
  onSuccess: (data) => { /* data is T (unwrapped) */ },
  onError: (error) => { /* fires on ActionResult failure */ },
});
```

### Discovery

Search all `_components/` folders in `src/app/academic/` for:
- `useMutation({ mutationFn:` patterns where the `mutationFn` references a wrapped action
- Replace with `useActionMutation` import and call

Known candidates (verify at implementation time):
- `src/app/academic/feedback/questions/_components/` (EditQuestionModal, QuestionsList)
- `src/app/academic/gradebook/_components/` (MarksInput)
- `src/app/academic/assessments/_components/`
- `src/app/academic/attendance/_components/`

---

## Part E: Cross-Action Calls (Minimal)

Under the mutations-only strategy, cross-action `unwrap()` is only needed when a **mutation calls another mutation**. Calls to query actions need no changes.

### Cross-Action Calls in Academic Module

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 1 | `assessments/_server/actions.ts` | `getActiveTerm()` ×2 | No (query) | No change needed |
| 2 | `assigned-modules/_server/actions.ts` | `getActiveTerm()` ×3 | No (query) | No change needed |
| 3 | `assessment-marks/_server/actions.ts` | `getActiveTerm()` | No (query) | No change needed |
| 4 | `assessment-marks/_server/actions.ts` | `updateGradeByStudentModuleId()` | **Yes (mutation)** | Add `unwrap()` — this is a mutation calling a mutation |
| 5 | `feedback/cycles/_server/actions.ts` | `getAllTerms()` | No (query) | No change needed |
| 6 | `feedback/cycles/_server/actions.ts` | `getAllSchools()` | No (query) | No change needed |
| 7 | `feedback/cycles/_server/actions.ts` | `getUserSchools(userId)` | No (query) | No change needed |

**Total `unwrap()` calls in academic module: 1** (item #4 only)

### Service Files Importing Actions (ARCHITECTURE FIX)

These service files import `getActiveTerm` (an action) in violation of the data flow rule. They must be refactored to use `termsService` directly **before** `getActiveTerm` is wrapped in Plan 004. This is tracked in Plan 004 Part A.0, but listed here for awareness:

| # | File | Current import | Fix |
|---|------|---------------|-----|
| 1 | `attendance/_server/service.ts` | `getActiveTerm` from `@/app/registry/terms` | Use `termsService.getActiveOrThrow()` |
| 2 | `assigned-modules/_server/service.ts` | `getActiveTerm` from `@/app/registry/terms` | Use `termsService.getActiveOrThrow()` |

**Note**: These are fixed in Plan 004 Part A.0, not in this plan.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors in academic module files. Other modules unchanged and passing.

## Done When

- [x] All mutation actions across 13 files wrapped with `createAction`
- [x] All query actions remain as plain `async function` exports
- [x] RSC pages reverted to plain `await` (no `unwrap()`) if previously migrated
- [x] All direct `useMutation` callers switched to `useActionMutation`
- [x] `unwrap()` added for mutation→mutation call (#4: `updateGradeByStudentModuleId`)
- [x] `pnpm tsc --noEmit` passes
- [x] **Academic module mutations wrapped; queries/pages/layouts untouched**
