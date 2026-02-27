# Step 003: Service & Approval Workflow

## Introduction

This step builds the service layer for the Student Status feature. It implements business logic, role-based authorization, the multi-step parallel approval workflow, and automatic side effects when applications are fully approved. Steps 1 (schema) and 2 (repository) must be completed first.

## Context

The codebase uses two service patterns:
- **`BaseService`**: Standard CRUD services that delegate to `BaseRepository` with role-based auth. Used for simple entities.
- **Custom services with `withAuth`**: For complex business logic that goes beyond CRUD. Uses `withAuth(callback, roles)` directly for authorization.

This feature requires a **custom service** because:
- The approval workflow (approve/reject) doesn't map to standard CRUD operations
- Access checks are role+position dependent (not just role-based)
- Side effects (student/semester status updates) on approval are complex
- The `cancel` action differs from standard `delete`

The service uses `serviceWrapper` for consistent logging, matching the project convention.

## Requirements

### 1. Service Class

**File:** `src/app/registry/student-statuses/_server/service.ts`

**Class:** `StudentStatusService`

This is a custom service (does NOT extend `BaseService`) because the approval workflow requires specialized authorization and business logic beyond standard CRUD.

**Exported as:** `studentStatusesService = serviceWrapper(StudentStatusService, 'StudentStatusService')`

### 2. Methods

| Method                                  | Auth Roles                                        | Description                                                |
| --------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `get(id)`                               | `['dashboard']`                                   | Get single application with all relations                  |
| `getAll(options)`                        | `['registry', 'admin']`                           | Paginated list of all applications                         |
| `getByStdNo(stdNo)`                      | `['dashboard']`                                   | All applications for a student (history)                   |
| `getPendingForApproval(options)`          | Access check function (see below)                 | Applications pending the current user's approval role      |
| `countPendingForCurrentUser()`            | Access check function                             | Count of pending applications for current user's role      |
| `create(data)`                           | `['registry', 'admin']`                           | Create application with pre-populated approvals            |
| `cancel(id)`                             | `['registry', 'admin']`                           | Cancel a pending application                               |
| `approve(approvalId)`                    | Access check function (see below)                 | Approve a specific approval step                           |
| `reject(approvalId, message?)`           | Access check function (see below)                 | Reject a step → reject entire application                  |

### 3. Business Logic

#### `create(data)`
1. Validate: student exists (query students table)
2. Validate: no pending application of same type for this student (`repository.hasPending`)
3. For withdrawal/deferment: validate `semesterId` is provided (non-null)
4. For reinstatement: validate student status is `Withdrawn`/`Terminated` OR has a semester with `Deferred`/`Withdrawn` status
5. Determine required approval roles based on type:
   - Withdrawal/Deferment: `['year_leader', 'program_leader', 'student_services', 'finance']`
   - Reinstatement: `['program_leader', 'finance']`
6. Call `repository.createWithApprovals(data, approvalRoles, auditOptions)` — single transaction
7. Activity type: `student_status_created`

#### `approve(approvalId)`
1. Fetch the approval record and its parent application via `repository.findApprovalById(approvalId)`
2. Validate: application is still `pending`
3. Validate: approval step is still `pending`
4. Validate: current user has the correct role/position for this approval step (via access check function)
5. Update the approval record via `repository.respondToApproval(id, { status: 'approved', respondedBy, respondedAt })`
6. Re-fetch all approvals for this application via `repository.getApprovalsByAppId(appId)`
7. Check if ALL approvals are now `approved`
8. If all approved → call `onAllApproved(application)` (private method)
9. Activity type: `student_status_approved`

#### `reject(approvalId, message?)`
1. Same validations as approve (steps 1–4)
2. Update the approval record via `repository.respondToApproval(id, { status: 'rejected', respondedBy, message, respondedAt })`
3. Update the application status to `rejected` via `repository.updateStatus(appId, 'rejected', auditOptions)`
4. Activity type: `student_status_rejected`

#### `cancel(id)`
1. Fetch application via `repository.findById(id)`
2. Validate: application is `pending`
3. Update application status to `cancelled` via `repository.updateStatus(id, 'cancelled', auditOptions)`
4. Activity type: `student_status_cancelled`

#### `onAllApproved(application)` (private method)
Triggered when the last approval step for an application is approved.

- If type is **`withdrawal`**:
  1. Update student status: `students.status → 'Withdrawn'`
  2. Update semester status: `studentSemesters.status → 'Withdrawn'`
- If type is **`deferment`**:
  1. Update semester status: `studentSemesters.status → 'Deferred'`
- If type is **`reinstatement`**:
  1. No automatic changes (registry staff handles reactivation manually)
- In all cases: Update application status to `approved` via `repository.updateStatus(id, 'approved', auditOptions)`

