# Step 006c: Remove Legacy Code & Drop Tables

## Introduction

Delete all legacy audit schemas, files, barrel exports, imports, and drop the legacy tables from the database. This is the final cleanup step combining code removal and the irreversible database migration.

## Prerequisites

- Step 006a is complete (all repositories refactored)
- Step 006b is complete (all modals migrated, all consumer imports updated)
- **Database backup taken** before executing the DROP migration

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

### 2. Remove Legacy Audit Relations

| File | Relations to Remove |
|------|--------------------|
| `src/app/academic/assessments/_schema/relations.ts` | Remove `assessmentsAuditRelations`, `assessmentMarksAuditRelations`, and the `audits: many(assessmentsAudit)` field from `assessmentsRelations`, and `audits: many(assessmentMarksAudit)` field from `assessmentMarksRelations` |
| `src/app/registry/clearance/_schema/relations.ts` | Remove `clearanceAuditRelations` and the `audits: many(clearanceAudit)` field from `clearanceRelations` |

> **IMPORTANT**: Only remove the audit-related relations and imports. Keep all other relations intact in these files.

### 3. Update Test Mocks

`src/test/mocks.db.ts` references legacy audit tables (`assessments_audit`, `assessment_marks_audit`, `clearance_audit`). Remove these references after the legacy tables are dropped.

### 4. Remove Legacy Repositories, Services, and Actions

Delete all files under:

- `src/app/audit-logs/students/_server/`
- `src/app/audit-logs/student-programs/_server/`
- `src/app/audit-logs/student-semesters/_server/`
- `src/app/audit-logs/student-modules/_server/`

### 5. Remove Legacy Components

Delete:

- `src/app/audit-logs/students/_components/`
- `src/app/audit-logs/student-programs/_components/`
- `src/app/audit-logs/student-semesters/_components/`
- `src/app/audit-logs/student-modules/_components/`

> **IMPORTANT**: These components are actively used. See Step 006b (Edit Modal Migration) before deleting.

### 6. Remove Legacy Barrel Exports

Delete:

- `src/app/audit-logs/students/index.ts`
- `src/app/audit-logs/student-programs/index.ts`
- `src/app/audit-logs/student-semesters/index.ts`
- `src/app/audit-logs/student-modules/index.ts`

### 7. Remove Legacy Imports from Repository Files

Remove all imports of legacy audit schemas:

- `import { assessmentsAudit } from '...'` in `AssessmentRepository`
- `import { assessmentMarksAudit } from '...'` in `AssessmentMarksRepository`
- `import { clearanceAudit } from '...'` in both `ClearanceRepository` files
- `import { studentAuditLogs } from '...'` in `StudentAuditLogRepository`

### 8. Update Barrel Exports

**`src/app/audit-logs/_database/index.ts`:**
- Remove exports for all legacy schema files
- Keep only re-export of `auditLogs` and `auditLogsRelations` from `@/core/database`

**`src/app/academic/_database/index.ts`:**
- Remove exports for `assessmentsAudit` and `assessmentMarksAudit`

**`src/app/registry/_database/index.ts`:**
- Remove export for `clearanceAudit` (if present)

**`src/core/database/index.ts`:**
- Ensure `auditLogs` and `auditLogsRelations` are exported (added in Step 001)

### 9. Remove `operationType` pgEnum and Audit Action Enums

These pgEnums defined in legacy audit schemas are no longer used:

| Enum | Defined In | SQL Type |
|------|-----------|----------|
| `operationType` | `studentSemesterAuditLogs.ts` | `operation_type` |
| `assessmentsAuditAction` | `assessmentsAudit.ts` | `assessments_audit_action` |
| `assessmentMarksAuditAction` | `assessmentMarksAudit.ts` | `assessment_marks_audit_action` |

Removing the schema files (Step 1) handles the TypeScript side. The SQL DROP is in Step 10.

### 10. Drop Legacy Tables and Types

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

After running the custom migration, run `pnpm db:generate` again to verify snapshots are in sync (generated migration should be empty).

## Validation Criteria

1. `pnpm tsc --noEmit` passes with zero errors
2. `pnpm lint:fix` passes
3. No imports reference deleted files or legacy audit schemas
4. All CRUD operations still work
5. New audit entries appear in the unified `audit_logs` table
6. Both migrated historical data (from Step 004) and new entries appear in the audit UI
7. Legacy tables no longer exist in the database
8. Legacy pgEnum types (`operation_type`, `assessments_audit_action`, `assessment_marks_audit_action`) no longer exist
9. `findUnsynced()` and `markAsSynced()` work on the unified `audit_logs` table
10. `pnpm db:generate` produces an empty migration (state in sync)
11. `src/test/mocks.db.ts` has no references to dropped tables
12. Legacy audit relations removed from `assessments/_schema/relations.ts` and `clearance/_schema/relations.ts`

## Notes

- This is the **point of no return** for the database. Keep a backup.
- After this step, adding audit to any new entity is automatic — just extend `BaseRepository`. No per-feature audit code is needed going forward.
