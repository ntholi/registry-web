# Step 006: Cleanup

## Introduction

Remove all legacy audit code paths, tables, and schemas. After this step, the entire audit system is driven by `BaseRepository` — no per-feature audit code exists.

## Requirements

### 1. Remove Legacy Audit Schemas

Delete these files:

| File | Table |
|------|-------|
| `src/app/audit-logs/students/_schema/studentAuditLogs.ts` | `student_audit_logs` |
| `src/app/audit-logs/students/_schema/relations.ts` | Relations |
| `src/app/audit-logs/student-programs/_schema/studentProgramAuditLogs.ts` | `student_program_audit_logs` |
| `src/app/audit-logs/student-programs/_schema/relations.ts` | Relations |
| `src/app/audit-logs/student-semesters/_schema/studentSemesterAuditLogs.ts` | `student_semester_audit_logs` |
| `src/app/audit-logs/student-semesters/_schema/relations.ts` | Relations |
| `src/app/audit-logs/student-modules/_schema/studentModuleAuditLogs.ts` | `student_module_audit_logs` |
| `src/app/audit-logs/student-modules/_schema/relations.ts` | Relations |
| `src/app/academic/assessments/_schema/assessmentsAudit.ts` | `assessments_audit` |
| `src/app/academic/assessments/_schema/assessmentMarksAudit.ts` | `assessment_marks_audit` |
| `src/app/registry/clearance/_schema/clearanceAudit.ts` | `clearance_audit` |

### 2. Remove Legacy Repositories, Services, and Actions

Delete all files under:

- `src/app/audit-logs/students/_server/`
- `src/app/audit-logs/student-programs/_server/`
- `src/app/audit-logs/student-semesters/_server/`
- `src/app/audit-logs/student-modules/_server/`

### 3. Remove Legacy Components

Delete:

- `src/app/audit-logs/students/_components/`
- `src/app/audit-logs/student-programs/_components/`
- `src/app/audit-logs/student-semesters/_components/`
- `src/app/audit-logs/student-modules/_components/`

### 4. Update References

#### 4a. Legacy `*WithAudit()` Methods → BaseRepository API

| Old Pattern | New Pattern |
|------------|-------------|
| `updateStudentWithAudit(stdNo, data, userId, reasons)` | `studentRepo.update(stdNo, data, { userId, metadata: { reasons } })` |
| `updateStudentProgramWithAudit(id, data, userId, reasons)` | `studentProgramRepo.update(id, data, { userId, metadata: { reasons } })` |
| `createStudentProgramWithAudit(data, userId)` | `studentProgramRepo.create(data, { userId })` |
| `updateStudentModuleWithAudit(id, data, userId, reasons)` | `studentModuleRepo.update(id, data, { userId, metadata: { reasons } })` |
| `updateStudentSemesterWithAudit(id, data, userId, reasons)` | `studentSemesterRepo.update(id, data, { userId, metadata: { reasons } })` |

#### 4b. Custom Repository Methods with Manual Audit Inserts

These repositories override `create`/`update`/`delete` or have custom methods that manually insert into legacy audit tables. Replace the manual `tx.insert(legacyAudit)` calls with `this.writeAuditLog(tx, ...)`:

**`AssessmentRepository` (`src/app/academic/assessments/_server/repository.ts`)**

| Method | Current | Replace With |
|--------|---------|--------------|
| `create()` | `tx.insert(assessmentsAudit).values({...})` | `this.writeAuditLog(tx, 'INSERT', String(assessment.id), null, assessment, { userId: session.user.id })` |
| `delete()` | `tx.insert(assessmentsAudit).values({...})` | `this.writeAuditLog(tx, 'DELETE', String(id), current, null, { userId: session.user.id })` |
| `updateWithGradeRecalculation()` | `tx.insert(assessmentsAudit).values({...})` | `this.writeAuditLog(tx, 'UPDATE', String(id), current, assessment, { userId: session.user.id })` |

