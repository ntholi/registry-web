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

### 1a. Remove Legacy Audit Relations

These relation definitions reference legacy audit schemas and must be removed:

| File | Relations to Remove |
|------|--------------------|
| `src/app/academic/assessments/_schema/relations.ts` | Remove `assessmentsAuditRelations`, `assessmentMarksAuditRelations`, and the `audits: many(assessmentsAudit)` field from `assessmentsRelations`, and `audits: many(assessmentMarksAudit)` field from `assessmentMarksRelations` |
| `src/app/registry/clearance/_schema/relations.ts` | Remove `clearanceAuditRelations` and the `audits: many(clearanceAudit)` field from `clearanceRelations` |

> **IMPORTANT**: Only remove the audit-related relations and imports. Keep all other relations intact in these files.

### 1b. Update Test Mocks

`src/test/mocks.db.ts` references legacy audit tables (`assessments_audit`, `assessment_marks_audit`, `clearance_audit`). Remove these references after the legacy tables are dropped.

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

> **IMPORTANT**: These components are actively used. See Section 12 (Edit Modal Migration) before deleting.

### 3a. Remove Legacy Barrel Exports

After migrating edit modals (Section 12), delete:

- `src/app/audit-logs/students/index.ts`
- `src/app/audit-logs/student-programs/index.ts`
- `src/app/audit-logs/student-semesters/index.ts`
- `src/app/audit-logs/student-modules/index.ts`

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
- Keep only re-export of `auditLogs` and `auditLogsRelations` from `@/core/database`

**`src/app/academic/_database/index.ts`:**
- Remove exports for `assessmentsAudit` and `assessmentMarksAudit`

**`src/app/registry/_database/index.ts`:**
- Remove export for `clearanceAudit` (if present)

**`src/core/database/index.ts`:**
- Ensure `auditLogs` and `auditLogsRelations` are exported (added in Step 001)

### 6. Remove `operationType` pgEnum and Audit Action Enums

These pgEnums defined in legacy audit schemas are no longer used:

| Enum | Defined In | SQL Type |
|------|-----------|----------|
| `operationType` | `studentSemesterAuditLogs.ts` | `operation_type` |
| `assessmentsAuditAction` | `assessmentsAudit.ts` | `assessments_audit_action` |
| `assessmentMarksAuditAction` | `assessmentMarksAudit.ts` | `assessment_marks_audit_action` |

Removing the schema files (Step 1) handles the TypeScript side. The SQL DROP is in Step 7.

### 7. Drop Legacy Tables and Types

Create a custom migration (`pnpm db:generate --custom`):

```sql
-- Drop legacy audit tables
DROP TABLE IF EXISTS student_audit_logs CASCADE;
DROP TABLE IF EXISTS student_program_audit_logs CASCADE;
DROP TABLE IF EXISTS student_semester_audit_logs CASCADE;
DROP TABLE IF EXISTS student_module_audit_logs CASCADE;
DROP TABLE IF EXISTS assessments_audit CASCADE;
DROP TABLE IF EXISTS assessment_marks_audit CASCADE;
DROP TABLE IF EXISTS clearance_audit CASCADE;

-- Drop legacy pgEnum types
DROP TYPE IF EXISTS operation_type CASCADE;
DROP TYPE IF EXISTS assessments_audit_action CASCADE;
DROP TYPE IF EXISTS assessment_marks_audit_action CASCADE;
```

> **IMPORTANT**: After running this custom migration, run `pnpm db:generate` again to ensure the Drizzle snapshots are updated to reflect the removed schemas. The generated migration should be empty (confirming state is in sync).

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

### 10. Remove Legacy `getAuditHistory()` and `getStudentAuditHistory()` Methods

These repositories have custom audit history methods that query legacy audit tables. Replace them with the unified actions from Step 005:

| Repository | Method | Replacement |
|-----------|--------|-------------|
| `AssessmentRepository` | `getAuditHistory(assessmentId)` | `getRecordHistory('assessments', assessmentId)` |
| `AssessmentMarksRepository` | `getAuditHistory(assessmentMarkId)` | `getRecordHistory('assessment_marks', assessmentMarkId)` |
| `AssessmentMarksRepository` | `getStudentAuditHistory(studentModuleId)` | `getStudentModuleAuditHistory(studentModuleId)` (new action from Step 005) |
| `StudentAuditLogRepository` | `findByStudentIdWithUser(stdNo)` | `getRecordHistory('students', stdNo)` |

Services and actions that expose these methods (`AssessmentService.getAuditHistory`, `AssessmentMarksService.getStudentAuditHistory`, etc.) must also be updated to call the unified actions instead.

### 11. Remove Legacy Imports

