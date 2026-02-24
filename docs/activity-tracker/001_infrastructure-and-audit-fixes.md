# Step 1: Infrastructure & Audit Gap Fixes

This step adds the `activity_type` column, updates the audit plumbing (BaseRepository + BaseService), and fixes **every** service that currently skips audit logging. This is the foundation — Phase 2 cannot work until every write operation produces an audit record.

---

## 1.1 Add `activityType` column to `audit_logs` schema

In `src/core/database/schema/auditLogs.ts`, add a nullable `text` column `activity_type`. Add indexes:

- `idx_audit_logs_activity_type` on `(activity_type)`
- `idx_audit_logs_user_activity` on `(changedBy, activity_type, changedAt)` for efficient grouping queries
- `idx_audit_logs_changed_at_user` on `(changedAt, changedBy)` with `WHERE activity_type IS NOT NULL` for date-window + user analytics queries

```typescript
activityType: text('activity_type'),
```

Add indexes to the table's third argument:

```typescript
index('idx_audit_logs_activity_type').on(table.activityType),
index('idx_audit_logs_user_activity').on(table.changedBy, table.activityType, table.changedAt),
```

Run `pnpm db:generate` to create the migration.

---

## 1.1.1 Add canonical activity catalog scaffold (single source of truth)

Create `src/app/admin/activity-tracker/_lib/activity-catalog.ts` and make it the only owner of activity identifiers.

Catalog contents:

1. `ACTIVITY_CATALOG` as `as const` object containing label + department + optional fallback mapping metadata
2. `type ActivityType = keyof typeof ACTIVITY_CATALOG`
3. `isActivityType(value: string): value is ActivityType`
4. `getActivityLabel(activityType: string)` fallback helper
5. Optional mapping helper for backfill generation (`tableName + operation + status -> activityType`)

All service configs in later steps should import values from this catalog (or derived constants), not duplicate raw string literals.

---

## 1.2 Add `activityType` to `AuditOptions` interface

In `src/core/platform/BaseRepository.ts`, extend the `AuditOptions` interface:

```typescript
export interface AuditOptions {
  userId: string;
  metadata?: Record<string, unknown>;
  activityType?: string;
}
```

---

## 1.3 Update `writeAuditLog()` to persist `activityType`

In `src/core/platform/BaseRepository.ts`, update `writeAuditLog()`:

```typescript
protected async writeAuditLog(
  tx: TransactionClient,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: string,
  oldValues: unknown,
  newValues: unknown,
  audit: AuditOptions
): Promise<void> {
  const meta = {
    ...this.buildAuditMetadata(operation, oldValues, newValues),
    ...audit.metadata,
  };

  await tx.insert(auditLogs).values({
    tableName: this.getTableName(),
    recordId,
    operation,
    oldValues: oldValues ?? null,
    newValues: newValues ?? null,
    changedBy: audit.userId,
    metadata: Object.keys(meta).length > 0 ? meta : null,
    activityType: audit.activityType ?? null,   // <-- ADD THIS
  });
}
```

---

## 1.4 Update `writeAuditLogBatch()` to persist `activityType`

Same file, update `writeAuditLogBatch()`:

```typescript
const values = entries.map((entry) => {
  const meta = {
    ...this.buildAuditMetadata(entry.operation, entry.oldValues, entry.newValues),
    ...audit.metadata,
  };
  return {
    tableName,
    recordId: entry.recordId,
    operation: entry.operation,
    oldValues: entry.oldValues ?? null,
    newValues: entry.newValues ?? null,
    changedBy: audit.userId,
    metadata: Object.keys(meta).length > 0 ? meta : null,
    activityType: audit.activityType ?? null,   // <-- ADD THIS
  };
});
```

---

## 1.5 Add `activityTypes` config to `BaseService`

In `src/core/platform/BaseService.ts`, add an `activityTypes` map to the config and update `buildAuditOptions()` to accept an operation parameter. This lets BaseService-based services declare activity types once in the constructor, with zero boilerplate per-method:

```typescript
interface BaseServiceConfig {
  byIdRoles?: AuthConfig;
  findAllRoles?: AuthConfig;
  createRoles?: AuthConfig;
  updateRoles?: AuthConfig;
  deleteRoles?: AuthConfig;
  countRoles?: AuthConfig;
  activityTypes?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}
```

Store the config:

```typescript
private activityTypes?: BaseServiceConfig['activityTypes'];

constructor(
  protected readonly repository: BaseRepository<T, PK>,
  config: BaseServiceConfig = {}
) {
  // ... existing role assignments ...
  this.activityTypes = config.activityTypes;
}
```

Update `buildAuditOptions()`:

```typescript
protected buildAuditOptions(
  session?: Session | null,
  operation?: 'create' | 'update' | 'delete'
): AuditOptions | undefined {
  if (!session?.user?.id) return undefined;
  return {
    userId: session.user.id,
    activityType: operation ? this.activityTypes?.[operation] : undefined,
  };
}
```

Update `create()`, `update()`, `delete()` to pass the operation:

