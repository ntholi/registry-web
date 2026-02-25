# Step 4: History Tab UI

Replace the existing "Audit" tab in the student detail page with a comprehensive "History" tab showing a role-scoped, unified timeline across all student-related tables.

**Prerequisites**: Steps 1-3 must be complete (`std_no` and `changed_by_role` populated on `audit_logs`).

---

## 4.1 Server layer: Repository

Create `src/app/registry/students/_server/history/repository.ts`:

This is a standalone repository (NOT extending BaseRepository) that queries `audit_logs` directly for student history.

### Method: `getStudentHistory`

```typescript
async getStudentHistory(params: {
  stdNo: number;
  role?: string;
  page: number;
  pageSize?: number;
  tableFilter?: string;
}): Promise<{ items: StudentHistoryEntry[]; totalPages: number; totalItems: number }>
```

**Query logic**:

```sql
SELECT
  al.id,
  al.table_name,
  al.record_id,
  al.operation,
  al.old_values,
  al.new_values,
  al.changed_by,
  al.changed_at,
  al.activity_type,
  al.changed_by_role,
  al.metadata,
  u.name as changed_by_name,
  u.image as changed_by_image
FROM audit_logs al
LEFT JOIN users u ON al.changed_by = u.id
WHERE al.std_no = $stdNo
  AND ($role IS NULL OR al.changed_by_role = $role)
  AND ($tableFilter IS NULL OR al.table_name = $tableFilter)
ORDER BY al.changed_at DESC
LIMIT $pageSize OFFSET ($page - 1) * $pageSize
```

Uses the `idx_audit_logs_std_no_role_date` composite index for fast queries.

### Method: `getStudentHistorySummary`

Returns activity counts grouped by `changed_by_role` for the filter chips:

```sql
SELECT changed_by_role, COUNT(*) as count
FROM audit_logs
WHERE std_no = $stdNo
  AND changed_by_role IS NOT NULL
GROUP BY changed_by_role
ORDER BY count DESC
```

### Method: `getStudentHistoryTableSummary`

Returns counts grouped by `table_name` for the table filter:

```sql
SELECT table_name, COUNT(*) as count
FROM audit_logs
WHERE std_no = $stdNo
  AND ($role IS NULL OR changed_by_role = $role)
GROUP BY table_name
ORDER BY count DESC
```

### Types

```typescript
interface StudentHistoryEntry {
  id: bigint;
  tableName: string;
  recordId: string;
  operation: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedAt: Date;
  activityType: string | null;
  changedByRole: string | null;
  changedByName: string | null;
  changedByImage: string | null;
  metadata: Record<string, unknown> | null;
}

interface RoleSummary {
  role: string;
  count: number;
}

interface TableSummary {
  tableName: string;
  label: string;
  count: number;
}
```

---

## 4.2 Server layer: Service

Create `src/app/registry/students/_server/history/service.ts`:

```typescript
class StudentHistoryService {
  constructor(private readonly repository = new StudentHistoryRepository()) {}

  async getHistory(stdNo: number, page: number, tableFilter?: string) {
    return withAuth(
      async (session) => {
        const role = this.resolveRoleFilter(session);
        return this.repository.getStudentHistory({
          stdNo,
          role,
          page,
          tableFilter,
        });
      },
      ['dashboard']
    );
  }

  async getSummary(stdNo: number) {
    return withAuth(
      async (session) => {
        const isAdmin = ['admin'].includes(session?.user?.role ?? '');
        if (isAdmin) {
          return this.repository.getStudentHistorySummary(stdNo);
        }
        return [];
      },
      ['admin']
    );
  }

  async getTableSummary(stdNo: number) {
    return withAuth(
      async (session) => {
        const role = this.resolveRoleFilter(session);
        return this.repository.getStudentHistoryTableSummary(stdNo, role);
      },
      ['dashboard']
    );
  }

  private resolveRoleFilter(session: Session | null): string | undefined {
    const role = session?.user?.role;
    if (role === 'admin') return undefined;
    return role ?? undefined;
  }
}
```

**Role scoping logic**:
- `admin` → sees everything (`role = undefined`, no filter)
- `registry` → sees only entries where `changed_by_role = 'registry'`
- `finance` → sees only entries where `changed_by_role = 'finance'`
- `academic` → sees only entries where `changed_by_role = 'academic'`
- etc.

---

## 4.3 Server layer: Actions

Create `src/app/registry/students/_server/history/actions.ts`:

```typescript
'use server';

export async function getStudentHistory(
  stdNo: number,
  page: number,
  tableFilter?: string
) {
  return service.getHistory(stdNo, page, tableFilter);
}

export async function getStudentHistoryTableSummary(stdNo: number) {
  return service.getTableSummary(stdNo);
}
```

---

## 4.4 UI: StudentHistoryView component

Create `src/app/registry/students/_components/history/StudentHistoryView.tsx`:

A client component that renders the unified timeline with:

