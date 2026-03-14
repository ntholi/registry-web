# Plan 007: LMS + Library + Timetable Modules

> Migrate `lms/` (10 actions), `library/` (11 actions), and `timetable/` (5 actions) end-to-end. **Non-breaking**.

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

## Part B: Update RSC Pages (~34 pages)

### Library

| # | File | Action calls to wrap |
|---|------|---------------------|
| 1 | `src/app/library/books/[id]/page.tsx` | `getBook(id)` |
| 2 | `src/app/library/books/[id]/edit/page.tsx` | `getBook(id)` |
| 3 | `src/app/library/authors/[id]/page.tsx` | `getAuthor(id)` |
| 4 | `src/app/library/authors/[id]/edit/page.tsx` | `getAuthor(id)` |
| 5 | `src/app/library/categories/[id]/page.tsx` | `getCategory(id)` |
| 6 | `src/app/library/categories/[id]/edit/page.tsx` | `getCategory(id)` |
| 7 | `src/app/library/loans/[id]/page.tsx` | `getLoan(id)` |
| 8 | `src/app/library/fines/[id]/page.tsx` | `getFine(id)` |
| 9 | `src/app/library/external-libraries/[id]/page.tsx` | `getExternalLibrary(id)` |
| 10 | `src/app/library/external-libraries/[id]/edit/page.tsx` | `getExternalLibrary(id)` |
| 11 | `src/app/library/resources/publications/[id]/page.tsx` | `getPublication(id)` |
| 12 | `src/app/library/resources/publications/[id]/edit/page.tsx` | `getPublication(id)` |
| 13 | `src/app/library/resources/question-papers/[id]/page.tsx` | `getQuestionPaper(id)` |
| 14 | `src/app/library/resources/question-papers/[id]/edit/page.tsx` | `getQuestionPaper(id)` |
| 15 | `src/app/library/catalog/page.tsx` | Check for direct calls |
| 16 | `src/app/library/settings/page.tsx` | Check for direct calls |

### Timetable

| # | File | Action calls to wrap |
|---|------|---------------------|
| 17 | `src/app/timetable/venues/[id]/page.tsx` | `getVenue(id)` |
| 18 | `src/app/timetable/venues/[id]/edit/page.tsx` | `getVenue(id)` |
| 19 | `src/app/timetable/timetable-allocations/page.tsx` | Check for direct calls |

*Note*: Some LMS pages and remaining library/timetable pages may not exist or may not have direct `await` calls. Verify before modifying.

---

## Part C: Verify/Update ListLayout Callers

### Direct References — Verify Only

| # | File |
|---|------|
| 1 | `src/app/timetable/venues/layout.tsx` |
| 2 | `src/app/timetable/venue-types/layout.tsx` |
| 3 | `src/app/timetable/slots/layout.tsx` |
| 4 | `src/app/library/books/layout.tsx` |
| 5 | `src/app/library/authors/layout.tsx` |
| 6 | `src/app/library/categories/layout.tsx` |
| 7 | `src/app/library/loans/layout.tsx` |
| 8 | `src/app/library/fines/layout.tsx` |
| 9 | `src/app/library/external-libraries/layout.tsx` |
| 10 | `src/app/library/resources/publications/layout.tsx` |
| 11 | `src/app/library/resources/question-papers/layout.tsx` |

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All 26 action files import and use `createAction`
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified
- [ ] `pnpm tsc --noEmit` passes
- [ ] **LMS + Library + Timetable modules fully migrated; all other modules still work**
