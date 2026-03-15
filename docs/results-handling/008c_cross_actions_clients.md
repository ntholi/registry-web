# Plan 008c: Apply/Reports — Cross-Action Calls + Client Components

> Handle the ~24 cross-action calls in the apply wizard and reports modules, plus migrate any remaining direct `useMutation` callers. **Non-breaking**.

## Prerequisites

- Plan 008a completed (apply actions converted to `createAction`)
- Plan 008b completed (remaining action files wrapped, RSC pages updated)
- Plans 004a–007a completed (all called actions from other modules already wrapped)

## Why This Is Separate

The `apply/` wizard has the **most cross-action calls in the entire codebase** (~22+ call sites) spanning 6 action files. These calls reach into admissions, registry, and other modules that should already be wrapped by this point. This task requires careful attention to ensure every cross-module `await` call is wrapped with `unwrap()`.

---

## Part A: Update Cross-Action Calls in Apply Wizard (~22 call sites)

### Migration Template

```ts
// BEFORE (inside createAction handler)
const applicant = await getApplicant(id);

// AFTER
const applicant = unwrap(await getApplicant(id));
```

### Cross-Action Calls

| # | File | Cross-action call | Import source |
|---|------|------------------|---------------|
| 1 | `review/_server/actions.ts` | `getApplicant()` | `@admissions/applicants` |
| 2 | `review/_server/actions.ts` | `findApplicationsByApplicant()` | `@admissions/applications` |
| 3 | `review/_server/actions.ts` | `changeApplicationStatus()` | `@admissions/applications` |
| 4 | `program/_server/actions.ts` | `getEligibleProgramsForApplicant()` | `@admissions/applicants` |
| 5 | `program/_server/actions.ts` | `findApplicationsByApplicant()` | `@admissions/applications` |
| 6 | `program/_server/actions.ts` | `findActiveIntakePeriod()` | `@admissions/intake-periods/_server/actions` |
| 7 | `program/_server/actions.ts` | `getOpenProgramIds()` | `@admissions/intake-periods/_server/actions` |
| 8 | `qualifications/_server/actions.ts` | `getOrCreateApplicantForCurrentUser()` | `@admissions/applicants` |
| 9 | `qualifications/_server/actions.ts` | `findCertificateTypeByName()` | `@admissions/applicants/_server/document-actions` |
| 10 | `qualifications/_server/actions.ts` | `getApplication()` | `@admissions/applications` |
| 11 | `qualifications/_server/actions.ts` | `getStudentByUserId()` | `@registry/students` |
| 12 | `qualifications/_server/actions.ts` | `createAcademicRecord()` | `@admissions/applicants/[id]/academic-records/_server/actions` |
| 13 | `qualifications/_server/actions.ts` | `createAcademicRecordFromDocument()` | `@admissions/applicants/[id]/documents/_server/actions` |
| 14 | `qualifications/_server/actions.ts` | `deleteAcademicRecord()` | `@admissions/applicants/[id]/academic-records/_server/actions` |
| 15 | `identity/_server/actions.ts` | `getApplicant()` | `@admissions/applicants` |
| 16 | `identity/_server/actions.ts` | `findDocumentsByType()` | `@admissions/applicants/[id]/documents/_server/actions` |
| 17 | `identity/_server/actions.ts` | `saveApplicantDocument()` | `@admissions/applicants/[id]/documents/_server/actions` |
| 18 | `identity/_server/actions.ts` | `updateApplicantFromIdentity()` | `@admissions/applicants/_server/actions` |
| 19 | `identity/_server/actions.ts` | `deleteApplicantDocument()` | `@admissions/applicants/[id]/documents/_server/actions` |
| 20 | `personal-info/_server/actions.ts` | `updateApplicant()` | `@admissions/applicants` |
| 21 | `payment/_server/actions.ts` | `getApplicant()` | `@admissions/applicants` |
| 22 | `payment/_server/actions.ts` | `getApplicationForPayment()` | `@admissions/applications` |

---

## Part B: Update Cross-Action Calls in Reports (2 call sites)

| # | File | Cross-action call | Import source |
|---|------|------------------|---------------|
| 23 | `reports/registry/student-enrollments/enrollments/_server/actions.ts` | `getAllSponsors()` | `@finance/sponsors/_server/actions` |
| 24 | `reports/registry/graduations/student-graduations/_server/actions.ts` | `getAllSponsors()` | `@finance/sponsors/_server/actions` |

---

## Part C: Update Direct `useMutation` Callers

Search for remaining direct `useMutation` callers in apply, reports, student-portal, audit-logs, and feedback modules.

```bash
grep -rn "useMutation" src/app/apply/ src/app/reports/ src/app/student-portal/ src/app/audit-logs/ src/app/feedback/ --include="*.tsx" --include="*.ts" -l
```

Known candidates:
- Apply wizard client components (step forms that use mutations)
- Student portal components (Fortinet registration form)

---

## Verification

```bash
pnpm tsc --noEmit
```

After this plan completes, **all action files across the entire codebase should be wrapped**, all cross-action calls should use `unwrap()`, and all direct `useMutation` callers should use `useActionMutation`.

## Done When

- [ ] All 22 apply wizard cross-action calls wrapped with `unwrap()`
- [ ] All 2 reports cross-action calls wrapped with `unwrap()`
- [ ] All direct `useMutation` callers in apply/reports/portal/audit-logs/feedback switched to `useActionMutation`
- [ ] `pnpm tsc --noEmit` passes
- [ ] **All modules fully migrated; entire codebase uses new pattern**
