# Step 007d: Activity Tracker — Print Tracking

## Introduction

Add print activity tracking to the Employee Activity Tracker. The 3 print tables (`transcript_prints`, `statement_of_results_prints`, `student_card_prints`) already store `printedBy` (FK → users) and `printedAt`/`createdAt`, making them natural activity logs. Rather than enabling audit logging on these high-volume tables (which would bloat `audit_logs`), query the print tables directly — the same pattern used for clearance stats in Step 007a.

Print stats appear for **any department** whose employees have print records (not just registry), as a single "Total Prints" column with a tooltip/popover breakdown by type.

## Requirements

### 1. Repository Method

Add to `src/app/admin/activity-tracker/_server/repository.ts`:

#### `getPrintStats(dept, dateRange)`

Returns per-employee print counts across all 3 print types, queried directly from the print tables.

```typescript
type PrintEmployeeStats = {
  userId: string;
  transcripts: number;
  statements: number;
  studentCards: number;
  totalPrints: number;
};
```

**Query strategy**: Single query using `UNION ALL` subqueries to aggregate all 3 print tables:

```sql
SELECT 
  u.id AS user_id,
  COALESCE(p.transcripts, 0) AS transcripts,
  COALESCE(p.statements, 0) AS statements,
  COALESCE(p.student_cards, 0) AS student_cards,
  COALESCE(p.transcripts, 0) + COALESCE(p.statements, 0) + COALESCE(p.student_cards, 0) AS total_prints
FROM users u
LEFT JOIN (
  SELECT 
    printed_by,
    SUM(CASE WHEN source = 'transcript' THEN cnt ELSE 0 END) AS transcripts,
    SUM(CASE WHEN source = 'statement' THEN cnt ELSE 0 END) AS statements,
    SUM(CASE WHEN source = 'student_card' THEN cnt ELSE 0 END) AS student_cards
  FROM (
    SELECT printed_by, 'transcript' AS source, COUNT(*)::int AS cnt
    FROM transcript_prints
    WHERE printed_at BETWEEN $start AND $end
    GROUP BY printed_by
    UNION ALL
    SELECT printed_by, 'statement' AS source, COUNT(*)::int AS cnt
    FROM statement_of_results_prints
    WHERE printed_at BETWEEN $start AND $end
    GROUP BY printed_by
    UNION ALL
    SELECT printed_by, 'student_card' AS source, COUNT(*)::int AS cnt
    FROM student_card_prints
    WHERE created_at BETWEEN $start AND $end
    GROUP BY printed_by
  ) all_prints
  GROUP BY printed_by
) p ON p.printed_by = u.id
WHERE u.role = $dept
  AND (p.printed_by IS NOT NULL)
ORDER BY total_prints DESC
```

> **Note**: The `WHERE p.printed_by IS NOT NULL` ensures only employees with print activity are returned. Employees with zero prints are excluded from this query — the UI merges this data client-side with the main employee list, showing `—` for employees without prints.

> **Why not enable auditing?** The print tables are append-only logs that already track who printed what and when. Auditing them would create redundant `audit_logs` entries (INSERT-only, no updates/deletes) with full JSONB snapshots of print data — high volume with no added value. Querying the source tables directly is more efficient and provides richer data (per-type breakdown).

### 2. Service Method

Add to `ActivityTrackerService`:

```typescript
async getPrintStats(dateRange: DateRange) {
  return withAuth(async (session) => {
    const dept = this.resolveDepartment(session);
    return this.repository.getPrintStats(dept, dateRange);
  }, this.accessCheck);
}
```

### 3. Server Action

Add to `src/app/admin/activity-tracker/_server/actions.ts`:

```typescript
export async function getPrintStats(start: Date, end: Date) {
  return service.getPrintStats({ start, end });
}
```

### 4. Types

Add to `src/app/admin/activity-tracker/_lib/types.ts`:

```typescript
type PrintEmployeeStats = {
  userId: string;
  transcripts: number;
  statements: number;
  studentCards: number;
  totalPrints: number;
};
```

### 5. Frontend — Employee List Column

Add a **"Prints"** column to `EmployeeList.tsx` (from Step 007b):

| Column | Display | Behavior |
|--------|---------|----------|
| Prints | Total print count number | Tooltip/`HoverCard` on hover showing breakdown: "Transcripts: 12, Statements: 8, Student Cards: 5" |

**Implementation:**
- Fetch print stats via TanStack Query: `['activity-tracker', 'prints', startISO, endISO]`
- Merge with employee list data by `userId` on the client (same pattern as clearance)
- Show total as a `Badge` or plain number
- On hover, show `HoverCard` with breakdown:

```tsx
<HoverCard>
  <HoverCard.Target>
    <Text>{printStats.totalPrints}</Text>
  </HoverCard.Target>
  <HoverCard.Dropdown>
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm">Transcripts</Text>
        <Text size="sm" fw={600}>{printStats.transcripts}</Text>
      </Group>
      <Group justify="space-between">
        <Text size="sm">Statements</Text>
        <Text size="sm" fw={600}>{printStats.statements}</Text>
      </Group>
      <Group justify="space-between">
        <Text size="sm">Student Cards</Text>
        <Text size="sm" fw={600}>{printStats.studentCards}</Text>
      </Group>
    </Stack>
  </HoverCard.Dropdown>
</HoverCard>
```

- Employees with no print activity show `—`
- This column appears for **all departments** (any employee from any department could have print records)

### 6. No Schema/Migration Changes

The print tables remain unchanged. `auditEnabled = false` stays on the print repositories. No new indexes are needed — the existing `printedBy` indexes on all 3 tables support the aggregation queries.

## Expected Files (modified)

| File | Change |
|------|--------|
| `src/app/admin/activity-tracker/_server/repository.ts` | Add `getPrintStats` method |
| `src/app/admin/activity-tracker/_server/service.ts` | Add `getPrintStats` method |
| `src/app/admin/activity-tracker/_server/actions.ts` | Add `getPrintStats` action |
| `src/app/admin/activity-tracker/_lib/types.ts` | Add `PrintEmployeeStats` type |
| `src/app/admin/activity-tracker/_components/EmployeeList.tsx` | Add Prints column with HoverCard |

## Validation Criteria

1. Print stats query returns correct per-employee counts
2. HoverCard shows correct breakdown by type
3. Column appears for all departments
4. Employees without prints show `—`
5. `auditEnabled = false` remains on print repositories (no audit_logs bloat)
6. `pnpm tsc --noEmit` passes
7. `pnpm lint:fix` passes
