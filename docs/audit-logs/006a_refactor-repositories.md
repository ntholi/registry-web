# Step 006a: Refactor Repositories

## Introduction

Refactor all custom repositories to use the unified `writeAuditLog` API instead of manual legacy audit inserts, remove `auth()` calls from repositories, replace legacy audit history methods, and set `auditEnabled = false` on excluded repositories. This step handles all backend/server-side changes.

## Requirements

### 1. Replace Legacy `*WithAudit()` Methods → BaseRepository API

| Old Pattern | New Pattern |
|------------|-------------|
| `updateStudentWithAudit(stdNo, data, userId, reasons)` | `studentRepo.update(stdNo, data, { userId, metadata: { reasons } })` |
| `updateStudentProgramWithAudit(id, data, userId, reasons)` | `studentProgramRepo.update(id, data, { userId, metadata: { reasons } })` |
| `createStudentProgramWithAudit(data, userId)` | `studentProgramRepo.create(data, { userId })` |
| `updateStudentModuleWithAudit(id, data, userId, reasons)` | `studentModuleRepo.update(id, data, { userId, metadata: { reasons } })` |
| `updateStudentSemesterWithAudit(id, data, userId, reasons)` | `studentSemesterRepo.update(id, data, { userId, metadata: { reasons } })` |

### 2. Refactor Custom Repository Methods with Manual Audit Inserts

Replace manual `tx.insert(legacyAudit)` calls with `this.writeAuditLog(tx, ...)`:

**`AssessmentRepository` (`src/app/academic/assessments/_server/repository.ts`)**

These methods currently call `await auth()` inline — after refactoring, `userId` is passed explicitly via an `audit: AuditOptions` parameter from the service layer.

| Method | Current | Replace With |
|--------|---------|--------------|
| `create(data, lmsData?)` | `await auth()` + `tx.insert(assessmentsAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'INSERT', String(assessment.id), null, assessment, audit)` |
| `delete(id)` | `await auth()` + `tx.insert(assessmentsAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'DELETE', String(id), current, null, audit)` |
| `updateWithGradeRecalculation(id, data, lmsData?)` | `await auth()` + `tx.insert(assessmentsAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'UPDATE', String(id), current, assessment, audit)` |

**`AssessmentMarksRepository` (`src/app/academic/assessment-marks/_server/repository.ts`)**

Same pattern — replace `await auth()` + legacy audit insert with `AuditOptions` param + `this.writeAuditLog()`.

| Method | Current | Replace With |
|--------|---------|--------------|
| `create(data)` | `await auth()` + `tx.insert(assessmentMarksAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'INSERT', String(mark.id), null, mark, audit)` |
| `update(id, data)` | `await auth()` + `tx.insert(assessmentMarksAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'UPDATE', String(id), current, mark, audit)` |
| `delete(id)` | `await auth()` + `tx.insert(assessmentMarksAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'DELETE', String(id), current, null, audit)` |
| `createOrUpdateMarks(data)` | `await auth()` + `tx.insert(assessmentMarksAudit)` (×2) | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'INSERT'/'UPDATE', ...)` per branch |
| `createOrUpdateMarksInBulk(dataArray)` | `await auth()` + `tx.insert(assessmentMarksAudit).values(batchAuditEntries)` | Add `audit?: AuditOptions` param; use `this.writeAuditLogBatch(tx, entries, audit)` |

**`ClearanceRepository` (registration) (`src/app/registry/registration/requests/_server/clearance/repository.ts`)**

| Method | Current | Replace With |
|--------|---------|--------------|
| `create(data)` | `await auth()` + `tx.insert(clearanceAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'INSERT', String(clearanceRecord.id), null, clearanceRecord, audit)` with `metadata: { modules: modulesList.map(...) }` |
| `update(id, data)` | `await auth()` + `tx.insert(clearanceAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'UPDATE', String(id), current, clearanceRecord, audit)` with `metadata: { modules: modulesList.map(...) }` |

**`ClearanceRepository` (graduation) (`src/app/registry/graduation/clearance/_server/clearance/repository.ts`)**

| Method | Current | Replace With |
|--------|---------|--------------|
| `create(data)` | `await auth()` + `tx.insert(clearanceAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'INSERT', String(clearanceRecord.id), null, clearanceRecord, audit)` |
| `update(id, data)` | `await auth()` + `tx.insert(clearanceAudit)` | Add `audit?: AuditOptions` param; use `this.writeAuditLog(tx, 'UPDATE', String(id), current, clearanceRecord, audit)` |

> **Note**: The `modules` context data currently stored in `clearance_audit.modules` should be passed as `metadata: { modules: [...] }` in the `AuditOptions`. The service layer needs to construct this metadata before calling the repository.

> **IMPORTANT — ClearanceRepository.create() has internal queries**: The current implementation queries `requestedModules` within its own transaction to get module codes for the audit entry. After migration, this query must remain inside the repository's transaction (it cannot move to the service layer). Instead, use `buildAuditMetadata()` override OR pass the modules list via `audit.metadata` from the service layer (which would require the service to query modules first). The simpler approach: keep the modules query in the repository and use `this.writeAuditLog(tx, 'INSERT', ..., { userId: audit.userId, metadata: { modules: modulesList.map(...), ...audit.metadata } })` — merging repo-level and caller-level metadata.

### 3. Remove `auth()` Calls from Repository Methods

These repositories should NOT call `auth()` directly — userId comes via `AuditOptions` from the service layer:

- `AssessmentRepository.create()`, `.delete()`
- `AssessmentMarksRepository.create()`, `.update()`, `.delete()`
- `ClearanceRepository.create()`, `.update()` (both registration and graduation)

### 4. Replace Legacy `getAuditHistory()` Methods

| Repository | Method | Replacement |
|-----------|--------|-------------|
| `AssessmentRepository` | `getAuditHistory(assessmentId)` | `getRecordHistory('assessments', assessmentId)` |
| `AssessmentMarksRepository` | `getAuditHistory(assessmentMarkId)` | `getRecordHistory('assessment_marks', assessmentMarkId)` |
| `AssessmentMarksRepository` | `getStudentAuditHistory(studentModuleId)` | `getStudentModuleAuditHistory(studentModuleId)` (from Step 005) |
| `StudentAuditLogRepository` | `findByStudentIdWithUser(stdNo)` | `getRecordHistory('students', stdNo)` |

Services and actions that expose these methods (`AssessmentService.getAuditHistory`, `AssessmentMarksService.getStudentAuditHistory`, etc.) must also be updated to call the unified actions instead.

### 5. Set `auditEnabled = false` on Excluded Repositories

For each excluded table (see exclusion list in 000_index.md), locate its repository and add:

```typescript
protected auditEnabled = false;
```

## Validation Criteria

1. `pnpm tsc --noEmit` passes
2. `pnpm lint:fix` passes
3. All CRUD operations work
4. New audit entries appear in `audit_logs` for write operations
5. Assessment/marks/clearance CRUD generates audit entries in the unified table
6. Custom metadata (`reasons`) works for student/module operations
7. Bulk marks update (`createOrUpdateMarksInBulk`) uses batch audit insert
8. No repository calls `auth()` directly for audit purposes
9. Legacy code still exists and compiles (not deleted yet)
