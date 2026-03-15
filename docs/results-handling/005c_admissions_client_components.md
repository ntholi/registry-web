# Plan 005c: Admissions — Client Component Updates

> Migrate all direct `useMutation` callers in the admissions module to `useActionMutation`. **Non-breaking**.

## Prerequisites

- Plan 005a completed (all 17 admissions action files wrapped with `createAction`)
- Plan 005b completed (RSC pages, ListLayout callers, and cross-action calls updated)

---

## Task: Update Direct `useMutation` Callers

Client components in the admissions module that use `useMutation({ mutationFn: someAction })` directly must switch to `useActionMutation`.

### Migration Template

```ts
// BEFORE
import { useMutation } from '@tanstack/react-query';
import { updateThing } from '../_server/actions';

const mutation = useMutation({
  mutationFn: updateThing,
  onSuccess: (data) => { /* data was T */ },
  onError: (error) => { /* fired on throws */ },
});

// AFTER
import { useActionMutation } from '@/shared/lib/hooks/use-action-mutation';
import { updateThing } from '../_server/actions';

const mutation = useActionMutation(updateThing, {
  onSuccess: (data) => { /* data is T (unwrapped) */ },
  onError: (error) => { /* fires on ActionResult failure */ },
});
```

### Discovery

Search all `_components/` folders in `src/app/admissions/` for `useMutation` patterns:

```bash
grep -rn "useMutation" src/app/admissions/ --include="*.tsx" --include="*.ts" -l
```

### Known Candidates (verify at implementation time)

| # | Area | Likely files |
|---|------|-------------|
| 1 | `admissions/applicants/[id]/_components/` | CreateApplicationModal, AcademicRecordsTab |
| 2 | `admissions/payments/_components/` | VerifyDepositModal, PaymentActions |
| 3 | `admissions/entry-requirements/_components/` | EditRequirementsList |
| 4 | `admissions/applications/_components/` | StatusChangeButton, ScoringPanel |

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [x] All direct `useMutation` callers in admissions switched to `useActionMutation`
- [x] No remaining `useMutation({ mutationFn: admissionsAction })` patterns
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Admissions module fully migrated; all other modules still work**
