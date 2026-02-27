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
| `findApprovalById(id)`           | `id: number`                                                         | Approval record with application        | Fetch single approval step with its parent application |
| `findPendingByApproverRole(role, options?)` | `role: ApprovalRole`, `options?: QueryOptions` | Paginated applications | Applications that have a pending approval for the given role |

#### Query Details

**`findById`**: Use `db.query.studentStatusApps.findFirst` with:
- `with: { student: true, approvals: { with: { responder: true } }, semester: true, creator: true }`

**`query`**: Use `db.query.studentStatusApps.findMany` with:
- `with: { student: true }`
- Search on `stdNo` column (cast to text for ILIKE search)
- Default sort by `createdAt` descending

**`createWithApprovals`**: Use `db.transaction`:
1. Insert into `studentStatuses`
2. Insert N records into `studentStatusApprovals` (one per required role)
3. Write audit log
4. Return the created application with approvals
**`findApprovalById`**: Use `db.query.studentStatusApprovals.findFirst` with:
- `with: { application: true }`
- Used by the service's access check function to verify the approval step's role before authorize
**`findPendingByApproverRole`**: Join `studentStatuses` with `studentStatusApprovals` where:
- `studentStatusApprovals.approverRole = role`
- `studentStatusApprovals.status = 'pending'`
- `studentStatusApps.status = 'pending'`

### 2. Service (`service.ts`)

**Class:** `StudentStatusService`

The service handles authorization, business rule validation, and orchestrates the approval workflow.

#### Methods

| Method                   | Auth Roles                                        | Description                                                |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------- |
| `get(id)`                | `['dashboard']`                                   | Get single application with all relations                  |
| `getAll(options)`        | `['registry', 'admin']`                           | Paginated list of all applications                         |
| `getByStdNo(stdNo)`      | `['dashboard']`                                   | All applications for a student (history)                   |
| `getPendingForApproval(options)` | Access check function (see below)          | Applications pending the current user's approval role      |
| `countPendingForCurrentUser()` | Access check function                        | Count of pending applications for current user's role (for nav badge) |
| `create(data)`           | `['registry', 'admin']`                           | Create application with pre-populated approvals            |
| `cancel(id)`             | `['registry', 'admin']`                           | Cancel a pending application                               |
| `approve(approvalId)`    | Access check function (see below)                 | Approve a specific approval step                           |
| `reject(approvalId, message?)` | Access check function (see below)           | Reject a step → reject entire application                  |

#### Business Logic

**`create(data)`:**
1. Validate: student exists
2. Validate: no pending application of same type for this student (`hasPending`)
3. For withdrawal/deferment: validate `semesterId` is provided (non-null)
4. For reinstatement: validate student status is `Withdrawn`/`Terminated` OR has a semester with `Deferred`/`Withdrawn` status
5. Determine required approval roles based on type:
   - Withdrawal/Deferment: `['year_leader', 'program_leader', 'student_services', 'finance']`
   - Reinstatement: `['program_leader', 'finance']`
6. Call `createWithApprovals` in a transaction
7. Activity type: `student_status_app_created`

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
  1. Call `StudentService.updateWithReasons(stdNo, { status: 'Withdrawn' }, 'Withdrawal application approved')` — uses the student service for proper audit trail with `student_update` activity type
  2. Call `StudentService.updateStudentSemester(semesterId, { status: 'Withdrawn' }, stdNo, 'Withdrawal application approved')` — resolves `semester_withdrawal` activity type
- If type is `deferment`:
  1. Call `StudentService.updateStudentSemester(semesterId, { status: 'Deferred' }, stdNo, 'Deferment application approved')` — resolves `semester_deferred` activity type
- If type is `reinstatement`:
  1. No automatic changes
- Update application status to `approved` + `updatedAt`

> **Design Decision**: Side effects call `StudentService` methods (not `StudentRepository` directly) to ensure proper activity type resolution (`semester_withdrawal`, `semester_deferred`, `student_update`) and consistent audit trails. This means the student status service imports and instantiates `StudentService` from `@registry/students/_server/service`.

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
| `countPendingStudentStatusApps()`               | `()`                                                                         | `service.countPendingForCurrentUser()`   |

