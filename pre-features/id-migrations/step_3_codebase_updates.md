# Step 3: Codebase Updates

## Introduction

**Project:** CMS ID Decoupling Migration

**Purpose:** This multi-step migration decouples the Registry Web database from the external CMS by introducing independent nanoid-based primary keys. Currently, records must exist in the CMS before they can be created locally. After migration, records can be created independently with optional CMS linking.

**Migration Overview:**
- **Step 1 (completed):** Updated Drizzle schema files (added nanoid `id` PK, renamed old PK to `cmsId`, updated FK columns from integer to text) and generated/edited SQL migration file
- **Step 2 (completed):** Executed migration via `pnpm db:migrate` and validated data integrity (all row counts match, all FK mappings correct, all data preserved)
- **Step 3 (this document):** Update all TypeScript code to work with new ID types

---

## Objective

Update all TypeScript code to work with the new nanoid-based ID system. This includes repositories, services, actions, route handlers, and UI components.

**Prerequisites:** Step 2 must be 100% complete with all validations passing.

---

## Overview of Changes

### Type Changes

| Before | After |
|--------|-------|
| `id: number` (serial) | `id: string` (nanoid) |
| `schoolId: number` | `schoolId: string` |
| `programId: number` | `programId: string` |
| `structureId: number` | `structureId: string` |
| `structureSemesterId: number` | `structureSemesterId: string` |
| `studentProgramId: number` | `studentProgramId: string` |
| `studentSemesterId: number` | `studentSemesterId: string` |
| `moduleId: number` | `moduleId: string` |
| `semesterModuleId: number` | `semesterModuleId: string` |
| `studentModuleId: number` | `studentModuleId: string` |

Note: `stdNo: number` (bigint) remains unchanged as `number` (handled as BigInt in DB).

---

## Files to Update

### Category 1: Repository Files (~15 files)

Repositories use `findById`, `update`, `delete` methods that expect an ID parameter. These must change from `number` to `string`.

**Pattern to find:** Search for `findById`, `update(`, `delete(` in repository files.

**Locations to check:**
- `src/app/registry/student-programs/_server/repository.ts`
- `src/app/registry/student-semesters/_server/repository.ts`
- `src/app/registry/student-modules/_server/repository.ts`
- `src/app/academic/schools/_server/repository.ts`
- `src/app/academic/programs/_server/repository.ts`
- `src/app/academic/structures/_server/repository.ts`
- `src/app/academic/structure-semesters/_server/repository.ts`
- `src/app/academic/modules/_server/repository.ts`
- `src/app/academic/semester-modules/_server/repository.ts`
- All other repositories that reference the migrated tables

**Changes needed:**
1. Parameter types: `id: number` → `id: string`
2. Query filters: `eq(table.id, id)` remains the same (column is still named `id`)

**Note:** `src/app/registry/students/_server/repository.ts` should NOT be updated regarding ID types, as student ID remains `stdNo` (bigint).

### Category 2: Service Files (~15 files)

Services wrap repositories and add business logic. They pass IDs to repositories.

**Same locations as repositories, but `service.ts` files.**

**Changes needed:**
1. Parameter types: `id: number` → `id: string`
2. Return types may change if they include the ID
3. Any ID parsing/validation logic needs updating

### Category 3: Action Files (~20 files)

Server Actions receive parameters from the UI and call services.

**Same locations as repositories, but `actions.ts` files.**

**Changes needed:**
1. Parameter types: `id: number` → `id: string`
2. Remove `parseInt()` calls that converted string params to numbers
3. Update Zod schemas if ID validation exists
4. Update return types

### Category 4: Route Handlers - `[id]` Folders

Dynamic routes use `[id]` folder names. The `params.id` is always a string, but many files currently `parseInt()` it.

**Pattern to find:** Search for `parseInt(params.id` or `Number(params.id` in page files.

**Locations (pattern: `src/app/**/[id]/page.tsx` and `src/app/**/[id]/edit/page.tsx`):**

