# Plan 007c: LMS + Library + Timetable — Client Component Updates

> Migrate all direct `useMutation` callers to `useActionMutation`. The **LMS module has the highest concentration** of direct `useMutation` callers (~40 components). **Non-breaking**.

## Prerequisites

- Plan 007a completed (all 26 action files wrapped with `createAction`)
- Plan 007b completed (RSC pages and ListLayout callers updated)

---

## Task: Update Direct `useMutation` Callers

This is the **largest client component migration** across all plans. The LMS module alone has ~40 components that use `useMutation` directly with server actions.

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

```bash
grep -rn "useMutation" src/app/lms/ src/app/library/ src/app/timetable/ --include="*.tsx" --include="*.ts" -l
```

### Known LMS Candidates (~40 components)

| # | Area | Likely files |
|---|------|-------------|
| 1 | `lms/quizzes/_components/form/` | QuizForm, QuestionEditor, AnswerEditor |
| 2 | `lms/assignments/_components/form/` | AssignmentForm, SubmissionGrader |
| 3 | `lms/material/_components/` | MaterialUpload, MaterialActions |
| 4 | `lms/posts/_components/` | PostEditor, PostActions |
| 5 | `lms/virtual-classroom/_components/` | SessionControls, AttendanceMarker |
| 6 | `lms/courses/_components/` | CourseActions, ModuleLinker |
| 7 | `lms/gradebook/_components/` | MarksInput, GradeSync |
| 8 | `lms/students/_components/` | EnrollmentActions |
| 9 | `lms/course-outline/_components/` | OutlineEditor |

### Known Timetable Candidates

| # | Area | Likely files |
|---|------|-------------|
| 10 | `timetable/timetable-allocations/_components/` | AddAllocationModal, EditAllocationModal |
| 11 | `timetable/_shared/components/` | AddSlotAllocationModal |

### Known Library Candidates

| # | Area | Likely files |
|---|------|-------------|
| 12 | `library/loans/_components/` | LoanActions, ReturnButton |
| 13 | `library/fines/_components/` | FinePayment |
| 14 | `library/books/_components/` | BookActions |

### What NOT to change

- Components using `Form` component — `Form` already handles `ActionResult`
- Components using `DeleteButton` — `DeleteButton` already handles `ActionResult`
- Components using `useQuery` — read-only, use `select: unwrap` pattern
- LMS components that import from `@auth/auth-providers/_server/repository` directly (not actions)

---

## Verification

```bash
pnpm tsc --noEmit
```

## Done When

- [ ] All direct `useMutation` callers in LMS switched to `useActionMutation` (~40 components)
- [ ] All direct `useMutation` callers in Library switched to `useActionMutation`
- [ ] All direct `useMutation` callers in Timetable switched to `useActionMutation`
- [ ] No remaining `useMutation({ mutationFn: wrappedAction })` patterns in these modules
- [ ] `pnpm tsc --noEmit` passes
- [ ] **LMS + Library + Timetable modules fully migrated; all other modules still work**
