# Step 001: Database Schema

## Introduction

This is the first step in building the Student Status feature. It establishes the database foundation: two new tables, several enums, relations, and the barrel export update. No backend logic or UI is created in this step.

## Context

The existing codebase already has relevant enums and statuses:
- `studentStatus` enum on `students` table includes `'Withdrawn'`
- `semesterStatus` enum on `studentSemesters` table includes `'Deferred'` and `'Withdrawn'`
- `dashboardUsers` enum for department tracking
- `clearanceRequestStatus` enum (`pending`, `approved`, `rejected`) — a similar pattern to reuse for approval statuses

The new tables will follow the same conventions as `blockedStudents` and `registrationRequests`.

## Requirements

### 1. New Enums

#### `student_status_app_type`

The type of student status change application.

| Value           | Description                                      |
| --------------- | ------------------------------------------------ |
| `withdrawal`    | Student exits permanently                        |
| `deferment`     | Student pauses for a semester (intends to return) |
| `reinstatement` | Student returns after withdrawal or deferment    |

#### `student_status_app_status`

The overall status of the application.

| Value       | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| `pending`   | Application submitted, awaiting approvals                       |
| `approved`  | All required approvals granted (side effects applied)           |
| `rejected`  | At least one approver rejected                                  |
| `cancelled` | Registry/admin cancelled before completion                      |

#### `student_status_justification`

Justification reason for the application.

| Value                | Used By                        |
| -------------------- | ------------------------------ |
| `medical`            | Withdrawal, Deferment          |
| `transfer`           | Withdrawal, Deferment          |
| `financial`          | Withdrawal, Deferment          |
| `employment`         | Withdrawal, Deferment          |
| `after_withdrawal`   | Reinstatement                  |
| `after_deferment`    | Reinstatement                  |
| `failed_modules`     | Reinstatement                  |
| `upgrading`          | Reinstatement                  |
| `other`              | All types                      |

#### `student_status_approval_role`

The role/step that an approval record represents.

| Value              | Who Can Approve                                     | Required For               |
| ------------------ | --------------------------------------------------- | -------------------------- |
| `year_leader`      | Academic role + `year_leader` position               | Withdrawal, Deferment      |
| `program_leader`   | Academic role + `manager` or `program_leader` pos.   | All types                  |
| `student_services` | `student_services` role                              | Withdrawal, Deferment      |
| `finance`          | `finance` role                                       | All types                  |

#### `student_status_approval_status`

The status of an individual approval step.

| Value      | Description                    |
| ---------- | ------------------------------ |
| `pending`  | Not yet responded              |
| `approved` | Approver granted approval      |
| `rejected` | Approver rejected              |

### 2. `student_status_apps` Table

The main application table. One record per application (a student can have multiple over time).

| Column            | Type                               | Constraints                                        | Notes                                          |
| ----------------- | ---------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `id`              | `serial`                           | Primary key                                        |                                                |
| `std_no`          | `bigint`                           | NOT NULL, FK → `students.std_no` (cascade delete)  | The student this application is for            |
| `type`            | `student_status_app_type`          | NOT NULL                                           | withdrawal / deferment / reinstatement         |
| `status`          | `student_status_app_status`        | NOT NULL, default `'pending'`                      | Overall application status                     |
| `justification`   | `student_status_justification`     | NOT NULL                                           | Reason category                                |
| `notes`           | `text`                             |                                                    | Additional free-text notes                     |
| `term_code`       | `text`                             | NOT NULL                                           | The term this application applies to           |
| `semester_id`     | `integer`                          | FK → `student_semesters.id` (set null on delete)   | The specific semester record (**required** for withdrawal/deferment, nullable for reinstatement where student may not have an active semester) |
| `created_by`      | `text`                             | FK → `users.id` (set null on delete)     | The staff user who created the application (nullable only if user is deleted) |
| `created_at`      | `timestamp`                        | Default `now()`                                    |                                                |
| `updated_at`      | `timestamp`                        |                                                    | Updated on status change                       |

**Indexes:**
- `idx_student_status_apps_std_no` on `std_no`
- `idx_student_status_apps_status` on `status`
- `idx_student_status_apps_type` on `type`
- `idx_student_status_apps_term` on `term_code`

**Schema file:** `src/app/registry/student-status/_schema/studentStatusApps.ts`

**Drizzle column naming (camelCase in TS):**
- `id`, `stdNo`, `type`, `status`, `justification`, `notes`, `termCode`, `semesterId`, `createdBy`, `createdAt`, `updatedAt`

