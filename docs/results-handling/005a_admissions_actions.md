# Plan 005a: Admissions — Wrap Action Files

> Wrap all 17 admissions action files with `createAction`. **Non-breaking**.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

Same as previous plans — ListLayout and Form already handle both formats. Unmigrated modules keep working.

---

## Wrap Action Files (17 files)

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

- **Reports actions** (#12–16): Query-only, but still wrap with `createAction` for consistent error handling and logging.
- **`applicants/[id]/*`** (#2–3): Nested actions within a dynamic route — same wrapping pattern.
- **Verify action count**: Confirm exact count at implementation time. The 17th file may be in a sub-route not listed above.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero new type errors in admissions action files. Consumer pages may show warnings (fixed in 005b).

## Done When

- [ ] All 17 action files import and use `createAction`
- [ ] No manual `try/catch` in any admissions action file
- [ ] `pnpm tsc --noEmit` passes (or only has warnings in RSC pages/layouts fixed in 005b)
