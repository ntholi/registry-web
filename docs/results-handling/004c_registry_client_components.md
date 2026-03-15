# Plan 004c: Registry — Client Component Updates

> Migrate all direct `useMutation` callers in the registry module to `useActionMutation`. **Non-breaking**.

## Prerequisites

- Plan 004a completed (all 18 registry action files wrapped with `createAction`)
- Plan 004b completed (RSC pages and ListLayout callers updated)

---

## Task: Update Direct `useMutation` Callers

Client components in the registry module that use `useMutation({ mutationFn: someAction })` directly (not through `Form` or `DeleteButton`) must switch to `useActionMutation` to handle the new `ActionResult<T>` return type.

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

Search all `_components/` folders in `src/app/registry/` for `useMutation` patterns where the `mutationFn` references a wrapped action. Replace with `useActionMutation`.

**Command**:
```bash
grep -rn "useMutation" src/app/registry/ --include="*.tsx" --include="*.ts" -l
```

### Known Candidates (verify at implementation time)

| # | Area | Likely files |
|---|------|-------------|
| 1 | `registry/students/_components/sponsors/` | EditSponsorModal, SponsorsList, etc. |
| 2 | `registry/students/_components/` | StatusChangeModal, BulkActions, etc. |
| 3 | `registry/student-notes/_components/` | NoteModal, NoteForm, etc. |
| 4 | `registry/student-statuses/_components/` | StatusSwitch, AttachmentUpload, etc. |
| 5 | `registry/certificate-reprints/_components/` | StatusSwitch, ProcessButton, etc. |
| 6 | `registry/registration/` components | RequestActions, ApprovalButtons, etc. |
| 7 | `registry/graduation/` components | RequestActions, ApprovalButtons, etc. |
| 8 | `registry/clearance/` components | ClearanceActions, etc. |

### What NOT to change

- Components using `Form` component — `Form` already handles `ActionResult`
- Components using `DeleteButton` — `DeleteButton` already handles `ActionResult`
- Components using `useQuery` — these are read-only and use `select: unwrap` pattern instead

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors. All registry client components correctly unwrap `ActionResult<T>`.

## Done When

- [ ] All direct `useMutation` callers in registry switched to `useActionMutation`
- [ ] No remaining `useMutation({ mutationFn: registryAction })` patterns
- [ ] `pnpm tsc --noEmit` passes
- [ ] **Registry module fully migrated; all other modules still work**
