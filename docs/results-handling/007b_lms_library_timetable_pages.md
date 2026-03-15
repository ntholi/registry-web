# Plan 007b: LMS + Library + Timetable — RSC Pages + ListLayout Callers

> Update all RSC pages with `unwrap()` and verify/update ListLayout callers across LMS, library, and timetable modules. **Non-breaking**.

## Prerequisites

- Plan 007a completed (all 26 action files wrapped with `createAction`)

---

## Part A: Update RSC Pages (~19 pages)

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

*Note*: Some LMS pages may not exist as RSC pages (LMS data often flows through client components using TanStack Query). Verify before modifying. Only wrap actual `await actionFn()` calls in server components.

---

## Part B: Verify/Update ListLayout Callers (~11 files)

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

These pass `getData={findAllAction}` directly and should auto-work. Verify each — no code changes expected unless the layout does custom result transformation.

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All ~19 RSC pages with direct `await` calls use `unwrap()`
- [ ] All 11 ListLayout callers verified working
- [ ] `pnpm tsc --noEmit` passes