**Side-effect implementation**: Call `StudentRepository` methods directly with explicit `AuditOptions` that include the correct activity type. This preserves audit accuracy while avoiding auth conflicts (since the final approver may not have `registry`/`admin` roles needed by `StudentService`):

```
const studentRepo = new StudentRepository();

// For withdrawal — update student record
await studentRepo.updateStudentWithAudit(stdNo, { status: 'Withdrawn' }, {
  userId: session.user.id,
  activityType: 'student_update',
  stdNo,
  role: session.user.role,
  metadata: { reasons: 'Withdrawal application approved' }
});

// For withdrawal/deferment — update semester record
await studentRepo.updateStudentSemester(semesterId, { status: 'Withdrawn' }, {
  userId: session.user.id,
  activityType: 'semester_withdrawal',
  stdNo,
  role: session.user.role,
  metadata: { reasons: 'Withdrawal application approved' }
});
```

> **Note**: Using `StudentRepository` directly (not `StudentService`) is intentional here. The final approver (e.g., finance role) would fail `StudentService`'s `['registry', 'admin']` auth check. Direct repository access with explicit `AuditOptions` ensures proper audit trails without auth conflicts. This is acceptable because both features live within the same `registry` module.

### 4. Approval Role → Auth Check Mapping

The access check for approval actions maps the `approverRole` on the approval record to session checks:

| `approverRole`     | Session Check                                                         |
| ------------------ | --------------------------------------------------------------------- |
| `year_leader`      | `session.user.role === 'academic' && session.user.position === 'year_leader'` |
| `program_leader`   | `session.user.role === 'academic' && ['manager', 'program_leader'].includes(session.user.position)` |
| `student_services` | `session.user.role === 'student_services'`                            |
| `finance`          | `session.user.role === 'finance'`                                     |

The `approve` and `reject` methods use an access check function passed to `withAuth`:
```
withAuth(async (session) => {
  const approval = await repository.findApprovalById(approvalId);
  if (!approval) throw new Error('Approval step not found');
  if (!canUserApproveRole(session, approval.approverRole)) {
    throw new Error('Unauthorized for this approval step');
  }
  // ... proceed with business logic
}, ['dashboard']);
```

#### Helper: `canUserApproveRole(session, approverRole)`
A private function that implements the mapping table above. Returns `boolean`.

### 5. Authorization Pattern

Each service method uses `withAuth(callback, roles)`:
- **Read methods** (`get`, `getAll`, `getByStdNo`): Use role arrays (`['dashboard']`, `['registry', 'admin']`)
- **Write methods** (`create`, `cancel`): Use role arrays (`['registry', 'admin']`)
- **Approval methods** (`approve`, `reject`, `getPendingForApproval`, `countPendingForCurrentUser`): Use access check functions that verify the user's role AND position match the approval step's `approverRole`

### 6. Determining Current User's Approval Role

For `getPendingForApproval` and `countPendingForCurrentUser`, the service determines which approval role(s) the current user can act on:

```
function getUserApprovalRoles(session): ApprovalRole[] {
  const roles: ApprovalRole[] = [];
  if (session.user.role === 'academic') {
    if (session.user.position === 'year_leader') roles.push('year_leader');
    if (['manager', 'program_leader'].includes(session.user.position)) roles.push('program_leader');
  }
  if (session.user.role === 'student_services') roles.push('student_services');
  if (session.user.role === 'finance') roles.push('finance');
  return roles;
}
```

## Expected Files

| File                                                         | Purpose                                   |
| ------------------------------------------------------------ | ----------------------------------------- |
| `src/app/registry/student-statuses/_server/service.ts`       | Business logic, auth, approval workflow   |

## Validation Criteria

1. Service file exists and compiles
2. All 9 methods are implemented with correct authorization
3. `create` validates: student exists, no duplicate pending, semesterId for W/D, eligibility for reinstatement
4. `approve` correctly checks all 4 preconditions before updating
5. `reject` immediately sets the entire application to `rejected`
6. `cancel` only works on `pending` applications
7. `onAllApproved` correctly triggers side effects for withdrawal and deferment but NOT reinstatement
8. `canUserApproveRole` maps all 4 roles correctly
9. `withAuth` is used for all methods (no unauthenticated access)
10. Audit options include correct activity types for all write operations
11. `pnpm tsc --noEmit` passes with no errors

## Notes

- The service does NOT extend `BaseService` — it is a custom class because the approval workflow doesn't fit BaseService's CRUD pattern
- All write operations pass `AuditOptions` to the repository, ensuring every state change is audited
- The `onAllApproved` method runs within the same request context as the final `approve` call, so the session is available
- For `getPendingForApproval`, a user with `academic` role and `manager` position sees applications with pending `program_leader` approval steps
- The `countPendingForCurrentUser` method is used solely for the navigation badge count — it should be lightweight (single count query)