For each of the migrated entities:
- `src/app/academic/schools/[id]/page.tsx`
- `src/app/academic/schools/[id]/edit/page.tsx`
- `src/app/academic/programs/[id]/page.tsx`
- ... and so on for all entities

**Changes needed:**
1. Remove `parseInt()` or `Number()` conversion
2. Pass `params.id` directly as string
3. Update any ID comparisons

**Note:** `src/app/registry/students/[id]/page.tsx` etc. dealing with student ID may still need `parseInt()` if `stdNo` is treated as a number in the route param logic, as it stays a number/bigint type.

### Category 5: Form Components

Form components may have hidden ID fields or pass IDs to actions.

**Pattern to find:** Search for `id:` in form submissions and Zod schemas.

**Locations:**
- `src/app/academic/schools/_components/Form.tsx`
- ... and so on for all entities with forms

**Changes needed:**
1. Update form field types for ID fields
2. Update Zod schemas: `z.number()` → `z.string()`
3. Update hidden input values if IDs are passed as form data

### Category 6: List Components

List components often use IDs for navigation links and keys.

**Pattern to find:** Search for `item.id` in list components.

**Changes needed:**
1. Update `<Link href>` constructions
2. Update `key` props (already strings, should work)
3. Update any ID-based filtering or comparison

### Category 7: Audit Log Module

The audit log module has special handling because it references `cmsId`/`stdNo` instead of the new `id`.

**Location:** `src/app/audit-logs/`

**Files:**
- `src/app/audit-logs/students/_server/repository.ts`
- `src/app/audit-logs/students/_server/service.ts`
- `src/app/audit-logs/students/_server/actions.ts`
- `src/app/audit-logs/student-programs/_server/repository.ts`
- `src/app/audit-logs/student-programs/_server/service.ts`
- `src/app/audit-logs/student-programs/_server/actions.ts`
- `src/app/audit-logs/student-semesters/_server/repository.ts`
- `src/app/audit-logs/student-semesters/_server/service.ts`
- `src/app/audit-logs/student-semesters/_server/actions.ts`
- `src/app/audit-logs/student-modules/_server/repository.ts`
- `src/app/audit-logs/student-modules/_server/service.ts`
- `src/app/audit-logs/student-modules/_server/actions.ts`
- `src/app/audit-logs/_components/AuditHistoryTab.tsx`
- `src/app/audit-logs/*/_components/EditModal.tsx`

**Changes needed:**
1. Update queries to use `cmsId` instead of `id` for FK lookups (where applicable)
2. For students: continue using `stdNo` as the CMS identifier (no change)
3. Update types: FK columns are now named `studentProgramCmsId`, `studentSemesterCmsId`, `studentModuleCmsId`
4. The JSONB `oldValues` and `newValues` types remain unchanged (historical data format)

### Category 8: Relations Files

Drizzle relations define how tables connect. These were updated in Step 1, but verify they compile correctly.

**Files:**
- `src/app/registry/_database/relations.ts`
- `src/app/academic/_database/relations.ts`
- `src/app/audit-logs/_database/relations.ts`
- `src/app/finance/_database/relations.ts`
- `src/app/admin/_database/relations.ts`
- `src/app/timetable/_database/relations.ts`
- `src/app/auth/_database/relations.ts`

### Category 9: Type Exports and Interfaces

Check for manually defined types that reference IDs.

**Pattern to find:** Search for `stdNo:` and `id:` in type definitions.

**Locations:**
- `src/app/*/_lib/types.ts` files
- Any `interface` or `type` definitions that include ID fields

### Category 10: Utility Functions

Check for utility functions that work with IDs.

**Pattern to find:** Search for functions that accept or return entity IDs.

**Locations:**
- `src/shared/lib/utils/`
- Any module-specific utility files

---

## Search Patterns for Finding All Affected Code

Use grep/search to find all code that needs updating:

### Pattern 1: parseInt on params.id
```
parseInt(params.id
Number(params.id
```

### Pattern 2: Type annotations with number IDs
```
id: number
schoolId: number
programId: number
structureId: number
studentProgramId: number
studentSemesterId: number
moduleId: number
semesterModuleId: number
studentModuleId: number
```

