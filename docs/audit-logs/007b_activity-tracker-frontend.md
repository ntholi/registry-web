# Step 007b: Activity Tracker — Frontend

## Introduction

Build the UI for the Employee Activity Tracker at `/admin/activity-tracker`. The interface provides department managers with a combined dashboard (aggregate charts at top) and employee list (below), with drill-down into individual employee activity. Time range defaults to last 7 days with selectable presets (today, 7d, 30d, custom).

## Requirements

### 1. Navigation Entry

Add to `src/app/admin/admin.config.ts`:

```typescript
{
  label: 'Activity Tracker',
  href: '/admin/activity-tracker',
  icon: IconActivity,  // from @tabler/icons-react
  roles: ['admin', 'registry', 'finance', 'library', 'resource', 'academic', 'marketing', 'student_services'],
  isVisible: (session) => session?.user?.position === 'manager' || session?.user?.role === 'admin',
},
```

> **Access control**: The `roles` array allows all department roles, but `isVisible` restricts the nav item to managers and admins only. Server-side access is enforced by the service layer.

### 2. Route Structure

```
src/app/admin/activity-tracker/
├── page.tsx                          # Dashboard + Employee list
├── [userId]/
│   └── page.tsx                      # Individual employee detail
└── _components/
    ├── DateRangeFilter.tsx            # Time range preset selector
    ├── DepartmentOverview.tsx         # Aggregate stats cards
    ├── DailyTrendsChart.tsx           # Line chart: daily operations over time
    ├── EmployeeList.tsx               # Sortable employee table with stats
    ├── EmployeeDetailView.tsx         # Individual employee detail layout
    ├── EntityBreakdownChart.tsx       # Bar/pie chart: operations by table
    ├── ActivityHeatmap.tsx            # Hour × Day-of-week heatmap
    └── ActivityTimeline.tsx           # Chronological activity feed
```

### 3. Date Range Filter Component

**`_components/DateRangeFilter.tsx`** — Client component

A `SegmentedControl` with presets: `Today`, `7 Days`, `30 Days`, `Custom`. When "Custom" is selected, show a `DatePickerInput` for start/end dates.

```typescript
type DateRangeFilterProps = {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
};
```

**Behavior:**
- Default: "7 Days" selected, range = `[now - 7d, now]`
- Presets calculate the range automatically
- "Custom" reveals a `DatePickerInput` with `type="range"`
- Calendar starts on Sunday per project conventions
- Store preset state in URL search params (`?range=7d` or `?start=2026-02-15&end=2026-02-22`) for shareable links

### 4. Main Dashboard Page

**Route:** `src/app/admin/activity-tracker/page.tsx` — Client component

Layout (top to bottom):
1. **Header**: "Activity Tracker" title + `DateRangeFilter` on the right
2. **Department Overview cards** (4 stat cards in a row)
3. **Daily Trends chart** (full width)
4. **Employee List** (table below)

All data is fetched via TanStack Query, keyed by the current date range. When the range changes, all queries refetch.

```typescript
// Query keys follow the pattern:
['activity-tracker', 'summary', startISO, endISO]
['activity-tracker', 'trends', startISO, endISO]
['activity-tracker', 'employees', startISO, endISO, page, search]
```

### 5. Department Overview Component

**`_components/DepartmentOverview.tsx`** — Client component

Four `Paper`/`Card` components in a `SimpleGrid cols={4}`:

| Card | Value | Icon | Color |
|------|-------|------|-------|
| Total Operations | `summary.totalOperations` | `IconActivity` | blue |
| Active Employees | `summary.activeEmployees` / `summary.totalEmployees` | `IconUsers` | green |
| Creates | `summary.operationsByType.inserts` | `IconPlus` | teal |
| Updates | `summary.operationsByType.updates` | `IconPencil` | indigo |

Each card shows:
- Large number (value)
- Label below
- Subtle icon on the right
- Dark-mode compatible colors (use `var(--mantine-color-*)` tokens)

### 6. Daily Trends Chart

**`_components/DailyTrendsChart.tsx`** — Client component

Line chart showing daily operation counts over the selected date range. Uses **Mantine Charts** (`@mantine/charts` with Recharts):

```typescript
import { LineChart } from '@mantine/charts';
```

- X-axis: Date labels (formatted as `MMM DD`)
- Y-axis: Operation count
- Series: Total (primary), Inserts (teal), Updates (indigo), Deletes (red)
- Responsive, auto-scales
- Tooltip on hover showing exact counts

Data source: `getDailyTrends(start, end)` via TanStack Query.

### 7. Employee List Component

**`_components/EmployeeList.tsx`** — Client component

A Mantine `Table` (not `ListLayout` — this is a data table, not a master-detail list) showing department employees:

| Column | Source | Sortable |
|--------|--------|----------|
| Employee | `name` + `email` with `Avatar` | — |
| Total Ops | `totalOperations` | Via query |
| Creates | `inserts` | — |
| Updates | `updates` | — |
| Deletes | `deletes` | — |
| Last Active | `lastActiveAt` (relative time) | Via query |

