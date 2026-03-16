# Plan 005: Admissions Module

> Wrap **mutation** actions with `createAction`. Query actions stay as plain functions. RSC pages and ListLayout callers require **no changes**. **Non-breaking**.

**Status:** ✅ Completed

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

---

## Part A: Wrap Mutation Actions Only (17 files)

Use the same mutations-only template as Plan 003. Key rules:
- Only mutations get wrapped with `createAction`
- Queries stay as plain `async function` exports
- `export const` for wrapped mutations
- No manual `try/catch`

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
| 12 | `src/app/admissions/reports/program-demand/_server/actions.ts` | **Query-only — skip entirely** |
| 13 | `src/app/admissions/reports/academic-qualifications/_server/actions.ts` | **Query-only — skip entirely** |
| 14 | `src/app/admissions/reports/geographic/_server/actions.ts` | **Query-only — skip entirely** |
| 15 | `src/app/admissions/reports/demographics/_server/actions.ts` | **Query-only — skip entirely** |
| 16 | `src/app/admissions/reports/application-summary/_server/actions.ts` | **Query-only — skip entirely** |
| 17 | (Verify the 17th — possibly `applications/scoring` or similar) |

---

## Part B: RSC Pages — No Changes Needed

Since query actions stay as plain functions, all RSC pages continue calling them with plain `await`. **No `unwrap()` needed.**

---

## Part C: ListLayout Callers — No Changes Needed

Since `findAll*` actions stay as plain functions returning raw data, all ListLayout callers continue working as-is. **No changes needed.**

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

## Part E: Cross-Action Calls (Minimal)

Under the mutations-only strategy, only mutation→mutation cross-calls need `unwrap()`. Calls to query actions need no changes.

| # | File | Cross-action call | Is it a mutation? | Action |
|---|------|------------------|-------------------|--------|
| 1 | `applicants/_server/actions.ts` | `getStudentByUserId()` | No (query) | No change |
| 2 | `applications/_server/actions.ts` | `getOrCreateApplicantForCurrentUser()` | **Yes (mutation)** | Add `unwrap()` |
| 3 | `applications/_server/actions.ts` | `saveApplicantDocument()` | **Yes (mutation)** | Add `unwrap()` |
| 4 | `applications/_server/actions.ts` | `createAcademicRecordFromDocument()` | **Yes (mutation)** | Add `unwrap()` |
| 5 | `applicants/[id]/documents/_server/actions.ts` | `getApplicant()` ×2 | No (query) | No change |
| 6 | `applicants/[id]/documents/_server/actions.ts` | `updateApplicant()` | **Yes (mutation)** | Add `unwrap()` |
| 7 | `applicants/[id]/documents/_server/actions.ts` | `findAllCertificateTypes()` | No (query) | No change |
| 8 | `applicants/[id]/documents/_server/actions.ts` | `findOrCreateSubjectByName()` | **Yes (mutation)** | Add `unwrap()` |
| 9 | `applicants/[id]/documents/_server/actions.ts` | `findAcademicRecordBy*()` | No (query) | No change |
| 10 | `applicants/[id]/documents/_server/actions.ts` | `update/createAcademicRecord()` | **Yes (mutation)** | Add `unwrap()` |
| 11 | `applicants/[id]/academic-records/_server/actions.ts` | `recalculateScoresForApplicant()` | **Yes (mutation)** | Add `unwrap()` |

---

## Verification

```bash
pnpm tsc --noEmit
pnpm lint:fix
```

## Done When

- [x] All mutation actions across ~11 non-report files wrapped with `createAction`
- [x] All query actions remain as plain `async function` exports
- [x] Report action files (5) left completely untouched
- [x] All direct `useMutation` callers switched to `useActionMutation`
- [x] All mutation→mutation cross-action calls wrapped with `unwrap()`
- [x] `pnpm tsc --noEmit` passes
- [x] **Admissions module mutations wrapped; queries/pages/layouts untouched**
