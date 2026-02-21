# Step 005: Audit UI

## Introduction

Build the user interface for viewing and querying the unified audit logs. Includes a global audit log viewer, per-record audit history component, and detail view.

## Requirements

### 1. Repository Layer

Create `src/app/audit-logs/_server/repository.ts`:

```typescript
class AuditLogRepository extends BaseRepository<typeof auditLogs, 'id'> {
  protected auditEnabled = false; // Don't audit the audit table

  constructor() {
    super(auditLogs, auditLogs.id);
  }

  async findByRecord(tableName: string, recordId: string) { ... }
  async findByUser(userId: string, page: number, size: number) { ... }
  async findByTable(tableName: string, page: number, size: number) { ... }
  async findDistinctTables(): Promise<string[]> { ... }
}
```

**Key methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `query` | `QueryOptions` with table/record filters | Paginated results with user info | Global query |
| `findByRecord` | `tableName, recordId` | Audit entries with user info | Per-record history |
| `findByUser` | `userId, page, size` | Paginated results | Changes by a user |
| `findByTable` | `tableName, page, size` | Paginated results | Changes on a table |
| `findDistinctTables` | — | `string[]` | Unique table names for filter dropdown |

All queries should join with `users` to include `name`, `email`, `image` for display.

### 2. Service Layer

Create `src/app/audit-logs/_server/service.ts`:

Extends `BaseService` with role-based access. Only `admin` and `registry` roles can view audit logs.

### 3. Server Actions

Create `src/app/audit-logs/_server/actions.ts`:

| Action | Parameters | Description |
|--------|-----------|-------------|
| `getAuditLogs` | `page, search, tableName?, operation?` | Paginated global query |
| `getRecordHistory` | `tableName, recordId` | History for a specific record |
| `getAuditLog` | `id` | Single audit entry detail |
| `getDistinctTables` | — | Table names for filter dropdown |

### 4. Global Audit Log Page

**Route:** `src/app/audit-logs/page.tsx`

`ListLayout`-based page showing recent audit entries.

**List item display:**
- Table name (formatted: `student_modules` → `Student Modules`)
- Operation badge (INSERT = green, UPDATE = blue, DELETE = red)
- Record ID
- Changed by (user name)
- Changed at (relative time)

**Filters:**
- Table name dropdown (from `getDistinctTables`)
- Operation type (INSERT / UPDATE / DELETE)

### 5. Audit Detail Page

**Route:** `src/app/audit-logs/[id]/page.tsx`

`DetailsView`-based page showing:
- Full old/new JSON values with diff highlighting
- User details (name, email)
- Timestamp
- Table name and record ID
- Metadata (reasons, etc.)

### 6. Record Audit History Component

**`src/app/audit-logs/_components/RecordAuditHistory.tsx`**

Reusable component for embedding in any entity's detail page. **Must reuse logic from the existing `AuditHistoryTab.tsx`.**

#### Reuse Strategy

The existing `AuditHistoryTab.tsx` already contains solid logic that MUST be extracted and reused:

| Existing Logic | Reuse In |
|---------------|----------|
| `getChangedFields()` | `RecordAuditHistory` — diff extraction |
| `formatValue()` | `RecordAuditHistory` — value formatting |
| `formatFieldName()` | `RecordAuditHistory` — field label formatting |
| `ChangeItem` component | `RecordAuditHistory` — diff display |
| `DEFAULT_EXCLUDE_FIELDS` | `RecordAuditHistory` — default exclusions |
| Timeline layout | `RecordAuditHistory` — timeline UI |

**Implementation approach:**
1. Extract `getChangedFields`, `formatValue`, `formatFieldName`, and `DEFAULT_EXCLUDE_FIELDS` into `src/app/audit-logs/_lib/audit-utils.ts`
2. Extract `ChangeItem` into `src/app/audit-logs/_components/ChangeItem.tsx` (or keep inline if small)
3. Build `RecordAuditHistory` using these extracted utilities
4. `RecordAuditHistory` fetches its own data via TanStack Query (unlike `AuditHistoryTab` which receives data via props)
5. Deprecate `AuditHistoryTab` in Step 006 cleanup

```typescript
type RecordAuditHistoryProps = {
  tableName: string;
  recordId: string | number;
  fieldLabels?: Record<string, string>;
  excludeFields?: string[];
};
```

**Behavior:**
- TanStack Query fetches `getRecordHistory(tableName, recordId)`
- Timeline layout (Mantine `Timeline`)
- Shows old → new diffs per field
- User info and timestamp per entry
- Displays `metadata.reasons` if present
- Handles INSERT (all new values), UPDATE (diffs), DELETE (all old values)

### 7. Table Name Formatter Utility

Add to `src/shared/lib/utils/utils.ts`:

```typescript
function formatTableName(tableName: string): string {
  return tableName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
```

### 8. Integration into Detail Pages

Add `RecordAuditHistory` as a tab in key detail pages:

| Page | Table Name | Record ID |
|------|-----------|-----------|
| Student detail | `students` | `params.stdNo` |
| Student program detail | `student_programs` | `params.id` |
| Module detail | `modules` | `params.id` |
| Assessment detail | `assessments` | `params.id` |
| Application detail | `applications` | `params.id` |

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/audit-logs/_server/repository.ts` | Audit log repository |
| `src/app/audit-logs/_server/service.ts` | Role-based audit service |
| `src/app/audit-logs/_server/actions.ts` | Server actions |
| `src/app/audit-logs/_lib/audit-utils.ts` | Extracted diff/format utilities from AuditHistoryTab |
| `src/app/audit-logs/page.tsx` | Global audit log list |
| `src/app/audit-logs/layout.tsx` | Audit logs layout |
| `src/app/audit-logs/[id]/page.tsx` | Audit entry detail |
| `src/app/audit-logs/_components/RecordAuditHistory.tsx` | Reusable per-record component |

## Validation Criteria

1. Global page loads and displays recent audit entries
2. Filtering by table and operation works
3. Detail view shows old/new values with diff
4. `RecordAuditHistory` component works on student detail page
5. Role-based access is enforced
6. `pnpm tsc --noEmit` passes