### Pattern 3: Zod number schemas for IDs
```
z.number() (in context of ID validation)
z.coerce.number()
```

### Pattern 4: Direct table references
```
schools.id
programs.id
structures.id
```

---

## Special Considerations

### 1. The `students` Table

The `students` table has NOT been migrated to nanoid. It retains `std_no` (bigint) as its primary key.
- Code dealing with `students` CRUD should generally NOT change types for the ID.
- However, verify if any "generic" repository patterns were assuming all tables would move to string IDs. `students` will be the exception.

### 2. Tables Referencing Students

Tables that reference students do so via `std_no` (bigint). FK columns in dependent tables (like `student_education.std_no`, `payment_receipts.std_no`) remain `std_no` and type `bigint`.
- Do NOT change `std_no` to `studentId` in code.
- Do NOT change type from `number`/`bigint` to `string`.

### 3. Drizzle Type Inference

Drizzle infers types from schema. After schema update:
- `typeof schools.$inferSelect` will have `id: string`
- `typeof students.$inferSelect` will remain `stdNo: number` (or bigint)

Verify that code using inferred types compiles correctly.

### 4. BaseRepository Pattern

The `BaseRepository` class in `src/core/platform/` may have generic type constraints for ID types. Verify it supports string IDs.

---

## Validation Steps

### Step 1: TypeScript Compilation

Run: `pnpm tsc --noEmit`

Fix all type errors. Common errors:
- Type `number` is not assignable to type `string`
- Property `stdNo` does not exist (should be `studentId` or `id`)
- Argument of type `string` is not assignable to parameter of type `number`

### Step 2: Linting

Run: `pnpm lint:fix`

Fix all linting errors.

### Step 3: Runtime Testing

After fixing type errors:
1. Start the development server: `pnpm dev`
2. Test each migrated entity:
   - List view loads
   - Detail view loads
   - Create form works
   - Edit form works
   - Delete works
3. Test audit log views
4. Test any cross-entity operations (e.g., student → programs → semesters → modules)

### Step 4: Query Testing

Verify database queries work correctly:
1. Check that `findById` returns correct records
2. Check that joins work (records with related data load correctly)
3. Check that filters work (status filters, search, etc.)

---

## Checklist

- [ ] All repository files updated (parameter types, query methods)
- [ ] All service files updated (parameter types, return types)
- [ ] All action files updated (parameter types, remove parseInt)
- [ ] All `[id]/page.tsx` files updated (remove parseInt on params.id)
- [ ] All `[id]/edit/page.tsx` files updated
- [ ] All form components updated (Zod schemas, hidden fields)
- [ ] All list components updated (links, keys)
- [ ] All audit log files updated (use cmsId references)
- [ ] All relations files verified
- [ ] All type definitions updated
- [ ] All utility functions updated
- [ ] `pnpm tsc --noEmit` passes with no errors
- [ ] `pnpm lint:fix` passes with no errors
- [ ] Development server starts successfully
- [ ] Manual testing of CRUD operations passes
- [ ] Manual testing of audit log views passes

---

## Estimated Scope

Based on the codebase structure:
- ~15 repository files
- ~15 service files
- ~20 action files
- ~30 page/route files
- ~15 form components
- ~10 list components
- 4 audit log modules
- ~10 relation files
- Various type definitions and utilities

**Total estimated files to modify: 100-130 files**

---

## Order of Operations

1. Update schema files (already done in Step 1)
2. Update relations files
3. Update repository files
4. Update service files
5. Update action files
6. Update route/page files
7. Update form components
8. Update list components
9. Update audit log module
10. Run `pnpm tsc --noEmit` and fix errors
11. Run `pnpm lint:fix` and fix errors
12. Manual testing

---

## Notes

- Keep the development server stopped while making bulk changes to avoid hot-reload issues
- Make changes in small batches and verify compilation after each batch
- Use IDE "Find and Replace" with caution - verify each replacement
- Some files may not need changes if they don't directly work with the migrated IDs