```typescript
async create(data: ModelInsert<T>) {
  const roles = this.createRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session, 'create');
    return this.repository.create(data, audit);
  }, roles as Role[]);
}

async update(id: ModelSelect<T>[PK], data: Partial<ModelInsert<T>>) {
  const roles = this.updateRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session, 'update');
    return this.repository.update(id, data, audit);
  }, roles as Role[]);
}

async delete(id: ModelSelect<T>[PK]) {
  const roles = this.deleteRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session, 'delete');
    return this.repository.delete(id, audit);
  }, roles as Role[]);
}
```

---

## 1.6 Enable audit on print tables

Set `auditEnabled = true` (or remove the `= false` override) in:

- `src/app/registry/print/transcript/_server/repository.ts`
- `src/app/registry/print/statement-of-results/_server/repository.ts`
- `src/app/registry/print/student-card/_server/repository.ts`

---

## 1.7 Refactor `StudentRepository` — Replace direct `auditLogs` inserts

The `StudentRepository` has **4 methods** that directly call `tx.insert(auditLogs).values({...})` instead of using the inherited `writeAuditLog()`. This means they bypass the `activityType` field entirely. Refactor them:

### `updateStudentProgram()` (line ~642)

Replace:
```typescript
await tx.insert(auditLogs).values({
  tableName: 'student_programs',
  recordId: String(id),
  operation: 'UPDATE',
  oldValues: old,
  newValues: updated,
  changedBy: audit.userId,
  metadata: audit.metadata ?? null,
});
```

With:
```typescript
await this.writeAuditLog(tx, 'UPDATE', String(id), old, updated, audit);
```

**Important**: `writeAuditLog` uses `this.getTableName()` which returns the table from the constructor (`students`), not `student_programs`. Since these methods operate on different tables, create a helper or write the audit entry using the same pattern but include `activityType`:

```typescript
await tx.insert(auditLogs).values({
  tableName: 'student_programs',
  recordId: String(id),
  operation: 'UPDATE',
  oldValues: old,
  newValues: updated,
  changedBy: audit.userId,
  metadata: audit.metadata ?? null,
  activityType: audit.activityType ?? null,   // <-- ADD THIS
});
```

Apply the same fix to:
- `createStudentProgram()` (line ~675) — add `activityType: audit.activityType ?? null`
- `updateStudentSemester()` (line ~709) — add `activityType: audit.activityType ?? null`
- `updateStudentModule()` (line ~742) — add `activityType: audit.activityType ?? null`

---

## 1.8 Fix ALL services that don't pass audit options

Every service that calls `this.repository.create/update/delete()` without passing audit options produces **no audit record**. These must all be fixed to pass `{ userId: session.user.id }` (or use `buildAuditOptions(session)`).

### Category A: Custom services (not extending BaseService) — Need session-based audit

Each service below needs its write methods updated to pass audit options. Pattern:

```typescript
// BEFORE (broken — no audit)
async create(data: Entity) {
  return withAuth(async () => this.repository.create(data), ['role']);
}

// AFTER (fixed — passes audit)
async create(data: Entity) {
  return withAuth(async (session) => {
    return this.repository.create(data, {
      userId: session!.user!.id!,
    });
  }, ['role']);
}
```

#### Registry Module

| Service | File | Methods to Fix |
|---------|------|----------------|
| `StudentService` | `src/app/registry/students/_server/service.ts` | `create()`, `update()` — currently call repo without audit |
| `RegistrationRequestService` | `src/app/registry/registration/requests/_server/requests/service.ts` | `createWithModules()`, `updateWithModules()`, `delete()` — the repository methods themselves need audit added (see 1.9) |
| `TranscriptPrintsService` | `src/app/registry/print/transcript/_server/service.ts` | `create()` — pass audit |
| `StatementOfResultsPrintsService` | `src/app/registry/print/statement-of-results/_server/service.ts` | `create()` — pass audit |
| `StudentCardPrintService` | `src/app/registry/print/student-card/_server/service.ts` | `create()`, `createWithReceipt()` — pass audit; `createWithReceipt` also needs manual audit log in its transaction |
| `BlockedStudentService` | `src/app/registry/blocked-students/_server/service.ts` | `create()`, `update()`, `delete()`, `bulkCreate()` |
| `DocumentService` | `src/app/registry/documents/_server/service.ts` | `create()`, `delete()` — custom repo methods also need audit wiring |
| `GraduationRequestService` | `src/app/registry/graduation/clearance/_server/requests/service.ts` | `create()`, `createWithPaymentReceipts()`, `update()` |
| `AutoApprovalService` | `src/app/registry/registration/clearance/auto-approve/_server/service.ts` | `create()`, `update()`, `delete()` |
| `TermSettingsService` | `src/app/registry/terms/settings/_server/service.ts` | `updateResultsPublished()`, `updateGradebookAccess()`, `updateRegistrationAccess()` — custom repo methods also need audit |
| `CertificateReprintsService` | `src/app/registry/certificate-reprints/_server/service.ts` | Check and fix write methods |

#### Academic Module

