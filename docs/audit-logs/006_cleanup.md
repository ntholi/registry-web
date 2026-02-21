# Step 006: Cleanup

## Introduction

The final step removes legacy audit tables, deprecated code paths, and updates all references to use the new unified audit system.

## Context

At this point:
- The unified `audit_logs` table is live with DB triggers
- All legacy data has been migrated (Step 4)
- The new UI is working (Step 5)
- Legacy tables are still in the database but no longer receiving new data

## Requirements

### 1. Remove Legacy Audit Schemas

Delete these Drizzle schema files:

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

### 2. Remove Legacy Repositories & Services

Delete these server files:

| File | Purpose |
|------|---------|
| `src/app/audit-logs/students/_server/repository.ts` | Legacy student audit repo |
| `src/app/audit-logs/students/_server/service.ts` | Legacy student audit service |
| `src/app/audit-logs/students/_server/actions.ts` | Legacy student audit actions |
| `src/app/audit-logs/student-programs/_server/repository.ts` | Legacy program audit repo |
| `src/app/audit-logs/student-programs/_server/service.ts` | Legacy program audit service |
| `src/app/audit-logs/student-programs/_server/actions.ts` | Legacy program audit actions |
| `src/app/audit-logs/student-semesters/_server/repository.ts` | Legacy semester audit repo |
| `src/app/audit-logs/student-semesters/_server/service.ts` | Legacy semester audit service |
| `src/app/audit-logs/student-semesters/_server/actions.ts` | Legacy semester audit actions |
| `src/app/audit-logs/student-modules/_server/repository.ts` | Legacy module audit repo |
| `src/app/audit-logs/student-modules/_server/service.ts` | Legacy module audit service |
| `src/app/audit-logs/student-modules/_server/actions.ts` | Legacy module audit actions |

### 3. Update References

Find and update all imports/references to legacy audit code:

- `updateStudentWithAudit()` → replace with direct `students` update (trigger handles audit)
- `updateStudentProgramWithAudit()` → replace with direct `studentPrograms` update
- `createStudentProgramWithAudit()` → replace with direct `studentPrograms` insert
- Similar for student semesters and student modules
- Assessment audit inserts → remove (trigger handles it)
- Clearance audit inserts → remove (trigger handles it)

### 4. Update Barrel Exports

Update `src/app/audit-logs/_database/index.ts` to:
- Remove exports for legacy schema files
- Export only the new `auditLogs` schema

Update `src/app/academic/_database/index.ts` to:
- Remove exports for `assessmentsAudit` and `assessmentMarksAudit`

Update `src/app/registry/_database/index.ts` to:
- Remove export for `clearanceAudit`

### 5. Remove `operationType` pgEnum

The `operationType` enum (defined in `studentSemesterAuditLogs.ts`) is no longer needed since the unified table uses plain text. Generate a migration to drop it.

### 6. Drop Legacy Tables

Create a custom migration (`pnpm db:generate --custom`) to drop the legacy tables:

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

### 7. Remove Legacy Component

Evaluate `src/app/audit-logs/_components/AuditHistoryTab.tsx`:
- If fully replaced by `RecordAuditHistory`, delete it
- If still used by any page, refactor to use the new component, then delete

## Expected Files

| Action | File |
|--------|------|
| DELETE | All legacy schema, repo, service, action files listed above |
| MODIFY | `src/app/audit-logs/_database/index.ts` |
| MODIFY | `src/app/academic/_database/index.ts` |
| MODIFY | `src/app/registry/_database/index.ts` |
| MODIFY | All files that called `*WithAudit()` methods |
| CREATE | `drizzle/XXXX_custom_drop_legacy_audit.sql` |

## Validation Criteria

1. `pnpm tsc --noEmit` passes with zero errors
2. `pnpm lint:fix` passes
3. No imports reference deleted files
4. Legacy tables are dropped from the database
5. Audit triggers still fire correctly on all 97 audited tables
6. The new audit UI shows both migrated historical data and new trigger-generated data
7. All CRUD operations across the app still work correctly

## Notes

- This step should be the last one implemented and thoroughly tested before deployment
- Consider keeping a backup of legacy tables for 30 days before the final DROP
- After cleanup, the entire audit system is driven by DB triggers — no per-feature audit code is needed
- Future tables only need a trigger added (one SQL line) to be fully audited
