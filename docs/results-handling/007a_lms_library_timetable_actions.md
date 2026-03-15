# Plan 007a: LMS + Library + Timetable — Wrap Action Files

> Wrap all 26 action files across LMS, library, and timetable modules with `createAction`, plus handle cross-action calls. This is the **largest action-wrapping plan**. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Action Files (26 files)

Use the same migration template as Plan 003.

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

## Part B: Update Cross-Action Calls (9 call sites in LMS)

The LMS module has the heaviest cross-module action dependencies. Wrap each with `unwrap()`.

### Cross-Action Calls

| # | File | Cross-action call | Import source |
|---|------|------------------|---------------|
| 1 | `lms/quizzes/_server/actions.ts` | `createAssessment()` ×2 | `@/app/academic/assessments/_server/actions` |
| 2 | `lms/quizzes/_server/actions.ts` | `getActiveTerm()` ×2 | `@/app/registry/terms` |
| 3 | `lms/quizzes/_server/actions.ts` | `findStudentsByLmsUserIdsForSubmissions()` | `@lms/students` |
| 4 | `lms/assignments/_server/actions.ts` | `createAssessment()` | `@/app/academic/assessments/_server/actions` |
| 5 | `lms/assignments/_server/actions.ts` | `getActiveTerm()` | `@/app/registry/terms` |
| 6 | `lms/courses/_server/actions.ts` | `linkCourseToAssignment()` | `@academic/assigned-modules` |
| 7 | `lms/gradebook/_server/actions.ts` | `getAssignedModuleByLmsCourseId()` | `@academic/assigned-modules` |
| 8 | `lms/gradebook/_server/actions.ts` | `getStudentsBySemesterModules()` | `@registry/students` |
| 9 | `lms/gradebook/_server/actions.ts` | `getEnrolledStudentsFromDB()` | `@lms/students` |

**Note**: LMS actions also import from `@auth/auth-providers/_server/repository` (direct repository call, not an action) — these do NOT need `unwrap()`.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero new type errors in these action files. Consumer pages may show warnings (fixed in 007b).

## Done When

- [ ] All 26 action files import and use `createAction`
- [ ] All 9 LMS cross-action calls wrapped with `unwrap()`
- [ ] `pnpm tsc --noEmit` passes (or only has warnings in consumer pages fixed in 007b)
