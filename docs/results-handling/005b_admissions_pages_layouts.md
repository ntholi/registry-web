# Plan 005b: Admissions — RSC Pages + ListLayout + Cross-Action Calls

> Update admissions RSC pages with `unwrap()`, verify/update ListLayout callers, and handle the significant cross-action calls within this module. **Non-breaking**.

## Prerequisites

- Plan 005a completed (all 17 admissions action files wrapped with `createAction`)

---

## Part A: Update RSC Pages (~16 pages)

Wrap all direct `await actionFn()` calls with `unwrap()`. See Plan 003 for template.

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

## Part B: Verify/Update ListLayout Callers (~8 files)

### Direct References — Verify Only

| # | File |
|---|------|
| 1 | `src/app/admissions/applicants/layout.tsx` |
| 2 | `src/app/admissions/intake-periods/layout.tsx` |
| 3 | `src/app/admissions/recognized-schools/layout.tsx` |
| 4 | `src/app/admissions/certificate-types/layout.tsx` |
| 5 | `src/app/admissions/documents/layout.tsx` |

### Arrow Function Wrappers / Internal Functions — Must Verify & Update

| # | File | Notes |
|---|------|-------|
| 6 | `src/app/admissions/applications/layout.tsx` | Arrow wrapper with extra params |
| 7 | `src/app/admissions/subjects/layout.tsx` | Internal function declaration |
| 8 | `src/app/admissions/entry-requirements/layout.tsx` | Internal function declaration |

**For arrow wrappers with extra params**: The lambda receives `(page, search)` from ListLayout (positional), calls the action with those plus extra state. The action's return type now wraps in `ActionResult`, but since the lambda passes the result straight to ListLayout and ListLayout handles both formats, this should auto-work. Verify and update only if type errors occur.

---

## Part C: Update Cross-Action Calls (10 call sites)

The admissions module has significant internal cross-action calls between its own sub-features. Since all admissions actions are now wrapped (005a), calls between them need `unwrap()`.

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

**Note**: Add `import { unwrap } from '@/shared/lib/utils/actionResult'` to each file and wrap each cross-action `await` call with `unwrap()`.

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All 5 direct ListLayout callers verified working
- [ ] All 3 arrow-wrapper ListLayout callers verified/updated
- [ ] All 10 cross-action call sites wrapped with `unwrap()`
- [ ] `pnpm tsc --noEmit` passes
