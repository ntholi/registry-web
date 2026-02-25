# Step 002: Backend Logic

## Introduction

This step builds the repository, service, and server actions for the Student Status feature. It implements the application CRUD, multi-step parallel approval workflow, and automatic side effects (status updates on approval). Step 1 (database schema) must be completed first.

## Context

The codebase follows a strict **Repository → Service → Actions** pattern:
- **Repository**: Direct database access, extends `BaseRepository`. Only file that imports `db`.
- **Service**: Business logic + authorization via `withAuth`. Uses `serviceWrapper` for logging.
- **Actions**: `'use server'` functions that delegate to the service. Thin wrappers.

Key patterns from existing code:
- `BlockedStudentRepository` / `BlockedStudentService` as a reference for similar student-linked records
- `withAuth(callback, roles)` for role-based access control
- `AuditOptions` for audit logging with activity types
- `QueryOptions` for paginated list queries with search

## Requirements

### 1. Repository (`repository.ts`)

**Class:** `StudentStatusAppRepository extends BaseRepository<typeof studentStatusApps, 'id'>`

#### Methods

| Method                           | Parameters                                                           | Returns                                 | Description                                           |
| -------------------------------- | -------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `findById(id)`                   | `id: number`                                                         | Application with student + approvals    | Fetches application with all relations                |
| `query(options)`                 | `QueryOptions<typeof studentStatusApps>`                             | Paginated result with student relation  | List view query with search on `stdNo`                |
| `findByStdNo(stdNo, type?)`      | `stdNo: number`, `type?: AppType`                                    | Applications array                      | All applications for a student, optionally filtered   |
| `hasPending(stdNo, type)`        | `stdNo: number`, `type: AppType`                                     | `boolean`                               | Check if student has pending application of same type |
| `createWithApprovals(data, approvalRoles, audit?)` | `data: AppInsert`, `approvalRoles: ApprovalRole[]`, `audit?: AuditOptions` | Created application with approvals      | Transaction: insert app + approval records            |
| `updateStatus(id, status, audit?)` | `id: number`, `status: AppStatus`, `audit?: AuditOptions`           | Updated application                     | Update application status + `updatedAt`               |
| `respondToApproval(id, data, audit?)` | `id: number`, `data: ApprovalResponse`, `audit?: AuditOptions`   | Updated approval                        | Set approval status, respondedBy, message, respondedAt |
| `getApprovalsByAppId(appId)`     | `appId: number`                                                      | Approval records array                  | All approval steps for an application                 |
| `findPendingByApproverRole(role, options?)` | `role: ApprovalRole`, `options?: QueryOptions` | Paginated applications | Applications that have a pending approval for the given role |

#### Query Details

**`findById`**: Use `db.query.studentStatusApps.findFirst` with:
- `with: { student: true, approvals: { with: { responder: true } }, semester: true, creator: true }`

**`query`**: Use `db.query.studentStatusApps.findMany` with:
- `with: { student: true }`
- Search on `stdNo` column (cast to text for ILIKE search)
- Default sort by `createdAt` descending

**`createWithApprovals`**: Use `db.transaction`:
1. Insert into `studentStatusApps`
2. Insert N records into `studentStatusApprovals` (one per required role)
3. Write audit log
4. Return the created application with approvals

**`findPendingByApproverRole`**: Join `studentStatusApps` with `studentStatusApprovals` where:
- `studentStatusApprovals.approverRole = role`
- `studentStatusApprovals.status = 'pending'`
- `studentStatusApps.status = 'pending'`

### 2. Service (`service.ts`)

**Class:** `StudentStatusAppService`

The service handles authorization, business rule validation, and orchestrates the approval workflow.

#### Methods

| Method                   | Auth Roles                                        | Description                                                |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------- |
| `get(id)`                | `['dashboard']`                                   | Get single application with all relations                  |
| `getAll(options)`        | `['registry', 'admin']`                           | Paginated list of all applications                         |
| `getByStdNo(stdNo)`      | `['dashboard']`                                   | All applications for a student (history)                   |
| `getPendingForApproval(options)` | Access check function (see below)          | Applications pending the current user's approval role      |
| `create(data)`           | `['registry', 'admin']`                           | Create application with pre-populated approvals            |
| `cancel(id)`             | `['registry', 'admin']`                           | Cancel a pending application                               |
| `approve(approvalId)`    | Access check function (see below)                 | Approve a specific approval step                           |
| `reject(approvalId, message?)` | Access check function (see below)           | Reject a step → reject entire application                  |

#### Business Logic

**`create(data)`:**
1. Validate: student exists
2. Validate: no pending application of same type for this student (`hasPending`)
3. For reinstatement: validate student status is `Withdrawn` OR has a semester with `Deferred`/`Withdrawn` status
4. Determine required approval roles based on type:
   - Withdrawal/Deferment: `['year_leader', 'program_leader', 'student_services', 'finance']`
   - Reinstatement: `['program_leader', 'finance']`
5. Call `createWithApprovals` in a transaction
6. Activity type: `student_status_app_created`

**`approve(approvalId)`:**
1. Fetch the approval record and its parent application
2. Validate: application is still `pending`
3. Validate: approval step is still `pending`
4. Validate: current user has the correct role/position for this approval step
5. Update the approval record: `status = 'approved'`, `respondedBy`, `respondedAt`
6. Check if ALL approvals for this application are now `approved`
7. If all approved → call `onAllApproved(application)`
8. Activity type: `student_status_app_approved`

**`reject(approvalId, message?)`:**
1. Same validations as approve
2. Update the approval record: `status = 'rejected'`, `respondedBy`, `message`, `respondedAt`
3. Update the application status to `rejected` + `updatedAt`
4. Activity type: `student_status_app_rejected`

