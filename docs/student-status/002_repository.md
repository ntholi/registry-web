# Step 002: Repository Layer

## Introduction

This step creates the data access layer for the Student Status feature. It implements the `StudentStatusRepository` class with all database queries for both the `student_statuses` and `student_status_approvals` tables. Step 1 (database schema) must be completed first.

## Context

The codebase follows a strict **Repository → Service → Actions** pattern:
- **Repository**: Direct database access, extends `BaseRepository`. The ONLY layer that imports `db`.
- `BaseRepository` provides standard CRUD operations with built-in audit logging via `AuditOptions` and `writeAuditLog`.
- Custom repository methods that bypass base CRUD must use `writeAuditLog` within the same transaction for audit compliance.

Key patterns from existing code:
- `BlockedStudentRepository` as a reference for similar student-linked records
- `BaseRepository` provides `findAll`, `create`, `update`, `delete` with pagination and audit
- `QueryOptions` for paginated list queries with search
- `db.query.*` for relational queries with `with` clauses

## Requirements

### 1. Repository Class

**File:** `src/app/registry/student-statuses/_server/repository.ts`

**Class:** `StudentStatusRepository extends BaseRepository<typeof studentStatuses, 'id'>`

The repository manages both `studentStatuses` and `studentStatusApprovals` tables since they belong to the same feature domain.

### 2. Methods

| Method                           | Parameters                                                           | Returns                                           | Description                                           |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `findById(id)`                   | `id: number`                                                         | Application with student + approvals + semester   | Fetches application with all relations                |
| `query(options)`                 | `QueryOptions<typeof studentStatuses>`                               | Paginated result with student relation            | List view query with search on `stdNo`                |
| `findByStdNo(stdNo, type?)`      | `stdNo: number`, `type?: StudentStatusType`                          | Applications array                                | All applications for a student, optionally filtered   |
| `hasPending(stdNo, type)`        | `stdNo: number`, `type: StudentStatusType`                           | `boolean`                                         | Check if student has pending application of same type |
| `createWithApprovals(data, approvalRoles, audit?)` | `data: StudentStatusInsert`, `approvalRoles: ApprovalRole[]`, `audit?: AuditOptions` | Created application with approvals | Transaction: insert app + approval records            |
| `updateStatus(id, status, audit?)` | `id: number`, `status: StudentStatusStatus`, `audit?: AuditOptions` | Updated application                               | Update application status + `updatedAt`               |
| `respondToApproval(id, data, audit?)` | `id: number`, `data: ApprovalResponse`, `audit?: AuditOptions`   | Updated approval                                  | Set approval status, respondedBy, message, respondedAt |
| `getApprovalsByAppId(appId)`     | `appId: number`                                                      | Approval records array                            | All approval steps for an application                 |
| `findApprovalById(id)`           | `id: number`                                                         | Approval record with application                  | Fetch single approval step with its parent application |
| `findPendingByApproverRole(role, options?)` | `role: ApprovalRole`, `options?: QueryOptions`              | Paginated applications                            | Applications that have a pending approval for the given role |

### 3. Query Details

#### `findById`
Use `db.query.studentStatuses.findFirst` with:
```
with: {
  student: true,
  approvals: { with: { responder: true } },
  semester: true,
  creator: true
}
where: eq(studentStatuses.id, id)
```

#### `query`
Use `db.query.studentStatuses.findMany` with:
- `with: { student: true }`
- Search on `stdNo` column (cast to text for ILIKE search)
- Default sort by `createdAt` descending
- Standard pagination via `limit`/`offset`
- Return `{ items, totalPages, totalItems }` format

#### `findByStdNo`
Use `db.query.studentStatuses.findMany` with:
- `where: eq(studentStatuses.stdNo, stdNo)` (+ optional type filter)
- `with: { approvals: true }`
- Order by `createdAt` descending

#### `hasPending`
Use `db.query.studentStatuses.findFirst` with:
- `where: and(eq(stdNo), eq(type), eq(status, 'pending'))`
- Return `!!result`

#### `createWithApprovals`
Use `db.transaction`:
1. Insert into `studentStatuses` table
2. Insert N records into `studentStatusApprovals` (one per required role, all with `status: 'pending'`)
3. Write audit log via `writeAuditLog(tx, ...)` if audit options provided
4. Return the created application (re-query with `findById` for full relations)

#### `updateStatus`
Use `db.update(studentStatuses)`:
- Set `status` and `updatedAt: new Date()`
- Where `id = id`
- Write audit log if audit options provided

#### `respondToApproval`
Use `db.update(studentStatusApprovals)`:
- Set `status`, `respondedBy`, `message`, `respondedAt: new Date()`
- Where `id = id`
- Write audit log if audit options provided

#### `getApprovalsByAppId`
Use `db.query.studentStatusApprovals.findMany` with:
- `where: eq(studentStatusApprovals.applicationId, appId)`
- `with: { responder: true }`

#### `findApprovalById`
Use `db.query.studentStatusApprovals.findFirst` with:
- `where: eq(studentStatusApprovals.id, id)`
- `with: { application: true }`
- Used by the service's access check function to verify the approval step's role before authorize

#### `findPendingByApproverRole`
Join `studentStatuses` with `studentStatusApprovals` where:
- `studentStatusApprovals.approverRole = role`
- `studentStatusApprovals.status = 'pending'`
- `studentStatuses.status = 'pending'`
- Apply standard pagination and search from `options`

### 4. Type Imports

The repository file imports:
- `studentStatuses`, `studentStatusApprovals` from `@/core/database` (server code CAN import from here)
- `BaseRepository`, `AuditOptions`, `QueryOptions` from `@/core/platform/BaseRepository`
- `db` from `@/core/database`
- `eq`, `and`, `sql`, `count` from `drizzle-orm`

### 5. Audit Compliance

- `createWithApprovals`: Uses `writeAuditLog` within the transaction for the `student_status_created` activity type
- `updateStatus`: Uses `writeAuditLog` for status change activity types
- `respondToApproval`: Uses `writeAuditLog` for approval/rejection activity types
- All audit methods receive `AuditOptions` from the service layer (which provides `userId`)
- The repository NEVER calls `auth()` — `userId` always comes from the service

## Expected Files

| File                                                         | Purpose                                   |
| ------------------------------------------------------------ | ----------------------------------------- |
| `src/app/registry/student-statuses/_server/repository.ts`    | Database queries for apps + approvals     |

## Validation Criteria

1. Repository file exists and compiles
2. Extends `BaseRepository<typeof studentStatuses, 'id'>`
3. All 10 methods are implemented with correct return types
4. `createWithApprovals` uses `db.transaction` for atomicity
5. All write methods accept optional `AuditOptions` and call `writeAuditLog` when provided
6. Repository never imports `auth()` or calls authentication functions
7. `findById` returns full relational data (student, approvals with responders, semester, creator)
8. `findPendingByApproverRole` correctly joins both tables and filters by role + pending status
9. `pnpm tsc --noEmit` passes with no errors

## Notes

- The repository manages both tables (`studentStatuses` and `studentStatusApprovals`) since they are tightly coupled within the same feature
- The `findById` query is the most complex — it powers the detail page and needs all relations loaded in a single query (no N+1)
- The `createWithApprovals` method is critical for data integrity — application and its approval records must be created atomically
- Search in `query` method should cast `stdNo` (bigint) to text for ILIKE pattern matching, similar to how `blockedStudents` handles student number search