### 3. `student_status_approvals` Table

One record per approval step per application. Created when the application is created (pre-populated for all required approval roles).

| Column            | Type                                  | Constraints                                              | Notes                                      |
| ----------------- | ------------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `id`              | `serial`                              | Primary key                                              |                                            |
| `application_id`  | `integer`                             | NOT NULL, FK → `student_status_apps.id` (cascade delete) | Parent application                         |
| `approver_role`   | `student_status_approval_role`        | NOT NULL                                                 | Which approval step this represents        |
| `status`          | `student_status_approval_status`      | NOT NULL, default `'pending'`                            | Current status of this step                |
| `responded_by`    | `text`                                | FK → `users.id` (set null on delete)                     | The user who approved/rejected             |
| `message`         | `text`                                |                                                          | Optional message from approver             |
| `responded_at`    | `timestamp`                           |                                                          | When the response was recorded             |
| `created_at`      | `timestamp`                           | Default `now()`                                          |                                            |

**Constraints:**
- `unique(application_id, approver_role)` — one approval record per role per application

**Indexes:**
- `idx_student_status_approvals_app_id` on `application_id`
- `idx_student_status_approvals_status` on `status`
- `idx_student_status_approvals_role` on `approver_role`

**Schema file:** `src/app/registry/student-status/_schema/studentStatusApprovals.ts`

**Drizzle column naming (camelCase in TS):**
- `id`, `applicationId`, `approverRole`, `status`, `respondedBy`, `message`, `respondedAt`, `createdAt`

### 4. Relations

**File:** `src/app/registry/student-status/_schema/relations.ts`

| Relation                             | Type  | From                      | To                         | Fields/References                              |
| ------------------------------------ | ----- | ------------------------- | -------------------------- | ---------------------------------------------- |
| `studentStatusApps.student`          | one   | `studentStatusApps`       | `students`                 | `stdNo` → `students.stdNo`                     |
| `studentStatusApps.semester`         | one   | `studentStatusApps`       | `studentSemesters`         | `semesterId` → `studentSemesters.id`           |
| `studentStatusApps.creator`          | one   | `studentStatusApps`       | `users`                    | `createdBy` → `users.id`                       |
| `studentStatusApps.approvals`        | many  | `studentStatusApps`       | `studentStatusApprovals`   | —                                              |
| `studentStatusApprovals.application` | one   | `studentStatusApprovals`  | `studentStatusApps`        | `applicationId` → `studentStatusApps.id`       |
| `studentStatusApprovals.responder`   | one   | `studentStatusApprovals`  | `users`                    | `respondedBy` → `users.id`                     |

### 5. Barrel Export Update

**File to update:** `src/app/registry/_database/index.ts`

Add the following re-exports:
```
export * from '../student-status/_schema/studentStatusApps';
export * from '../student-status/_schema/studentStatusApprovals';
export * from '../student-status/_schema/relations';
```

## Expected Files

| File                                                              | Purpose                                   |
| ----------------------------------------------------------------- | ----------------------------------------- |
| `src/app/registry/student-status/_schema/studentStatusApps.ts`    | Main application table + type/status/justification enums |
| `src/app/registry/student-status/_schema/studentStatusApprovals.ts` | Approval step table + approval role/status enums |
| `src/app/registry/student-status/_schema/relations.ts`            | Drizzle relation definitions              |
| `src/app/registry/_database/index.ts`                             | Updated barrel export (add 3 lines)       |

## Post-Step Action

After creating the schema files and updating the barrel export:

```bash
pnpm db:generate
```

This generates the SQL migration file. Do NOT manually create or edit migration files.

## Validation Criteria

1. All four schema-related files exist and export the correct tables/enums
2. `_database/index.ts` re-exports the new schemas
3. `pnpm db:generate` succeeds and creates a migration
4. `pnpm tsc --noEmit` passes with no errors
5. Each enum contains exactly the values specified above
6. Foreign keys and indexes are correctly defined
7. The unique constraint on `(application_id, approver_role)` is present

## Notes

- The `semesterId` column is nullable only for reinstatement applications. Withdrawal and deferment applications **must** have a `semesterId` (enforced at the service layer, Step 2)
- The `createdBy` column is set to nullable to allow `SET NULL` on user deletion without violating constraints
- The `termCode` is stored as text (not an FK to `terms`) to match the existing pattern used by `studentSemesters.termCode`
- Approval records are pre-created when the application is created (Step 2 handles this logic)
- The `createdBy` field tracks which staff member created the application, separate from the student (`stdNo`)