| Service | File | Methods to Fix |
|---------|------|----------------|
| `SchoolService` | `src/app/academic/schools/_server/service.ts` | Has NO create/update/delete methods. Add them if schools can be created via UI, otherwise remove `school_created`/`school_updated` from the activity type registry |
| `AttendanceService` | `src/app/academic/attendance/_server/service.ts` | `markAttendance()` → `upsertAttendance()` — repo method needs audit |
| `AssignedModuleService` | `src/app/academic/assigned-modules/_server/service.ts` | `delete()`, `assignModulesToLecturer()` |
| `StructureService` | `src/app/academic/schools/structures/_server/service.ts` | `createStructureSemester()` — custom repo call, check audit |

#### Finance Module

| Service | File | Methods to Fix |
|---------|------|----------------|
| `SponsorService` | `src/app/finance/sponsors/_server/service.ts` | `create()`, `update()`, `delete()`, `updateStudentSponsorship()` |

#### Admin Module

| Service | File | Methods to Fix |
|---------|------|----------------|
| `UserService` | `src/app/admin/users/_server/service.ts` | `create()`, `update()`, `delete()`, `updateUserSchools()` |
| `TaskService` | `src/app/admin/tasks/_server/service.ts` | All write methods |
| `NotificationService` | `src/app/admin/notifications/_server/service.ts` | `create()`, `update()`, `delete()` |

### Category B: BaseService-extending services with overridden methods that skip audit

These services extend BaseService but override `create()`/`update()` without calling `super.create()` and without passing audit:

| Service | File | Methods to Fix |
|---------|------|----------------|
| `ApplicantService` | `src/app/admissions/applicants/_server/service.ts` | `create()` and `update()` override — bypass audit by calling `this.repo.create(data)` directly. Fix: pass `this.buildAuditOptions(session, 'create')` |
| `AssessmentService` | `src/app/academic/assessments/_server/service.ts` | `create()` override — already passes audit ✓ |
| `PaymentReceiptService` | `src/app/finance/payment-receipts/_server/service.ts` | Check `createMany()` — may skip audit |

### Category C: Custom repository methods that bypass audit

These repositories have custom write methods (transactions) that don't call `writeAuditLog`:

| Repository | File | Methods |
|-----------|------|---------|
| `RegistrationRequestRepository` | `src/app/registry/registration/requests/_server/requests/repository.ts` | `createWithModules()`, `updateWithModules()`, `softDelete()` — add `writeAuditLog` or accept `AuditOptions` |
| `LoanRepository` | `src/app/library/loans/_server/repository.ts` | `createLoan()`, `processReturn()`, `renewLoan()` — add audit to transactions |
| `DocumentRepository` | `src/app/registry/documents/_server/repository.ts` | `createWithDocument()`, `removeById()` — add audit |
| `AttendanceRepository` | `src/app/academic/attendance/_server/repository.ts` | `upsertAttendance()` — add audit |
| `TermSettingsRepository` | `src/app/registry/terms/settings/_server/repository.ts` | `updateResultsPublished()`, `updateGradebookAccess()` — add audit |

For each custom repository method:
1. Add `audit?: AuditOptions` parameter
2. Inside the transaction, call `this.writeAuditLog(tx, operation, recordId, old, new, audit)` if audit is provided
3. Note: Some methods operate on foreign tables (not the repo's own table). For these, use direct `tx.insert(auditLogs).values({...})` with the correct `tableName` and include `activityType: audit?.activityType ?? null`

---

## 1.9 Fix `RegistrationRequestRepository` — Critical gap

The `createWithModules()` method is a complex transaction that creates registration requests, sponsored students, student semesters, student modules, requested modules, and receipts — but produces **zero** audit records. This is the most important workflow in the system.

Add `audit?: AuditOptions` parameter and add audit logging for the primary entity:

```typescript
async createWithModules(data: {...}, audit?: AuditOptions) {
  return db.transaction(async (tx) => {
    // ... existing logic ...
    
    // After creating the registration request:
    if (audit) {
      await tx.insert(auditLogs).values({
        tableName: 'registration_requests',
        recordId: String(request.id),
        operation: 'INSERT',
        oldValues: null,
        newValues: request,
        changedBy: audit.userId,
        metadata: audit.metadata ?? null,
        activityType: audit.activityType ?? null,
      });
    }
    
    // ... rest of logic ...
  });
}
```

Similarly fix `softDelete()` to accept audit options and log the deletion.

Update the service to pass audit:
```typescript
async createWithModules(data: {...}) {
  return withAuth(async (session) => {
    return this.repository.createWithModules(data, {
      userId: session!.user!.id!,
    });
  }, ...);
}
```

---

## Verification

After completing this step:

1. Run `pnpm db:generate` → verify migration creates `activity_type` column and indexes
2. Run `pnpm db:migrate`
3. Run `pnpm tsc --noEmit & pnpm lint:fix` → fix all type errors
4. Manually test: perform a few actions → verify audit records appear for previously-unaudited operations (registration request, sponsor create, blocked student, etc.)
5. Verify: `SELECT count(*) FROM audit_logs WHERE changed_at > NOW() - INTERVAL '1 hour'` shows records for operations that were previously silent
