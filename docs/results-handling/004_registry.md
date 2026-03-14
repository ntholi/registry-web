# Plan 004: Registry Module

> Migrate the entire `registry/` module end-to-end: wrap actions with `createAction`, update RSC pages with `unwrap()`, verify/update ListLayout callers. **Non-breaking** — all other modules (except already-migrated academic) continue working unchanged.

## Prerequisites

- Plan 001 completed (`createAction`, `unwrap`, `ActionResult<T>`)
- Plan 002 completed (UI components handle both old and new formats)

## Why This Is Non-Breaking

Same as Plan 003 — ListLayout and Form already handle both formats. Unmigrated modules keep working.

---

## Part A: Wrap Action Files (18 files)

Use the same migration template as Plan 003. Key rules:
- Wrap all actions with `createAction`
- **Keep positional params** — `findAll(page, search)` stays as-is
- `export const` for wrapped actions
- No manual `try/catch`

### Action Files

| # | File | Notes |
|---|------|-------|
| 1 | `src/app/registry/terms/_server/actions.ts` | |
| 2 | `src/app/registry/terms/settings/_server/actions.ts` | |
| 3 | `src/app/registry/students/_server/actions.ts` | Large file, many actions |
| 4 | `src/app/registry/student-statuses/_server/actions.ts` | |
| 5 | `src/app/registry/student-notes/_server/actions.ts` | |
| 6 | `src/app/registry/certificates/_server/actions.ts` | |
| 7 | `src/app/registry/graduation/dates/_server/actions.ts` | |
| 8 | `src/app/registry/certificate-reprints/_server/actions.ts` | |
| 9 | `src/app/registry/blocked-students/_server/actions.ts` | |
| 10 | `src/app/registry/documents/_server/actions.ts` | |
| 11 | `src/app/registry/print/transcript/_server/actions.ts` | |
| 12 | `src/app/registry/print/student-card/_server/actions.ts` | |
| 13 | `src/app/registry/print/statement-of-results/_server/actions.ts` | |
| 14 | `src/app/registry/clearance/auto-approve/_server/actions.ts` | |
| 15 | `src/app/registry/registration/requests/_server/actions.ts` | |
| 16 | `src/app/registry/registration/clearance/_server/actions.ts` | |
| 17 | `src/app/registry/graduation/requests/_server/actions.ts` | |
| 18 | `src/app/registry/graduation/clearance/_server/actions.ts` | |

### Special Cases

- **`registry/students/`**: Likely the largest action file. May have complex multi-step actions — wrap the entire body in `createAction`.
- **Actions with `revalidatePath`**: Keep `revalidatePath` calls inside the `createAction` handler.

---

## Part B: Update RSC Pages (~24 pages)

Wrap all direct `await actionFn()` calls with `unwrap()`. See Plan 003 for template.

### RSC Pages

| # | File | Action calls to wrap |
|---|------|---------------------|
| 1 | `src/app/registry/students/[id]/page.tsx` | `getStudent(stdNo)` |
| 2 | `src/app/registry/terms/[code]/page.tsx` | `getTerm(code)` |
| 3 | `src/app/registry/terms/[code]/edit/page.tsx` | `getTerm(code)` |
| 4 | `src/app/registry/student-statuses/[id]/page.tsx` | `getStudentStatus(id)` |
| 5 | `src/app/registry/student-statuses/[id]/edit/page.tsx` | `getStudentStatus(id)` |
| 6 | `src/app/registry/student-notes/[id]/page.tsx` | `getStudentNote(id)` |
| 7 | `src/app/registry/blocked-students/[id]/page.tsx` | `getBlockedStudent(id)` |
| 8 | `src/app/registry/certificate-reprints/[id]/page.tsx` | `getCertificateReprint(id)` |
| 9 | `src/app/registry/certificate-reprints/[id]/edit/page.tsx` | `getCertificateReprint(id)` |
| 10 | `src/app/registry/graduation/dates/[date]/page.tsx` | `getGraduationDate(date)` |
| 11 | `src/app/registry/graduation/dates/[date]/edit/page.tsx` | `getGraduationDate(date)` |
| 12 | `src/app/registry/graduation/requests/[id]/page.tsx` | `getGraduationRequest(id)` |
| 13 | `src/app/registry/registration/requests/[id]/page.tsx` | `getRegistrationRequest(id)` |
| 14 | `src/app/registry/clearance/auto-approve/page.tsx` | Check for direct calls |

*Note*: List pages that only render `{children}` don't need changes. Verify before modifying.

---

## Part C: Verify/Update ListLayout Callers

### Direct References — Verify Only

These pass `getData={findAllAction}` directly and should auto-work:

| # | File |
|---|------|
| 1 | `src/app/registry/terms/layout.tsx` |
| 2 | `src/app/registry/students/layout.tsx` |
| 3 | `src/app/registry/student-statuses/layout.tsx` |
| 4 | `src/app/registry/certificates/layout.tsx` |
| 5 | `src/app/registry/certificate-reprints/layout.tsx` |
| 6 | `src/app/registry/graduation/dates/layout.tsx` |
| 7 | `src/app/registry/graduation/requests/layout.tsx` |

### Arrow Function Wrappers — Must Update

These wrap `getData` with arrow functions using positional params. Since the underlying action's return type changed (now `ActionResult`), the arrow wrapper's return type also changes. ListLayout handles both formats, so these should still work. But verify and update the arrow function if it does any transformation:

| # | File | Notes |
|---|------|-------|
| 8 | `src/app/registry/student-notes/layout.tsx` | Arrow wrapper |
| 9 | `src/app/registry/blocked-students/layout.tsx` | May have inline filtering |
| 10 | `src/app/registry/registration/requests/layout.tsx` | Status filtering |
| 11 | `src/app/registry/registration/clearance/layout.tsx` | Complex multi-step logic |
| 12 | `src/app/registry/graduation/clearance/layout.tsx` | Complex multi-step logic |

**For layouts with complex logic**: If the layout unwraps the action result manually (e.g., destructures `items`, `totalPages`), it needs updating to handle `ActionResult`. Use `isActionResult` + `unwrap` pattern or let ListLayout handle it by passing the raw result through.

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors in registry module files.

## Done When

- [ ] All 18 action files import and use `createAction`
- [ ] All RSC pages with direct `await` calls use `unwrap()`
- [ ] All ListLayout callers verified/updated
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Registry module fully migrated; all other modules still work**