**Features:**
- Search input at top (filters by name/email, debounced)
- Pagination at bottom
- Click row → navigates to `/admin/activity-tracker/[userId]`
- Rows sorted by `totalOperations DESC` by default
- Zero-activity employees show with `0` counts (they're still listed via LEFT JOIN)
- `Avatar` with user image, fallback to initials

### 8. Employee Detail Page

**Route:** `src/app/admin/activity-tracker/[userId]/page.tsx` — Client component

Layout:
1. **Header**: Back button + Employee name/avatar + `DateRangeFilter`
2. **Summary row**: Stat cards (total ops, creates, updates, deletes)
3. **Two-column grid**:
   - Left: Entity Breakdown chart (bar chart of operations by table)
   - Right: Activity Heatmap (hour × day-of-week grid)
4. **Activity Timeline**: Chronological feed of recent actions (paginated)

All data fetched via TanStack Query with the employee's `userId` and current date range.

### 9. Entity Breakdown Chart

**`_components/EntityBreakdownChart.tsx`** — Client component

Horizontal bar chart showing which tables/entities the employee operates on most:

```typescript
import { BarChart } from '@mantine/charts';
```

- Y-axis: Table names (formatted via `formatTableName`)
- X-axis: Operation count
- Stacked bars: Inserts (teal), Updates (indigo), Deletes (red)
- Top 10 tables, sorted by total count DESC
- Data source: `getEntityBreakdown(userId, start, end)`

### 10. Activity Heatmap

**`_components/ActivityHeatmap.tsx`** — Client component

A 7×24 grid (days × hours) showing when the employee is most active:

- Rows: Days of the week (Sunday → Saturday)
- Columns: Hours (0–23)
- Cell color intensity: proportional to the count (use `var(--mantine-color-blue-*)` with opacity scaling)
- Tooltip on hover: "Monday 14:00 — 23 operations"

**Implementation**: Use a Mantine `SimpleGrid` or plain CSS Grid with `Box` elements. Each cell's background is calculated:

```typescript
const maxCount = Math.max(...data.map(d => d.count));
const opacity = count / maxCount;
// bg = `rgba(var(--mantine-color-blue-6-rgb), ${opacity})`
```

Alternatively, use Mantine's `color` system: `blue.0` through `blue.9` mapped to count intensity buckets.

Data source: `getActivityHeatmap(userId, start, end)`

### 11. Activity Timeline

**`_components/ActivityTimeline.tsx`** — Client component

Paginated chronological feed showing recent actions by the employee. Uses Mantine `Timeline`:

Each timeline item shows:
- Operation badge (INSERT/UPDATE/DELETE with color)
- Table name (formatted)
- Record ID
- Timestamp (relative time, e.g., "2 hours ago")
- On expand/click: show changed fields diff (reuse `getChangedFields`, `formatFieldName`, `formatValue` from `audit-logs/_lib/audit-utils.ts`)

Data source: `getEmployeeTimeline(userId, start, end, page)` with `Pagination` at the bottom.

> **Reuse**: Import diff utilities from `@audit-logs/_lib/audit-utils` — do NOT reimplement.

### 12. Admin Department Selector

When the logged-in user has `role = 'admin'`, show a `Select` dropdown at the top of the dashboard allowing them to pick which department to view:

```typescript
const departments: { value: string; label: string }[] = [
  { value: 'all', label: 'All Departments' },
  { value: 'registry', label: 'Registry' },
  { value: 'finance', label: 'Finance' },
  { value: 'academic', label: 'Academic' },
  { value: 'library', label: 'Library' },
  { value: 'resource', label: 'Resource' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'student_services', label: 'Student Services' },
  { value: 'leap', label: 'LEAP' },
];
```

Default: "All Departments". The selected department is passed to all queries. Store in URL search param (`?dept=registry`).

For non-admin managers, this dropdown is hidden — they always see their own department.

### 13. Empty/Loading States

- **Loading**: Use `Skeleton` components matching the layout shape (card skeletons, table row skeletons, chart placeholder)
- **No data**: Show `Center` with `IconActivityOff` + "No activity found for this period" message
- **No employees**: "No employees found in this department"
- **Error**: Mantine `Alert` with error message and retry button

### 14. Responsive Design

- Stat cards: `SimpleGrid cols={{ base: 2, sm: 4 }}`
- Charts: Full width, minimum height 300px
- Employee detail two-column: `Grid cols={{ base: 1, md: 2 }}`
- Heatmap: Horizontally scrollable on mobile
- Table: Horizontally scrollable on mobile

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/activity-tracker/page.tsx` | Main dashboard: overview + employee list |
| `src/app/admin/activity-tracker/[userId]/page.tsx` | Individual employee detail |
| `src/app/admin/activity-tracker/_components/DateRangeFilter.tsx` | Time range preset selector |
| `src/app/admin/activity-tracker/_components/DepartmentOverview.tsx` | Aggregate stat cards |
| `src/app/admin/activity-tracker/_components/DailyTrendsChart.tsx` | Line chart: daily trends |
| `src/app/admin/activity-tracker/_components/EmployeeList.tsx` | Employee table with stats |
| `src/app/admin/activity-tracker/_components/EmployeeDetailView.tsx` | Employee detail layout |
| `src/app/admin/activity-tracker/_components/EntityBreakdownChart.tsx` | Bar chart: operations by entity |
| `src/app/admin/activity-tracker/_components/ActivityHeatmap.tsx` | Hour × Day heatmap |
| `src/app/admin/activity-tracker/_components/ActivityTimeline.tsx` | Chronological activity feed |

## Validation Criteria

1. Navigation item appears only for managers and admins
2. Dashboard loads with correct department-scoped data
3. Date range presets work (today, 7d, 30d, custom)
4. Employee list is searchable and paginated
5. Clicking an employee navigates to detail page
6. All charts render correctly with real data
7. Heatmap intensity scales correctly
8. Activity timeline shows diffs (reuses audit-utils)
9. Admin can switch departments
10. Non-managers cannot access the pages
11. Dark mode renders correctly
12. `pnpm tsc --noEmit` passes
13. `pnpm lint:fix` passes
