# Step 3: Codebase Updates

## Introduction

**Project:** CMS ID Tracking Migration

**Purpose:** Update the codebase to utilize the new `cms_id` column for CMS synchronization tracking.

**Migration Overview:**
- **Step 1 (completed):** Updated Drizzle schema files and generated SQL migration
- **Step 2 (completed):** Executed migration and validated data integrity
- **Step 3 (this document):** Update codebase to use `cms_id` where needed

---

## Objective

Update TypeScript code to:
1. Use `cms_id` for CMS sync operations
2. Update audit log tables to reference both `id` and `cms_id`
3. Ensure new locally-created records have `cms_id = NULL`

**Key Principle:** This is a minimal codebase change. The `id` column remains the primary identifier throughout the application. The `cms_id` is ONLY used for CMS synchronization tracking.

---

## What Changes and What Doesn't

### Does NOT Change
- Primary key usage (`id` remains the PK everywhere)
- Foreign key relationships (still reference `id`)
- Route parameters (still use `id`)
- Repository CRUD operations (still use `id`)
- Service layer (still use `id`)
- Actions (still use `id`)
- Form components (still use `id`)
- List components (still use `id`)
- Type annotations for `id` (still `number`)

### DOES Change
- Audit log schemas - add `cms_id` columns for CMS sync tracking
- CMS sync code - use `cms_id` instead of `id` when syncing to CMS
- Record creation - ensure `cms_id` is NOT set for locally-created records

---

## Files to Update

### Category 1: Audit Log Schemas

The audit log tables track CMS sync operations. They need both the local `id` (for joining) and `cms_id` (for CMS sync reference).

**Files:**
- `src/app/audit-logs/_database/schema/student-programs.ts`
- `src/app/audit-logs/_database/schema/student-semesters.ts`
- `src/app/audit-logs/_database/schema/student-modules.ts`

**Changes needed:**

Add `cmsId` column to audit log tables:

```typescript
// Example: student_program_audit_logs
export const studentProgramAuditLogs = pgTable('student_program_audit_logs', {
  id: serial().primaryKey(),
  studentProgramId: integer()
    .references(() => studentPrograms.id, { onDelete: 'cascade' })
    .notNull(),
  studentProgramCmsId: integer(),  // <-- ADD THIS (nullable, for CMS sync reference)
  // ... rest of columns
});
```

**Note:** `student_audit_logs` does NOT need changes - `std_no` is already the CMS identifier for students.

### Category 2: Audit Log Repositories/Services

Update audit log code to populate `cmsId` when creating audit records.

**Files:**
- `src/app/audit-logs/student-programs/_server/repository.ts`
- `src/app/audit-logs/student-programs/_server/service.ts`
- `src/app/audit-logs/student-semesters/_server/repository.ts`
- `src/app/audit-logs/student-semesters/_server/service.ts`
- `src/app/audit-logs/student-modules/_server/repository.ts`
- `src/app/audit-logs/student-modules/_server/service.ts`

**Changes needed:**

When creating an audit log entry, also store the `cms_id` from the source record:

```typescript
// When creating audit log for a student program
await db.insert(studentProgramAuditLogs).values({
  studentProgramId: studentProgram.id,
  studentProgramCmsId: studentProgram.cmsId,  // <-- ADD THIS
  // ... rest of values
});
```

### Category 3: CMS Sync Code (If Exists)

If there is code that syncs to/from the CMS, update it to use `cms_id`:

**Pattern to find:** Search for CMS sync, Moodle integration, or external API calls.

**Changes needed:**
- When syncing TO CMS: use `cms_id` as the identifier
- When syncing FROM CMS: set `cms_id` to the CMS record ID
- When creating local-only records: leave `cms_id` as NULL

### Category 4: Record Creation (Optional Consideration)

By default, Drizzle will set `cms_id` to NULL for new records (since the column is nullable with no default). This is the desired behavior.

**Verify:** When creating new records via forms, `cms_id` should NOT be included in the insert statement, ensuring it defaults to NULL.

If any code explicitly sets `cms_id = id` on insert, remove that logic.

---

## Search Patterns

Use grep/search to find relevant code:

### Pattern 1: Audit log inserts
```
insert(studentProgramAuditLogs
insert(studentSemesterAuditLogs
insert(studentModuleAuditLogs
```

### Pattern 2: CMS sync code
```
cms
sync
moodle
```

### Pattern 3: Any explicit cmsId references
```
cmsId
cms_id
```

---

## Validation Steps

### Step 1: TypeScript Compilation

Run: `pnpm tsc --noEmit`

Fix any type errors related to the new `cmsId` column.

### Step 2: Linting

Run: `pnpm lint:fix`

### Step 3: Runtime Testing

1. Start the development server: `pnpm dev`
2. Create a new record in any of the 12 migrated tables
3. Verify the new record has `cms_id = NULL` in the database
4. Verify existing records still have `cms_id = id`
5. Test audit log creation (if applicable)

---

## Checklist

- [ ] Audit log schemas updated with `cmsId` column
- [ ] Audit log repositories/services populate `cmsId`
- [ ] CMS sync code uses `cmsId` (if applicable)
- [ ] New records have `cmsId = NULL`
- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm lint:fix` passes
- [ ] Runtime testing passes

---

## Estimated Scope

This migration has minimal codebase impact:
- ~3 audit log schema files
- ~6 audit log repository/service files
- ~0-5 CMS sync files (if they exist)

**Total estimated files to modify: 10-15 files**

---

## Notes

- This is a low-risk change - we are only ADDING a column
- Existing functionality is preserved
- The `id` remains the primary identifier for all operations
- `cms_id` is only for CMS sync tracking purposes