**`AssessmentMarksRepository` (`src/app/academic/assessment-marks/_server/repository.ts`)**

| Method | Current | Replace With |
|--------|---------|--------------|
| `create()` | `tx.insert(assessmentMarksAudit).values({...})` | `this.writeAuditLog(tx, 'INSERT', String(mark.id), null, mark, { userId: session.user.id })` |
| `update()` | `tx.insert(assessmentMarksAudit).values({...})` | `this.writeAuditLog(tx, 'UPDATE', String(id), current, mark, { userId: session.user.id })` |
| `delete()` | `tx.insert(assessmentMarksAudit).values({...})` | `this.writeAuditLog(tx, 'DELETE', String(id), current, null, { userId: session.user.id })` |
| `createOrUpdateMarks()` | `tx.insert(assessmentMarksAudit).values({...})` (×2) | `this.writeAuditLog(tx, 'INSERT'/'UPDATE', ...)` per branch |
| `createOrUpdateMarksInBulk()` | `tx.insert(assessmentMarksAudit).values(batchAuditEntries)` | `this.writeAuditLogBatch(tx, entries, { userId: session.user.id })` |

**`ClearanceRepository` (registration) (`src/app/registry/registration/requests/_server/clearance/repository.ts`)**

| Method | Current | Replace With |
|--------|---------|--------------|
| `create()` | `tx.insert(clearanceAudit).values({...})` | `this.writeAuditLog(tx, 'INSERT', String(clearanceRecord.id), null, clearanceRecord, { userId: session.user.id, metadata: { modules: modulesList.map(...) } })` |
| `update()` | `tx.insert(clearanceAudit).values({...})` | `this.writeAuditLog(tx, 'UPDATE', String(id), current, clearanceRecord, { userId: session.user.id, metadata: { modules: modulesList.map(...) } })` |

**`ClearanceRepository` (graduation) (`src/app/registry/graduation/clearance/_server/clearance/repository.ts`)**

| Method | Current | Replace With |
|--------|---------|--------------|
| `create()` | `tx.insert(clearanceAudit).values({...})` | `this.writeAuditLog(tx, 'INSERT', String(clearanceRecord.id), null, clearanceRecord, { userId: session.user.id })` |
| `update()` | `tx.insert(clearanceAudit).values({...})` | `this.writeAuditLog(tx, 'UPDATE', String(id), current, clearanceRecord, { userId: session.user.id })` |

#### 4c. Remove `auth()` Calls from Repository Methods

After migration, these repositories should NOT call `auth()` directly — session/userId should be threaded via `AuditOptions` from the service layer (or stored as a class property). This is a cleanup opportunity:

- `AssessmentRepository.create()` — currently calls `await auth()` inline
- `AssessmentRepository.delete()` — currently calls `await auth()` inline
- `AssessmentMarksRepository.create()` — currently calls `await auth()` inline
- `AssessmentMarksRepository.update()` — currently calls `await auth()` inline
- `AssessmentMarksRepository.delete()` — currently calls `await auth()` inline
- `ClearanceRepository.create()` — currently calls `await auth()` inline
- `ClearanceRepository.update()` — currently calls `await auth()` inline

**These `auth()` calls violate the architecture rule** (repositories should not know about sessions). After this refactor, the userId is passed via `AuditOptions` from the service layer.

### 5. Update Barrel Exports

**`src/app/audit-logs/_database/index.ts`:**
- Remove exports for all legacy schema files
- Keep only `auditLogs` and `auditLogsRelations`

**`src/app/academic/_database/index.ts`:**
- Remove exports for `assessmentsAudit` and `assessmentMarksAudit`

**`src/app/registry/_database/index.ts`:**
- Remove export for `clearanceAudit` (if present)

### 6. Remove `operationType` pgEnum

The `operationType` enum defined in `studentSemesterAuditLogs.ts` is no longer used. Generate a migration to drop it.

