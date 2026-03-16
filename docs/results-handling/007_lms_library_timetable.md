# Plan 007: LMS + Library + Timetable Modules

> Wrap **mutation** actions with `createAction`. Query actions stay as plain functions. RSC pages and ListLayout callers require **no changes**. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Mutation Actions Only (26 files)

Use the same mutations-only template as Plan 003. Key rules:
- Only mutations get wrapped with `createAction`
- Queries stay as plain `async function` exports
- `export const` for wrapped mutations
- No manual `try/catch`

### LMS (10 files)

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/lms/virtual-classroom/_server/actions.ts` | |
| 2 | `src/app/lms/gradebook/_server/actions.ts` | |
| 3 | `src/app/lms/assignments/_server/actions.ts` | |
| 4 | `src/app/lms/students/_server/actions.ts` | |
| 5 | `src/app/lms/courses/_server/actions.ts` | |
| 6 | `src/app/lms/quizzes/_server/actions.ts` | |
| 7 | `src/app/lms/course-outline/_server/actions.ts` | |
| 8 | `src/app/lms/auth/_server/actions.ts` | Auth-specific, may have token logic |
| 9 | `src/app/lms/posts/_server/actions.ts` | |
| 10 | `src/app/lms/material/_server/actions.ts` | |

**LMS Special Case**: These call Moodle APIs which throw Moodle-specific errors. `extractError` already handles `isMoodleError` — `createAction` catches and normalizes these automatically. Do NOT add extra try/catch.

### Library (11 files)

| # | File |
|---|------|
| 11 | `src/app/library/fines/_server/actions.ts` |
| 12 | `src/app/library/external-libraries/_server/actions.ts` |
| 13 | `src/app/library/settings/_server/actions.ts` |
| 14 | `src/app/library/resources/question-papers/_server/actions.ts` |
| 15 | `src/app/library/resources/publications/_server/actions.ts` |
| 16 | `src/app/library/categories/_server/actions.ts` |
| 17 | `src/app/library/catalog/_server/actions.ts` |
| 18 | `src/app/library/authors/_server/actions.ts` |
| 19 | `src/app/library/books/_server/actions.ts` |
| 20 | `src/app/library/book-copies/_server/actions.ts` |
| 21 | `src/app/library/loans/_server/actions.ts` |

### Timetable (5 files)

| # | File |
|---|------|
| 22 | `src/app/timetable/viewer/_server/actions.ts` |
| 23 | `src/app/timetable/venues/_server/actions.ts` |
| 24 | `src/app/timetable/venue-types/_server/actions.ts` |
| 25 | `src/app/timetable/timetable-allocations/_server/actions.ts` |
| 26 | `src/app/timetable/slots/_server/actions.ts` |

---

## Part B: RSC Pages — No Changes Needed

Since query actions stay as plain functions, all RSC pages continue calling them with plain `await`. **No `unwrap()` needed.**

---

## Part C: ListLayout Callers — No Changes Needed

Since `findAll*` actions stay as plain functions returning raw data, all ListLayout callers continue working as-is. **No changes needed.**

---

## Part D: Update Direct `useMutation` Callers

The LMS module has the highest concentration of direct `useMutation` callers (~40 components). Client components that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Discovery

Search all `_components/` folders in `src/app/lms/`, `src/app/library/`, `src/app/timetable/` for `useMutation({ mutationFn:` patterns.

Known LMS candidates:
- `src/app/lms/quizzes/_components/form/`
- `src/app/lms/assignments/_components/form/`
- `src/app/lms/material/_components/`
- `src/app/lms/posts/_components/`
- `src/app/lms/virtual-classroom/_components/`
- `src/app/lms/courses/_components/`
- `src/app/lms/gradebook/_components/`

Known Timetable candidates:
- `src/app/timetable/timetable-allocations/_components/` (AddAllocationModal, EditAllocationModal)
- `src/app/timetable/_shared/components/` (AddSlotAllocationModal)

---

## Part E: Cross-Action Calls (LMS-Heavy)

Under the mutations-only strategy, only mutation→mutation cross-calls need `unwrap()`. Calls to query actions need no changes.

### Cross-Action Calls in LMS Module

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 1 | `lms/quizzes/_server/actions.ts` | `createAssessment()` ×2 | **Yes (mutation)** | Add `unwrap()` |
| 2 | `lms/quizzes/_server/actions.ts` | `getActiveTerm()` ×2 | No (query) | No change |
| 3 | `lms/quizzes/_server/actions.ts` | `findStudentsByLmsUserIdsForSubmissions()` | No (query) | No change |
| 4 | `lms/assignments/_server/actions.ts` | `createAssessment()` | **Yes (mutation)** | Add `unwrap()` |
| 5 | `lms/assignments/_server/actions.ts` | `getActiveTerm()` | No (query) | No change |
| 6 | `lms/courses/_server/actions.ts` | `linkCourseToAssignment()` | **Yes (mutation)** | Add `unwrap()` |
| 7 | `lms/gradebook/_server/actions.ts` | `getAssignedModuleByLmsCourseId()` | No (query) | No change |
| 8 | `lms/gradebook/_server/actions.ts` | `getStudentsBySemesterModules()` | No (query) | No change |
| 9 | `lms/gradebook/_server/actions.ts` | `getEnrolledStudentsFromDB()` | No (query) | No change |

**Note**: LMS actions also import from `@auth/auth-providers/_server/repository` (direct repository call, not an action) — these do NOT need `unwrap()`.

**Summary**: Only 4 cross-action calls need `unwrap()` (items 1, 4, 6 — all mutations). The remaining 5 are queries and need no changes.

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All mutation actions across 26 files wrapped with `createAction`
- [ ] All query actions remain as plain `async function` exports
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] All mutation→mutation cross-action calls wrapped with `unwrap()` (~4 call sites)
- [ ] `pnpm tsc --noEmit` passes
- [ ] **LMS + Library + Timetable module mutations wrapped; queries/pages/layouts untouched**
