# Plan 005: Admissions Module

> Migrate the entire `admissions/` module end-to-end: wrap actions with `createAction`, update RSC pages with `unwrap()`, verify/update ListLayout callers. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Action Files (17 files)

Use the same migration template as Plan 003.

### Action Files

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/admissions/applicants/_server/actions.ts` | |
| 2 | `src/app/admissions/applicants/[id]/academic-records/_server/actions.ts` | |
| 3 | `src/app/admissions/applicants/[id]/documents/_server/actions.ts` | |
| 4 | `src/app/admissions/subjects/_server/actions.ts` | |
| 5 | `src/app/admissions/entry-requirements/_server/actions.ts` | |
| 6 | `src/app/admissions/recognized-schools/_server/actions.ts` | |
| 7 | `src/app/admissions/applications/_server/actions.ts` | |
| 8 | `src/app/admissions/payments/_server/actions.ts` | |
| 9 | `src/app/admissions/intake-periods/_server/actions.ts` | |
| 10 | `src/app/admissions/certificate-types/_server/actions.ts` | |
| 11 | `src/app/admissions/documents/_server/actions.ts` | |
| 12 | `src/app/admissions/reports/program-demand/_server/actions.ts` | Query-only |
| 13 | `src/app/admissions/reports/academic-qualifications/_server/actions.ts` | Query-only |
| 14 | `src/app/admissions/reports/geographic/_server/actions.ts` | Query-only |
| 15 | `src/app/admissions/reports/demographics/_server/actions.ts` | Query-only |
| 16 | `src/app/admissions/reports/application-summary/_server/actions.ts` | Query-only |
| 17 | (Verify the 17th — possibly `applications/scoring` or similar) |

### Special Cases

- **Reports actions**: Query-only, but still wrap with `createAction` for consistent error handling and logging.
- **`applicants/[id]/*`**: Nested actions within a dynamic route — same wrapping pattern.

---

## Part B: Update RSC Pages (~16 pages)

### RSC Pages

| # | File | Action calls to wrap |
|---|------|---------------------|
| 1 | `src/app/admissions/applicants/[id]/page.tsx` | `getApplicant(id)` |
| 2 | `src/app/admissions/applicants/[id]/edit/page.tsx` | `getApplicant(id)` |
| 3 | `src/app/admissions/subjects/[id]/page.tsx` | `getSubject(id)` |
| 4 | `src/app/admissions/subjects/[id]/edit/page.tsx` | `getSubject(id)` |
| 5 | `src/app/admissions/applications/[id]/page.tsx` | `getApplication(id)` |
| 6 | `src/app/admissions/applications/[id]/edit/page.tsx` | `getApplication(id)` |
| 7 | `src/app/admissions/intake-periods/[id]/page.tsx` | `getIntakePeriod(id)` |
| 8 | `src/app/admissions/intake-periods/[id]/edit/page.tsx` | `getIntakePeriod(id)` |
| 9 | `src/app/admissions/recognized-schools/[id]/page.tsx` | `getRecognizedSchool(id)` |
| 10 | `src/app/admissions/recognized-schools/[id]/edit/page.tsx` | `getRecognizedSchool(id)` |

*Note*: List pages and report pages may not have direct `await` calls — verify before modifying.

---

## Part C: Verify/Update ListLayout Callers

### Direct References — Verify Only

| # | File |
|---|------|
| 1 | `src/app/admissions/applicants/layout.tsx` |
| 2 | `src/app/admissions/intake-periods/layout.tsx` |
| 3 | `src/app/admissions/recognized-schools/layout.tsx` |
| 4 | `src/app/admissions/certificate-types/layout.tsx` |
| 5 | `src/app/admissions/documents/layout.tsx` |

### Arrow Function Wrappers / Internal Functions — Must Update

| # | File | Notes |
|---|------|-------|
| 6 | `src/app/admissions/applications/layout.tsx` | Arrow wrapper with extra params |
| 7 | `src/app/admissions/subjects/layout.tsx` | Internal function declaration |
| 8 | `src/app/admissions/entry-requirements/layout.tsx` | Internal function declaration |

**For arrow wrappers with extra params**: The lambda receives `(page, search)` from ListLayout (positional), calls the action with those plus extra state. The action's return type now wraps in `ActionResult`, but since the lambda passes the result straight to ListLayout and ListLayout handles both formats, this should auto-work. Verify and update only if type errors occur.

---

## Part D: Update Direct `useMutation` Callers

Client components in the admissions module that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Discovery

Search all `_components/` folders in `src/app/admissions/` for `useMutation({ mutationFn:` patterns.

Known candidates:
- `src/app/admissions/applicants/[id]/_components/` (CreateApplicationModal, AcademicRecordsTab)
- `src/app/admissions/payments/_components/` (VerifyDepositModal)
- `src/app/admissions/entry-requirements/_components/` (EditRequirementsList)

---

## Part E: Update Cross-Action Calls

The admissions module has significant internal cross-action calls. Wrap each with `unwrap()`. See Plan 003 for template.

### Cross-Action Calls in Admissions Module

| # | File | Cross-action call | Import source |
|---|------|------------------|---------------|
| 1 | `applicants/_server/actions.ts` | `getStudentByUserId()` | `@registry/students` |
| 2 | `applications/_server/actions.ts` | `getOrCreateApplicantForCurrentUser()` | `@admissions/applicants` |
| 3 | `applications/_server/actions.ts` | `saveApplicantDocument()` | `@admissions/applicants/[id]/documents/_server/actions` |
| 4 | `applications/_server/actions.ts` | `createAcademicRecordFromDocument()` | `@admissions/applicants/[id]/documents/_server/actions` |
| 5 | `applicants/[id]/documents/_server/actions.ts` | `getApplicant()` ×2 | `@admissions/applicants` |
| 6 | `applicants/[id]/documents/_server/actions.ts` | `updateApplicant()` | `@admissions/applicants` |
| 7 | `applicants/[id]/documents/_server/actions.ts` | `findAllCertificateTypes()` | `@admissions/certificate-types` |
| 8 | `applicants/[id]/documents/_server/actions.ts` | `findOrCreateSubjectByName()` | `@admissions/subjects` |
| 9 | `applicants/[id]/documents/_server/actions.ts` | `findAcademicRecordBy*()`, `update/createAcademicRecord()` | academic-records actions |
| 10 | `applicants/[id]/academic-records/_server/actions.ts` | `recalculateScoresForApplicant()` | `@admissions/applications/_server/actions` |

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All 17 action files import and use `createAction`
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified/updated
- [ ] All direct `useMutation` callers switched to `useActionMutation`
- [ ] All cross-action calls wrapped with `unwrap()`
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Admissions module fully migrated; all other modules still work**