### 7. Drop Legacy Tables

Create a custom migration (`pnpm db:generate --custom`):

```sql
DROP TABLE IF EXISTS student_audit_logs CASCADE;
DROP TABLE IF EXISTS student_program_audit_logs CASCADE;
DROP TABLE IF EXISTS student_semester_audit_logs CASCADE;
DROP TABLE IF EXISTS student_module_audit_logs CASCADE;
DROP TABLE IF EXISTS assessments_audit CASCADE;
DROP TABLE IF EXISTS assessment_marks_audit CASCADE;
DROP TABLE IF EXISTS clearance_audit CASCADE;
DROP TYPE IF EXISTS operation_type CASCADE;
DROP TYPE IF EXISTS assessments_audit_action CASCADE;
DROP TYPE IF EXISTS assessment_marks_audit_action CASCADE;
```

### 8. Deprecate `AuditHistoryTab` Component

`AuditHistoryTab.tsx` is replaced by `RecordAuditHistory.tsx` (Step 005).

**Migration steps:**
1. Verify all usages of `AuditHistoryTab` are replaced by `RecordAuditHistory`
2. Confirm `getChangedFields`, `formatValue`, `formatFieldName` were extracted to `src/app/audit-logs/_lib/audit-utils.ts` (Step 005)
3. Delete `src/app/audit-logs/_components/AuditHistoryTab.tsx`
4. Update any imports that reference it

### 9. Set `auditEnabled = false` on Excluded Repositories

For each excluded table, locate its repository and add/confirm:

```typescript
protected auditEnabled = false;
```

Repositories to update (see exclusion list in 000_index.md).

### 10. Remove Legacy `getAuditHistory()` Methods

These repositories have custom `getAuditHistory()` methods that query legacy audit tables. Replace them with the unified `getRecordHistory(tableName, recordId)` action from Step 005:

| Repository | Method | Replacement |
|-----------|--------|-------------|
| `AssessmentRepository` | `getAuditHistory(assessmentId)` | `getRecordHistory('assessments', assessmentId)` |
| `AssessmentMarksRepository` | `getAuditHistory(assessmentMarkId)` | `getRecordHistory('assessment_marks', assessmentMarkId)` |
| `StudentAuditLogRepository` | `findByStudentIdWithUser(stdNo)` | `getRecordHistory('students', stdNo)` |

### 11. Remove Legacy Imports

Remove all imports of legacy audit schemas from repository files:

- `import { assessmentsAudit } from '...'` in `AssessmentRepository`
- `import { assessmentMarksAudit } from '...'` in `AssessmentMarksRepository`
- `import { clearanceAudit } from '...'` in both `ClearanceRepository` files
- `import { studentAuditLogs } from '...'` in `StudentAuditLogRepository`

## Validation Criteria

1. `pnpm tsc --noEmit` passes with zero errors
2. `pnpm lint:fix` passes
3. No imports reference deleted files
4. No imports reference legacy audit schemas (`assessmentsAudit`, `assessmentMarksAudit`, `clearanceAudit`, `studentAuditLogs`, etc.)
5. No repository calls `auth()` directly for audit purposes — userId comes via `AuditOptions`
6. Legacy tables are dropped from the database
7. All CRUD operations across the app still work
8. New audit entries appear in `audit_logs` for write operations
9. Assessment create/update/delete generates audit entries in unified table
10. Assessment marks create/update/delete generates audit entries in unified table
11. Clearance status changes generate audit entries in unified table
12. Both migrated historical data and new entries appear in the audit UI
13. Custom metadata (`reasons`) works for student/module operations
14. Bulk marks update (`createOrUpdateMarksInBulk`) uses batch audit insert

## Notes

- This step should be the last implemented and thoroughly tested
- Consider keeping a database backup before the DROP migration
- After cleanup, adding audit to any new entity is automatic — just extend `BaseRepository`
- No per-feature audit code is needed going forward
