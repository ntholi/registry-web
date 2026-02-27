# Step 004: Server Actions & Integration

## Introduction

This step creates the server action wrappers, type exports, the index re-export file, and registers the new activity types. It also documents the cross-module integration points. Steps 1–3 must be completed first.

## Context

Server actions are `'use server'` functions that serve as thin wrappers around the service layer. They are the ONLY entry point for client-side mutations and data fetching. Each action delegates to the corresponding service method without adding business logic.

The activity catalog (`src/app/admin/activity-tracker/_lib/activity-catalog.ts`) tracks all auditable operations across the application.

## Requirements

### 1. Server Actions (`actions.ts`)

**File:** `src/app/registry/student-statuses/_server/actions.ts`

All actions are `'use server'` functions. Thin wrappers around `studentStatusesService`.

| Action                                             | Signature                                                                    | Service Method                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `getStudentStatus(id)`                             | `(id: number)`                                                               | `studentStatusesService.get(id)`                |
| `findAllStudentStatuses(page, search, filter?)`    | `(page: number, search: string, filter?: { type?, status? })`               | `studentStatusesService.getAll(options)`         |
| `getStudentStatusesByStdNo(stdNo)`                 | `(stdNo: number)`                                                            | `studentStatusesService.getByStdNo(stdNo)`       |
| `createStudentStatus(data)`                        | `(data: StudentStatusInsert)`                                                | `studentStatusesService.create(data)`            |
| `cancelStudentStatus(id)`                          | `(id: number)`                                                               | `studentStatusesService.cancel(id)`              |
| `approveStudentStatusStep(approvalId)`             | `(approvalId: number)`                                                       | `studentStatusesService.approve(approvalId)`     |
| `rejectStudentStatusStep(approvalId, message?)`    | `(approvalId: number, message?: string)`                                     | `studentStatusesService.reject(approvalId, message)` |
| `getPendingApprovals(page, search)`                | `(page: number, search: string)`                                             | `studentStatusesService.getPendingForApproval(options)` |
| `countPendingStudentStatuses()`                    | `()`                                                                         | `studentStatusesService.countPendingForCurrentUser()`   |

> **Note**: `countPendingStudentStatuses` is used by the navigation notification badge in `registry.config.ts`. It returns the count of pending applications relevant to the current user's approval role/position.

### 2. Types (`_lib/types.ts`)

**File:** `src/app/registry/student-statuses/_lib/types.ts`

Export types derived from the Drizzle schema:

| Type                     | Definition                                         |
| ------------------------ | -------------------------------------------------- |
| `StudentStatus`          | `typeof studentStatuses.$inferSelect`              |
| `StudentStatusInsert`    | `typeof studentStatuses.$inferInsert`              |
| `StudentStatusApproval`  | `typeof studentStatusApprovals.$inferSelect`       |

Import from `@/core/database` (types files are server-side, allowed to import from core).

### 3. Index Re-exports (`index.ts`)

**File:** `src/app/registry/student-statuses/index.ts`

```
export { default as Form } from './_components/Form';
export * from './_lib/types';
export * from './_server/actions';
```

### 4. Activity Types

**File to update:** `src/app/admin/activity-tracker/_lib/activity-catalog.ts`

Register the following activity types:

| Key                           | Label                          | Department   |
| ----------------------------- | ------------------------------ | ------------ |
| `student_status_created`      | Student Status Created         | `registry`   |
| `student_status_approved`     | Student Status Approved        | `registry`   |
| `student_status_rejected`     | Student Status Rejected        | `registry`   |
| `student_status_cancelled`    | Student Status Cancelled       | `registry`   |

### 5. Cross-Module Integration Points

This section documents the integration points with other modules. These are consumed by the service layer (Step 3) and the UI (Step 5).

#### Student Module (`@registry/students/`)
- **`StudentRepository`**: Used by `onAllApproved` to update student/semester status with explicit `AuditOptions`
  - `updateStudentWithAudit(stdNo, data, audit)` — updates student record
  - `updateStudentSemester(semesterId, data, audit)` — updates semester record
- **Import path**: `@registry/students/_server/repository`

#### Active Term (`@registry/terms/`)
- **`getActiveTerm()`**: Used by the Form component to auto-fill the term code
- **Import path**: `@registry/terms/_server/actions`

#### Student Data
- **Student lookup**: The Form uses `StdNoInput` (from `src/app/dashboard/base/StdNoInput.tsx`) for student number search and auto-fill
- **Student semesters**: The Form queries student semesters for the selected term to auto-detect `semesterId`

## Expected Files

| File                                                         | Purpose                                   |
| ------------------------------------------------------------ | ----------------------------------------- |
| `src/app/registry/student-statuses/_server/actions.ts`       | Server action wrappers                    |
| `src/app/registry/student-statuses/_lib/types.ts`            | Type exports                              |
| `src/app/registry/student-statuses/index.ts`                 | Re-exports of public actions and types    |
| `src/app/admin/activity-tracker/_lib/activity-catalog.ts`    | Updated with 4 new activity types         |

## Validation Criteria

1. All action functions are exported with `'use server'` directive
2. Actions are thin wrappers — no business logic in actions
3. Types file exports `StudentStatus`, `StudentStatusInsert`, and `StudentStatusApproval`
4. Index file re-exports Form, types, and actions
5. Activity catalog includes all 4 new activity types with correct keys and labels
6. All activity types use `registry` as the department
7. `pnpm tsc --noEmit` passes with no errors

## Notes

- The `findAllStudentStatuses` action accepts optional filter parameters (`type` and `status`) to support filtered list views in the UI
- The `countPendingStudentStatuses` action determines the user's approval role from the session and counts matching pending approval records — this powers the nav badge
- Actions import the service via `studentStatusesService` (the `serviceWrapper`-wrapped instance)
- The types file imports from `@/core/database` which is allowed for server-side type files