### Layout
```
┌──────────────────────────────────────────┐
│ [Table Filter Chips]                     │
│ ┌─ Payment ─┐ ┌─ Module ─┐ ┌─ All ─┐   │
│ └───────────┘ └──────────┘ └────────┘   │
├──────────────────────────────────────────┤
│                                          │
│  Timeline                                │
│  ┌──────────────────────────────────┐    │
│  │ 👤 John Doe (Registry)          │    │
│  │    Student Record · UPDATE      │    │
│  │    Feb 24, 2026 at 10:30 AM     │    │
│  │    ┌─────────────────────────┐  │    │
│  │    │ status: Active → Susp.  │  │    │
│  │    │ reason: "..."           │  │    │
│  │    └─────────────────────────┘  │    │
│  ├──────────────────────────────────┤    │
│  │ 👤 Jane Smith (Finance)         │    │
│  │    Payment · INSERT             │    │
│  │    Feb 23, 2026 at 2:15 PM      │    │
│  │    ┌─────────────────────────┐  │    │
│  │    │ amount: M5,000          │  │    │
│  │    │ receipt: RC-2026-001    │  │    │
│  │    └─────────────────────────┘  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌── Pagination ──┐                      │
│  │  < 1 2 3 4 >   │                      │
│  └────────────────┘                      │
└──────────────────────────────────────────┘
```

### Component structure

```
StudentHistoryView (client)
├── TableFilterChips (filter by table_name)
│   └── Uses getStudentHistoryTableSummary()
├── HistoryTimeline (scrollable timeline)
│   ├── HistoryTimelineEntry (per audit record)
│   │   ├── Avatar + user info + role badge
│   │   ├── Table label + operation badge
│   │   ├── Relative time + formatted datetime
│   │   ├── Activity type label (if available)
│   │   └── Change details (field-by-field diff)
│   └── Empty state
└── Pagination
```

### Key UI details

1. **Role badge**: Colored chip next to user name showing their department (use `colors.ts` for department colors)
2. **Table label**: Use `STUDENT_AUDIT_TABLE_LABELS` from Step 1.8 for human-readable names
3. **Activity type label**: Use `getActivityLabel()` from the activity catalog (if available)
4. **Operation colors**: INSERT → green, UPDATE → blue, DELETE → red
5. **Change diff**: Reuse the `ChangeItem` pattern from existing `RecordAuditHistory.tsx` (extract it to shared if not already)
6. **Date formatting**: Use `formatRelativeTime()` for recent entries, `formatDateTime()` for older ones
7. **Pagination**: Use `Pagination` from `@/shared/ui/adease` or Mantine's `Pagination`
8. **Data fetching**: Use TanStack Query with `keepPreviousData` for smooth pagination

### Shared component extraction

The `ChangeItem` component from `RecordAuditHistory.tsx` should be extracted to `src/app/audit-logs/_components/ChangeItem.tsx` (or a shared location) so both `RecordAuditHistory` and `StudentHistoryView` can use it. This avoids duplication per project guidelines.

Similarly, extract the change detection logic (`getChangedFields`, `formatFieldName`, `formatValue` from `audit-utils.ts`) — these are already in `src/app/audit-logs/_lib/audit-utils.ts` and can be imported directly.

---

## 4.5 Update StudentTabs

In `src/app/registry/students/_components/StudentTabs.tsx`:

### Remove
- The `RecordAuditHistory` import
- The `showAuditHistory` variable
- The `Audit` tab and its panel

### Add
- Import `StudentHistoryView`
- Add `showHistory` visibility check (broader than old `showAuditHistory`):
  ```typescript
  const showHistory = [
    'admin', 'registry', 'finance', 'academic', 'library',
    'student_services', 'marketing', 'leap'
  ].includes(session?.user?.role ?? '');
  ```
- Add `History` tab and panel:
  ```tsx
  {showHistory && <TabsTab value='history'>History</TabsTab>}

  {showHistory && (
    <TabsPanel value='history' pt='xl' p='sm' key='history'>
      <StudentHistoryView
        stdNo={student.stdNo}
        isActive={activeTab === 'history'}
      />
    </TabsPanel>
  )}
  ```

### isActive optimization
Only fetch data when the tab is active (use `isActive` prop to control TanStack Query's `enabled` option):

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['student-history', stdNo, page, tableFilter],
  queryFn: () => getStudentHistory(stdNo, page, tableFilter),
  enabled: isActive,
  placeholderData: keepPreviousData,
});
```

---

## 4.6 Cleanup

After the History tab is working:

1. Check if `RecordAuditHistory` is still used elsewhere (e.g., in `EditStudentModal`, `EditStudentSemesterModal`, etc.). If those inline audit viewers are still needed, keep the component. Otherwise, remove it.
2. Remove any unused imports from `StudentTabs.tsx`

---

## Verification

1. `pnpm tsc --noEmit & pnpm lint:fix` → zero errors
2. Navigate to a student with audit history → History tab shows timeline
3. Log in as `registry` → History tab shows only registry actions
4. Log in as `finance` → History tab shows only finance actions
5. Log in as `admin` → History tab shows all actions
6. Filter by table (e.g., "Assessment Mark") → only marks shown
7. Pagination works, changes pages smoothly with `keepPreviousData`
8. Empty state displayed for students with no history
9. Change details show field-by-field diffs correctly
