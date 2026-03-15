# Plan 008b: Reports + Student Portal + Audit Logs + Feedback — Actions & Pages

> Wrap the remaining 11 non-apply action files with `createAction` and update their RSC pages + ListLayout callers. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Action Files (11 files)

### Reports (8 files) — Query-only

Still wrap with `createAction` for consistent error handling and logging.

| # | File |
|---|------|
| 1 | `src/app/reports/registry/student-enrollments/progression/_server/actions.ts` |
| 2 | `src/app/reports/registry/student-enrollments/enrollments/_server/actions.ts` |
| 3 | `src/app/reports/registry/student-enrollments/distribution/_server/actions.ts` |
| 4 | `src/app/reports/finance/sponsored-students/_server/actions.ts` |
| 5 | `src/app/reports/registry/graduations/student-graduations/_server/actions.ts` |
| 6 | `src/app/reports/academic/course-summary/_server/actions.ts` |
| 7 | `src/app/reports/academic/boe/_server/actions.ts` |
| 8 | `src/app/reports/academic/attendance/_server/actions.ts` |

### Student Portal (1 file)

| # | File |
|---|------|
| 9 | `src/app/student-portal/fortinet-registration/_server/actions.ts` |

### Audit Logs (1 file)

| # | File |
|---|------|
| 10 | `src/app/audit-logs/_server/actions.ts` |

### Feedback (1 file)

| # | File |
|---|------|
| 11 | `src/app/feedback/_server/actions.ts` |

---

## Part B: Update RSC Pages (~14 pages)

### Apply (verify only — apply wizard pages may consume ActionResult in client components)

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/apply/new/page.tsx` | Check for direct calls |
| 2 | `src/app/apply/welcome/page.tsx` | Check for direct calls |
| 3 | `src/app/apply/courses/page.tsx` | Check for direct calls |

### Reports

| # | File |
|---|------|
| 4 | `src/app/reports/registry/student-enrollments/progression/page.tsx` |
| 5 | `src/app/reports/registry/student-enrollments/enrollments/page.tsx` |
| 6 | `src/app/reports/registry/student-enrollments/distribution/page.tsx` |
| 7 | `src/app/reports/finance/sponsored-students/page.tsx` |
| 8 | `src/app/reports/registry/graduations/student-graduations/page.tsx` |
| 9 | `src/app/reports/academic/course-summary/page.tsx` |
| 10 | `src/app/reports/academic/boe/page.tsx` |
| 11 | `src/app/reports/academic/attendance/page.tsx` |

### Other

| # | File |
|---|------|
| 12 | `src/app/audit-logs/page.tsx` |
| 13 | `src/app/audit-logs/[id]/page.tsx` |
| 14 | `src/app/feedback/page.tsx` |

---

## Part C: Verify/Update ListLayout Callers

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/audit-logs/layout.tsx` | Arrow wrapper — verify auto-works |

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [x] All 11 action files import and use `createAction`
- [x] All RSC pages with direct `await` calls use `unwrap()`
- [x] ListLayout caller in audit-logs verified/updated
- [x] `pnpm tsc --noEmit` passes
