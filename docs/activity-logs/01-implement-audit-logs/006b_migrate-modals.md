# Step 006b: Migrate Edit Modals & UI

## Introduction

Move edit modals from `audit-logs/` to their owning modules in `registry/`, replace `AuditHistoryTab` with `RecordAuditHistory`, and update all consumer import paths. This step handles all frontend/UI changes.

## Prerequisites

- Step 006a is complete (all repositories refactored to use `writeAuditLog`)

## Requirements

### 1. Deprecate `AuditHistoryTab` Component

`AuditHistoryTab.tsx` is replaced by `RecordAuditHistory.tsx` (Step 005).

1. Verify all usages of `AuditHistoryTab` are replaced by `RecordAuditHistory`
2. Confirm `getChangedFields`, `formatValue`, `formatFieldName` were extracted to `src/app/audit-logs/_lib/audit-utils.ts` (Step 005)
3. Delete `src/app/audit-logs/_components/AuditHistoryTab.tsx`
4. Update any imports that reference it

### 2. Edit Modal Migration (CRITICAL)

The legacy audit modules export edit modals and actions actively used by `registry/students` components:

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

1. `pnpm tsc --noEmit` passes
2. `pnpm lint:fix` passes
3. Edit modals for students/programs/semesters/modules work from their new locations in `registry/`
4. All consumer components (`StudentView`, `AcademicsView`, `SemesterTable`, etc.) use updated import paths
5. `RecordAuditHistory` replaces `AuditHistoryTab` in all migrated modals
6. Legacy audit components still exist (not deleted yet — that's Step 006c)