Remove all imports of legacy audit schemas from repository files:

- `import { assessmentsAudit } from '...'` in `AssessmentRepository`
- `import { assessmentMarksAudit } from '...'` in `AssessmentMarksRepository`
- `import { clearanceAudit } from '...'` in both `ClearanceRepository` files
- `import { studentAuditLogs } from '...'` in `StudentAuditLogRepository`

### 12. Edit Modal Migration (CRITICAL)

The legacy audit modules export edit modals and actions that are actively used by `registry/students` components:

**Current consumer imports:**

| Consumer File | Legacy Import |
|--------------|---------------|
| `registry/students/_components/info/StudentView.tsx` | `EditStudentModal` from `@audit-logs/students` |
| `registry/students/_components/info/StudentView.tsx` | `EditStudentProgramModal`, `CreateStudentProgramModal` from `@audit-logs/student-programs` |
| `registry/students/_components/academics/AcademicsView.tsx` | `EditStudentProgramModal` from `@audit-logs/student-programs` |
| `registry/students/_components/academics/AcademicsView.tsx` | `EditStudentSemesterModal` from `@audit-logs/student-semesters` |
| `registry/students/_components/academics/SemesterTable.tsx` | `EditStudentModuleModal` from `@audit-logs/student-modules` |
| `registry/students/_components/sponsors/.../EditSemesterSponsorModal.tsx` | `updateStudentSemester` from `@audit-logs/student-semesters` |

**Migration strategy: Move modals to their owning modules**

These modals belong in the registry, not in audit-logs. After migration, `BaseService` handles audit automatically.

| Current Location | New Location | Changes Required |
|-----------------|--------------|-----------------|
| `audit-logs/students/_components/EditModal.tsx` | `registry/students/_components/info/EditStudentModal.tsx` | Remove manual audit insert; use `studentService.update()` which auto-audits. Add `reasons` as metadata via a custom service method. |
| `audit-logs/student-programs/_components/EditModal.tsx` | `registry/students/_components/academics/EditStudentProgramModal.tsx` | Same pattern — use auto-audit. |
| `audit-logs/student-programs/_components/CreateModal.tsx` | `registry/students/_components/academics/CreateStudentProgramModal.tsx` | Same pattern — use auto-audit. |
| `audit-logs/student-semesters/_components/EditModal.tsx` | `registry/students/_components/academics/EditStudentSemesterModal.tsx` | Same pattern — use auto-audit. |
| `audit-logs/student-modules/_components/EditModal.tsx` | `registry/students/_components/academics/EditStudentModuleModal.tsx` | Same pattern — use auto-audit. |

**For each migrated modal:**
1. Remove the `AuditHistoryTab` and replace with `RecordAuditHistory` from Step 005
2. Remove manual `updateStudentWithAudit()` calls — use the entity's own service/actions (e.g., `updateStudent()` from `registry/students`)
3. If the modal includes a `reasons` text field, pass reasons via a custom service method that adds `metadata: { reasons }` to the audit options
4. Update all consumer import paths

**Actions to move or replace:**

| Current Action | New Action | Module |
|---------------|------------|--------|
| `updateStudent` from `@audit-logs/students` | `updateStudent` from `@registry/students` | registry/students |
| `updateStudentProgram` from `@audit-logs/student-programs` | `updateStudentProgram` from `@registry/students` (or `student-programs` feature) | registry |
| `createStudentProgram` from `@audit-logs/student-programs` | `createStudentProgram` from the owning feature | registry |
| `updateStudentSemester` from `@audit-logs/student-semesters` | `updateStudentSemester` from the owning feature | registry |
| `updateStudentModule` from `@audit-logs/student-modules` | `updateStudentModule` from the owning feature | registry |

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
15. Edit modals for students/programs/semesters/modules work from their new locations in `registry/`
16. All consumer components (`StudentView`, `AcademicsView`, `SemesterTable`, etc.) use updated import paths
17. `RecordAuditHistory` replaces `AuditHistoryTab` in all migrated modals
18. `findUnsynced()` and `markAsSynced()` work on the unified `audit_logs` table
19. `getStudentModuleAuditHistory` correctly returns assessment mark audit entries for a student module
20. Legacy audit relations removed from `assessments/_schema/relations.ts` and `clearance/_schema/relations.ts`
21. `src/test/mocks.db.ts` updated — no references to dropped tables
22. All legacy pgEnum types (`operation_type`, `assessments_audit_action`, `assessment_marks_audit_action`) dropped from database

## Notes

- This step should be the last implemented and thoroughly tested
- Consider keeping a database backup before the DROP migration
- After cleanup, adding audit to any new entity is automatic — just extend `BaseRepository`
- No per-feature audit code is needed going forward
