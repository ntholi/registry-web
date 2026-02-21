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

Find and replace all `*WithAudit()` method calls:

| Old Pattern | New Pattern |
|------------|-------------|
| `updateStudentWithAudit(stdNo, data, userId, reasons)` | `studentRepo.update(stdNo, data, { userId, metadata: { reasons } })` |
| `updateStudentProgramWithAudit(id, data, userId, reasons)` | `studentProgramRepo.update(id, data, { userId, metadata: { reasons } })` |
| `createStudentProgramWithAudit(data, userId)` | `studentProgramRepo.create(data, { userId })` |
| `updateStudentModuleWithAudit(id, data, userId, reasons)` | `studentModuleRepo.update(id, data, { userId, metadata: { reasons } })` |
| Manual `tx.insert(assessmentsAudit).values(...)` | Remove — `BaseRepository.update` handles it |
| Manual `tx.insert(clearanceAudit).values(...)` | Remove — `BaseRepository.update` handles it |

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

### 8. Remove `AuditHistoryTab` Component

Evaluate `src/app/audit-logs/_components/AuditHistoryTab.tsx`:
- If replaced by `RecordAuditHistory` (Step 005), delete it
- If still used, refactor to delegate to `RecordAuditHistory`, then delete

### 9. Set `auditEnabled = false` on Excluded Repositories

For each excluded table, locate its repository and add/confirm:

```typescript
protected auditEnabled = false;
```

Repositories to update (see exclusion list in 000_index.md).

## Validation Criteria

1. `pnpm tsc --noEmit` passes with zero errors
2. `pnpm lint:fix` passes
3. No imports reference deleted files
4. Legacy tables are dropped from the database
5. All CRUD operations across the app still work
6. New audit entries appear in `audit_logs` for write operations
7. Both migrated historical data and new entries appear in the audit UI
8. Custom metadata (`reasons`) works for student/module operations

## Notes

- This step should be the last implemented and thoroughly tested
- Consider keeping a database backup before the DROP migration
- After cleanup, adding audit to any new entity is automatic — just extend `BaseRepository`
- No per-feature audit code is needed going forward