**`cancel(id)`:**
1. Validate: application is `pending`
2. Update application status to `cancelled` + `updatedAt`
3. Activity type: `student_status_app_cancelled`

**`onAllApproved(application)` (private):**
- If type is `withdrawal`:
  1. Update `students.status` to `Withdrawn` (via student service/repository)
  2. Update the linked `studentSemesters` record status to `Withdrawn`
- If type is `deferment`:
  1. Update the linked `studentSemesters` record status to `Deferred`
- If type is `reinstatement`:
  1. No automatic changes
- Update application status to `approved` + `updatedAt`

#### Approval Role → Auth Check Mapping

The access check for approval actions maps the `approverRole` on the approval record to session checks:

| `approverRole`     | Session Check                                                         |
| ------------------ | --------------------------------------------------------------------- |
| `year_leader`      | `session.user.role === 'academic' && session.user.position === 'year_leader'` |
| `program_leader`   | `session.user.role === 'academic' && ['manager', 'program_leader'].includes(session.user.position)` |
| `student_services` | `session.user.role === 'student_services'`                            |
| `finance`          | `session.user.role === 'finance'`                                     |

The `approve` and `reject` methods use an access check function:
```
async (session) => {
  const approval = await repository.findApprovalById(approvalId);
  return canUserApproveRole(session, approval.approverRole);
}
```

### 3. Actions (`actions.ts`)

All actions are `'use server'` functions. Thin wrappers around the service.

| Action                                          | Signature                                                                    | Service Method                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| `getStudentStatusApp(id)`                       | `(id: number)`                                                               | `service.get(id)`                  |
| `findAllStudentStatusApps(page, search, filter?)` | `(page: number, search: string, filter?: { type?, status? })`              | `service.getAll(options)`          |
| `getStudentStatusAppsByStdNo(stdNo)`            | `(stdNo: number)`                                                            | `service.getByStdNo(stdNo)`        |
| `createStudentStatusApp(data)`                  | `(data: AppInsert)`                                                          | `service.create(data)`             |
| `cancelStudentStatusApp(id)`                    | `(id: number)`                                                               | `service.cancel(id)`               |
| `approveStudentStatusStep(approvalId)`          | `(approvalId: number)`                                                       | `service.approve(approvalId)`      |
| `rejectStudentStatusStep(approvalId, message?)` | `(approvalId: number, message?: string)`                                     | `service.reject(approvalId, message)` |
| `getPendingApprovals(page, search)`             | `(page: number, search: string)`                                             | `service.getPendingForApproval(options)` |

### 4. Activity Types

Register the following activity types in the activity catalog (`src/app/admin/activity-tracker/_lib/activity-catalog.ts`):

| Key                              | Label                           | Department   |
| -------------------------------- | ------------------------------- | ------------ |
| `student_status_app_created`     | Student Status App Created      | `registry`   |
| `student_status_app_approved`    | Student Status App Approved     | `registry`   |
| `student_status_app_rejected`    | Student Status App Rejected     | `registry`   |
| `student_status_app_cancelled`   | Student Status App Cancelled    | `registry`   |

### 5. Cross-Module Integration

The `onAllApproved` method needs to update student and semester statuses. This should be done by importing and calling existing actions/service methods from the students module:

- **Update student status**: Use `StudentRepository.update(stdNo, { status: 'Withdrawn' })` — the student service already has `updateWithReasons(stdNo, data, reasons)`
- **Update semester status**: Use `StudentRepository.updateStudentSemester(id, { status: 'Deferred' })` — already exists

The student status service should import and use the existing student repository methods for these updates rather than accessing the database directly. This can be done by:
1. Instantiating `StudentRepository` inside `StudentStatusAppService`, OR
2. Importing and calling the student service actions

Option 1 is preferred to avoid the overhead of re-authenticating via the action layer.

## Expected Files

| File                                                         | Purpose                                   |
| ------------------------------------------------------------ | ----------------------------------------- |
| `src/app/registry/student-status/_server/repository.ts`     | Database queries for apps + approvals     |
| `src/app/registry/student-status/_server/service.ts`        | Business logic, auth, approval workflow   |
| `src/app/registry/student-status/_server/actions.ts`        | Server action wrappers                    |
| `src/app/registry/student-status/index.ts`                  | Re-exports of public actions              |
| `src/app/admin/activity-tracker/_lib/activity-catalog.ts`   | Updated with 4 new activity types         |

## Validation Criteria

1. All three `_server/` files exist and compile
2. `index.ts` re-exports the key actions
3. Creating an application also creates the correct approval records (4 for withdrawal/deferment, 2 for reinstatement)
4. Attempting to create a duplicate pending application of the same type for the same student throws an error
5. Reinstatement creation fails for students who are not Withdrawn/Deferred
6. Approving all steps auto-updates student/semester status for withdrawal and deferment
7. Approving all steps does NOT auto-update for reinstatement
8. Any single rejection sets the application status to `rejected`
9. Cancellation only works on `pending` applications
10. Role-based access control is enforced on all methods
11. Audit logs are written for all state changes
12. `pnpm tsc --noEmit` passes with no errors

## Notes

- The repository directly accesses both `studentStatusApps` and `studentStatusApprovals` tables (they belong to the same feature)
- For the `onAllApproved` side effects, import `StudentRepository` directly from `@registry/students/_server/repository` — this is acceptable since it's within the same module (registry)
- The `getPendingForApproval` method determines the current user's approval role from their session and finds matching pending approvals — this is useful for the approval queue UI
- The `findAllStudentStatusApps` action accepts optional filter parameters for type and status to support filtered list views