> **Note**: `countPendingStudentStatusApps` is used by the navigation notification badge in `registry.config.ts`. It returns the count of pending applications relevant to the current user's approval role/position. The corresponding service method `countPendingForCurrentUser()` determines the user's approval role from the session and counts matching pending approval records.

### 4. Activity Types

Register the following activity types in the activity catalog (`src/app/admin/activity-tracker/_lib/activity-catalog.ts`):

| Key                              | Label                           | Department   |
| -------------------------------- | ------------------------------- | ------------ |
| `student_status_app_created`     | Student Status App Created      | `registry`   |
| `student_status_app_approved`    | Student Status App Approved     | `registry`   |
| `student_status_app_rejected`    | Student Status App Rejected     | `registry`   |
| `student_status_app_cancelled`   | Student Status App Cancelled    | `registry`   |

### 5. Cross-Module Integration

The `onAllApproved` method needs to update student and semester statuses. This is done by importing and calling existing **service** methods from the students module:

- **Update student status**: Use `StudentService.updateWithReasons(stdNo, { status: 'Withdrawn' }, 'Withdrawal application approved')` — ensures `student_update` activity type audit log
- **Update semester status**: Use `StudentService.updateStudentSemester(id, { status: 'Deferred' }, stdNo, 'Deferment application approved')` — ensures `resolveStudentSemesterActivityType` resolves the correct audit activity type (`semester_deferred`, `semester_withdrawal`)

The student status service should instantiate `StudentService` from `@registry/students/_server/service` and call its methods directly. This is preferred over:
- Using the repository directly (would skip activity type resolution and audit enrichment)
- Calling server actions (would cause redundant re-authentication overhead)

> **Note**: `StudentService.updateWithReasons` and `StudentService.updateStudentSemester` are gated to `['registry', 'admin']` roles. Since `onAllApproved` is called within a `withAuth` context that already verified the approver's role, the service call will run under the session of the final approver. This means the final approver must be either from registry/admin context OR the student service methods need to be refactored to accept a broader auth check. **Recommended approach**: Call `StudentRepository` methods directly with explicit `AuditOptions` that include the correct activity type. This preserves audit accuracy while avoiding auth conflicts:
>
> ```
> // In StudentStatusService.onAllApproved:
> const studentRepo = new StudentRepository();
> await studentRepo.updateStudentWithAudit(stdNo, { status: 'Withdrawn' }, {
>   userId: session.user.id,
>   activityType: 'student_update',
>   stdNo,
>   role: session.user.role,
>   metadata: { reasons: 'Withdrawal application approved' }
> });
> await studentRepo.updateStudentSemester(semesterId, { status: 'Withdrawn' }, {
>   userId: session.user.id,
>   activityType: 'semester_withdrawal',
>   stdNo,
>   role: session.user.role,
>   metadata: { reasons: 'Withdrawal application approved' }
> });
> ```

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
5. Reinstatement creation fails for students who are not Withdrawn/Terminated/Deferred
6. Approving all steps auto-updates student/semester status for withdrawal and deferment
7. Approving all steps does NOT auto-update for reinstatement
8. Any single rejection sets the application status to `rejected`
9. Cancellation only works on `pending` applications
10. Role-based access control is enforced on all methods
11. Audit logs are written for all state changes
12. `pnpm tsc --noEmit` passes with no errors

## Notes

- The repository directly accesses both `studentStatusApps` and `studentStatusApprovals` tables (they belong to the same feature)
- For the `onAllApproved` side effects, import `StudentRepository` directly from `@registry/students/_server/repository` — this is acceptable since it's within the same module (registry). Pass explicit `AuditOptions` with the correct `activityType` to preserve audit accuracy.
- The `getPendingForApproval` method determines the current user's approval role from their session and finds matching pending approvals — this is useful for the approval queue UI
- The `findAllStudentStatusApps` action accepts optional filter parameters for type and status to support filtered list views
- The `findApprovalById` method is essential for the access check function used in `approve` and `reject` methods — it fetches the approval record to determine which `approverRole` the current user must have
