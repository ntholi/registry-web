# Step 005: Audit UI

## Introduction

This step creates the user interface for viewing and querying audit logs. It includes a global audit log viewer and per-entity audit history integration into existing detail pages.

## Context

The existing `AuditHistoryTab` component provides a timeline-based diff viewer. This step builds on that pattern but adapts it for the unified `audit_logs` table, and adds a global admin view for cross-table audit searches.

## Requirements

### 1. Repository & Service Layer

**`src/app/audit-logs/_server/repository.ts`**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `query` | `QueryOptions` with table/record filters | Paginated results | Global query with search |
| `findByRecord` | `tableName: string, recordId: string` | Audit entries with user info | Per-record history |
| `findByUser` | `userId: string, page, size` | Paginated results | All changes by a user |
| `findByTable` | `tableName: string, page, size` | Paginated results | All changes on a table |

**`src/app/audit-logs/_server/service.ts`**

Extends `BaseService` with role-based access:
- `admin` role: can query all audit logs
- Module-specific roles: can query their module's tables only

**`src/app/audit-logs/_server/actions.ts`**

| Action | Parameters | Description |
|--------|-----------|-------------|
| `getAuditLogs` | `page, search, tableName?, operation?` | Paginated global query |
| `getRecordHistory` | `tableName, recordId` | History for a specific record |
| `getUserActivity` | `userId, page` | All actions by a specific user |

### 2. Global Audit Log Page

**Route:** `src/app/audit-logs/page.tsx`

A `ListLayout`-based page showing recent audit entries across all tables.

**List Item Display:**
- Table name (formatted: `student_modules` → `Student Modules`)
- Operation badge (INSERT = green, UPDATE = blue, DELETE = red)
- Record ID
- Changed by (user name + avatar)
- Changed at (relative time, e.g., "5 minutes ago")

**Filters:**
- Table name dropdown (populated from distinct `table_name` values)
- Operation type (INSERT / UPDATE / DELETE)
- Date range
- User filter

### 3. Record History Component

**`src/app/audit-logs/_components/RecordAuditHistory.tsx`**

A reusable component that can be embedded in any entity's detail page to show its audit trail.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `tableName` | `string` | Database table name |
| `recordId` | `string \| number` | Primary key value |
| `fieldLabels?` | `Record<string, string>` | Human-readable field name overrides |
| `excludeFields?` | `string[]` | Fields to hide from diff view |

**Behavior:**
- Uses TanStack Query to fetch `getRecordHistory(tableName, recordId)`
- Renders a Timeline (same pattern as existing `AuditHistoryTab`)
- Shows old → new value diffs per field
- Shows the user who made the change
- Displays `metadata.reasons` if present (migrated from legacy `reasons` field)
- Handles INSERT (show all new values), UPDATE (show diffs), DELETE (show all old values)

### 4. Integration into Existing Detail Pages

Add the `RecordAuditHistory` component as a tab in these key detail pages:

| Page | Table Name | Record ID Source |
|------|-----------|------------------|
| Student detail | `students` | `params.stdNo` |
| Student program detail | `student_programs` | `params.id` |
| Module detail | `modules` | `params.id` |
| Assessment detail | `assessments` | `params.id` |
| Application detail | `applications` | `params.id` |
| Sponsor detail | `sponsors` | `params.id` |
| Book detail | `books` | `params.id` |
| Registration request detail | `registration_requests` | `params.id` |

### 5. Audit Log Detail View

**Route:** `src/app/audit-logs/[id]/page.tsx`

When clicking on an audit entry in the global list, show:
- Full old/new JSON values with diff highlighting
- User details (name, email, avatar)
- Timestamp
- Table name and record ID (linked to the actual record)

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/audit-logs/_server/repository.ts` | New unified audit log repository |
| `src/app/audit-logs/_server/service.ts` | Audit log service with role-based access |
| `src/app/audit-logs/_server/actions.ts` | Server actions for audit queries |
| `src/app/audit-logs/page.tsx` | Global audit log list page |
| `src/app/audit-logs/layout.tsx` | Layout for audit logs section |
| `src/app/audit-logs/[id]/page.tsx` | Audit entry detail view |
| `src/app/audit-logs/_components/RecordAuditHistory.tsx` | Reusable per-record audit component |

## Validation Criteria

1. Global audit log page loads and displays recent entries
2. Filtering by table, operation, and user works
3. Clicking an entry shows the full detail view with diff
4. `RecordAuditHistory` component works on student detail page
5. Role-based access is enforced (registry users can't see finance audit logs)
6. `pnpm tsc --noEmit` passes

## Notes

- The existing `AuditHistoryTab` component can be refactored into the new `RecordAuditHistory` or kept as a wrapper
- Table name formatting should use a utility function (e.g., `snake_case` → `Title Case`)
- Consider pagination for records with many audit entries
- The global view should default to the last 24 hours to avoid loading too much data
- Use Mantine's `Timeline` component for the history view (consistent with existing pattern)
