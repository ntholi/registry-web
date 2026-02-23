# Step 3: Rebuild Activity Tracker UI

This step replaces the existing activity tracker with a new business-activity-oriented UI. Delete all existing files in the activity tracker module and rebuild from scratch.

**Prerequisite**: Steps 1 and 2 must be complete — `activity_type` must be populated in `audit_logs`.

---

## 3.1 Delete existing files

Delete the following files (they will all be rewritten):

```
src/app/admin/activity-tracker/_lib/department-tables.ts     ← DELETE (department = user role now)
src/app/admin/activity-tracker/_lib/types.ts                 ← DELETE (rewrite)
src/app/admin/activity-tracker/_server/repository.ts         ← DELETE (rewrite)
src/app/admin/activity-tracker/_server/service.ts            ← DELETE (rewrite)
src/app/admin/activity-tracker/_server/actions.ts            ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/EntityBreakdownChart.tsx  ← DELETE (replaced by ActivityBreakdownChart)
src/app/admin/activity-tracker/_components/DepartmentOverview.tsx    ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/EmployeeList.tsx          ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/DailyTrendsChart.tsx      ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/DateRangeFilter.tsx       ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/EmployeeDetailView.tsx    ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/ActivityTimeline.tsx      ← DELETE (rewrite)
src/app/admin/activity-tracker/_components/ActivityHeatmap.tsx       ← DELETE (rewrite)
src/app/admin/activity-tracker/page.tsx                              ← DELETE (rewrite)
src/app/admin/activity-tracker/[userId]/page.tsx                     ← DELETE (rewrite)
```

---

## 3.2 Rewrite types

Create `src/app/admin/activity-tracker/_lib/types.ts`:

```typescript
interface ActivitySummary {
  activityType: string;
  label: string;
  count: number;
}

interface EmployeeSummary {
  userId: string;
  name: string;
  image: string | null;
  totalActivities: number;
  topActivity: string;
}

interface EmployeeActivityBreakdown {
  activityType: string;
  label: string;
  count: number;
}

interface TimelineEntry {
  id: string;
  activityType: string;
  label: string;
  timestamp: Date;
  tableName: string;
  recordId: string;
}

interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

interface DailyTrend {
  date: string;
  activityType: string;
  count: number;
}

type TimePreset =
  | 'today'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

interface DateRange {
  start: Date;
  end: Date;
  preset: TimePreset;
}
```

---

## 3.3 Rewrite repository

Create `src/app/admin/activity-tracker/_server/repository.ts`:

New repository focused on `activityType` aggregation. All queries join `users` table for name/image, filter by `users.role` for department.

### Methods

#### `getDepartmentSummary(start: Date, end: Date, dept?: string)`
Count activities grouped by `activityType`, filtered by user role (department).

```sql
SELECT al.activity_type, COUNT(*) as count
FROM audit_logs al
JOIN users u ON al.changed_by = u.id
WHERE al.changed_at BETWEEN $start AND $end
  AND al.activity_type IS NOT NULL
  AND ($dept IS NULL OR u.role = $dept)
GROUP BY al.activity_type
ORDER BY count DESC
```

Returns: `ActivitySummary[]`

#### `getEmployeeList(start: Date, end: Date, page: number, search: string, dept?: string)`
Paginated list of users with their total activity count, top activity type. Sorted by count descending.

```sql
SELECT
  u.id as user_id,
  u.name,
  u.image,
  COUNT(*) as total_activities,
  MODE() WITHIN GROUP (ORDER BY al.activity_type) as top_activity
FROM audit_logs al
JOIN users u ON al.changed_by = u.id
WHERE al.changed_at BETWEEN $start AND $end
  AND al.activity_type IS NOT NULL
  AND ($dept IS NULL OR u.role = $dept)
  AND ($search IS NULL OR u.name ILIKE '%' || $search || '%')
GROUP BY u.id, u.name, u.image
ORDER BY total_activities DESC
LIMIT $limit OFFSET $offset
```

Returns: `{ items: EmployeeSummary[], totalPages: number, totalItems: number }`

#### `getEmployeeActivityBreakdown(userId: string, start: Date, end: Date)`
Activity counts per `activityType` for one user. For the bar chart.

```sql
SELECT activity_type, COUNT(*) as count
FROM audit_logs
WHERE changed_by = $userId
  AND changed_at BETWEEN $start AND $end
  AND activity_type IS NOT NULL
GROUP BY activity_type
ORDER BY count DESC
```

Returns: `EmployeeActivityBreakdown[]`

#### `getEmployeeTimeline(userId: string, start: Date, end: Date, page: number)`
Paginated list of recent audit_log entries for a user with `activityType` labels and timestamps.

```sql
SELECT id, activity_type, table_name, record_id, changed_at
FROM audit_logs
WHERE changed_by = $userId
  AND changed_at BETWEEN $start AND $end
  AND activity_type IS NOT NULL
ORDER BY changed_at DESC
LIMIT $limit OFFSET $offset
```

Returns: `{ items: TimelineEntry[], totalPages: number, totalItems: number }`

#### `getActivityHeatmap(userId: string, start: Date, end: Date)`
Day-of-week × hour-of-day counts for one user.

```sql
SELECT
  EXTRACT(DOW FROM changed_at) as day_of_week,
  EXTRACT(HOUR FROM changed_at) as hour,
  COUNT(*) as count
FROM audit_logs
WHERE changed_by = $userId
  AND changed_at BETWEEN $start AND $end
  AND activity_type IS NOT NULL
GROUP BY day_of_week, hour
```

Returns: `HeatmapCell[]`

#### `getDailyTrends(start: Date, end: Date, dept?: string)`
Daily activity counts, optionally by top N activity types.

```sql
SELECT
  DATE(changed_at) as date,
  activity_type,
  COUNT(*) as count
FROM audit_logs al
JOIN users u ON al.changed_by = u.id
WHERE al.changed_at BETWEEN $start AND $end
  AND al.activity_type IS NOT NULL
  AND ($dept IS NULL OR u.role = $dept)
GROUP BY date, activity_type
ORDER BY date
```

Returns: `DailyTrend[]`

---

## 3.4 Rewrite service

Create `src/app/admin/activity-tracker/_server/service.ts`:

Access control: admin role OR manager position. Simple wrappers calling the repository methods.

```typescript
class ActivityTrackerService {
  constructor(private readonly repository = new ActivityTrackerRepository()) {}

  async getDepartmentSummary(start: Date, end: Date, dept?: string) {
    return withAuth(
      async () => this.repository.getDepartmentSummary(start, end, dept),
      async (session) => this.canAccess(session)
    );
  }

  async getEmployeeList(start: Date, end: Date, page: number, search: string, dept?: string) {
    return withAuth(
      async () => this.repository.getEmployeeList(start, end, page, search, dept),
      async (session) => this.canAccess(session)
    );
  }

  // ... same pattern for remaining methods

  private canAccess(session: Session): boolean {
    return session.user?.role === 'admin' ||
      session.user?.position === 'manager';
  }
}
```

---

## 3.5 Rewrite actions

Create `src/app/admin/activity-tracker/_server/actions.ts`:

Server actions matching the service methods. Each action accepts serializable parameters (dates as strings, page numbers, etc.).

```typescript
'use server';

export async function getDepartmentSummary(start: string, end: string, dept?: string) {
  return service.getDepartmentSummary(new Date(start), new Date(end), dept);
}

export async function getEmployeeList(start: string, end: string, page: number, search: string, dept?: string) {
  return service.getEmployeeList(new Date(start), new Date(end), page, search, dept);
}

export async function getEmployeeActivityBreakdown(userId: string, start: string, end: string) {
  return service.getEmployeeActivityBreakdown(userId, new Date(start), new Date(end));
}

export async function getEmployeeTimeline(userId: string, start: string, end: string, page: number) {
  return service.getEmployeeTimeline(userId, new Date(start), new Date(end), page);
}

export async function getActivityHeatmap(userId: string, start: string, end: string) {
  return service.getActivityHeatmap(userId, new Date(start), new Date(end));
}

export async function getDailyTrends(start: string, end: string, dept?: string) {
  return service.getDailyTrends(new Date(start), new Date(end), dept);
}
```

---

## 3.6 Rewrite main page

Create `src/app/admin/activity-tracker/page.tsx`:

Server component with initial data load. Contains:

- Department selector (only for admins — managers see only their department)
- Time period filter with presets: Today, 7 days, 30 days, This Month, Last Month, This Quarter, This Year, Custom
- `DepartmentOverview` — Stat cards showing top activity types with counts
- `DailyTrendsChart` — Line chart of daily activity counts
- `EmployeeList` — Ranked table of employees by total activities

---

## 3.7 Rewrite `DateRangeFilter`

Create `src/app/admin/activity-tracker/_components/DateRangeFilter.tsx`:

Client component (`'use client'`). Preset buttons + custom date range picker (Mantine DatePickerInput). Calendar starts on Sunday. Dates formatted as YYYY-MM-DD strings.

Presets:
- **Today**: start=today 00:00, end=today 23:59
- **7 days**: start=today-7, end=today
- **30 days**: start=today-30, end=today
- **This Month**: start=first day of current month, end=today
- **Last Month**: start=first day of previous month, end=last day of previous month
- **This Quarter**: start=first day of current quarter, end=today
- **This Year**: start=Jan 1 of current year, end=today
- **Custom**: show date picker

Callback: `onChange(start: string, end: string, preset: TimePreset)`

---

## 3.8 Rewrite `DepartmentOverview`

Create `src/app/admin/activity-tracker/_components/DepartmentOverview.tsx`:

Client component. Grid of stat cards (Mantine `SimpleGrid` + `Paper`), each card showing:
- Activity type label
- Count (large number)
- Visual indicator (color-coded by count relative to total)

Sorted by count descending. Use activity labels from `getActivityLabel()`.

Data fetched via TanStack Query calling `getDepartmentSummary` action.

---

## 3.9 Rewrite `EmployeeList`

Create `src/app/admin/activity-tracker/_components/EmployeeList.tsx`:

Client component. Mantine `Table` with:
- Rank number
- Avatar + name
- Role badge
- Total activities (bold number)
- Top activity label

Paginated with SearchField. Clickable rows navigate to `/admin/activity-tracker/[userId]`.

Data fetched via TanStack Query calling `getEmployeeList` action.

---

## 3.10 Rewrite `DailyTrendsChart`

Create `src/app/admin/activity-tracker/_components/DailyTrendsChart.tsx`:

Client component. Line chart (Mantine Charts — `@mantine/charts` `AreaChart` or `LineChart`) showing daily total activities. Optionally stacked by top N activity types.

Data fetched via TanStack Query calling `getDailyTrends` action.

---

## 3.11 Rewrite employee detail page

Create `src/app/admin/activity-tracker/[userId]/page.tsx`:

Server component with initial data load. Contains:

- Header: User avatar, name, role, total activities in period
- `DateRangeFilter` (shared with main page)
- `ActivityBreakdownChart` — Horizontal bar chart of activity counts by type
- `ActivityHeatmap` — Day/hour heatmap
- `ActivityTimeline` — Paginated list of recent activities

---

## 3.12 Create `ActivityBreakdownChart`

Create `src/app/admin/activity-tracker/_components/ActivityBreakdownChart.tsx`:

Client component. Horizontal bar chart (Mantine Charts `BarChart` with `orientation="vertical"`). Each bar shows an activity type label and its count.

Data fetched via TanStack Query calling `getEmployeeActivityBreakdown` action.

---

## 3.13 Rewrite `ActivityHeatmap`

Create `src/app/admin/activity-tracker/_components/ActivityHeatmap.tsx`:

Client component. Day-of-week (rows: Sun–Sat) × hour-of-day (columns: 0–23) grid. Each cell colored by count intensity. Use Mantine's color scheme for dark mode compatibility.

Data fetched via TanStack Query calling `getActivityHeatmap` action.

---

## 3.14 Rewrite `ActivityTimeline`

Create `src/app/admin/activity-tracker/_components/ActivityTimeline.tsx`:

Client component. Paginated timeline (Mantine `Timeline` component). Each item shows:
- Activity type label (with color-coded badge)
- Timestamp (formatted via `@/shared/lib/utils/dates`)
- Optional record link (based on `tableName` + `recordId`)

Data fetched via TanStack Query calling `getEmployeeTimeline` action.

---

## 3.15 Rewrite `EmployeeDetailView`

Create `src/app/admin/activity-tracker/_components/EmployeeDetailView.tsx`:

Client component. Container for the employee detail page sections. Accepts userId and date range as props, renders:
1. `ActivityBreakdownChart`
2. `ActivityHeatmap`
3. `ActivityTimeline`

Uses shared `DateRangeFilter` and passes date range to all children.

---

## Final File Structure

```
src/app/admin/activity-tracker/
├── _lib/
│   ├── activity-types.ts          (from Step 2.1)
│   └── types.ts                   (Step 3.2)
├── _server/
│   ├── repository.ts              (Step 3.3)
│   ├── service.ts                 (Step 3.4)
│   └── actions.ts                 (Step 3.5)
├── _components/
│   ├── DateRangeFilter.tsx        (Step 3.7)
│   ├── DepartmentOverview.tsx     (Step 3.8)
│   ├── EmployeeList.tsx           (Step 3.9)
│   ├── DailyTrendsChart.tsx       (Step 3.10)
│   ├── ActivityBreakdownChart.tsx (Step 3.12)
│   ├── ActivityHeatmap.tsx        (Step 3.13)
│   ├── ActivityTimeline.tsx       (Step 3.14)
│   └── EmployeeDetailView.tsx     (Step 3.15)
├── page.tsx                        (Step 3.6)
└── [userId]/
    └── page.tsx                    (Step 3.11)
```

---

## Verification

After completing this step:

1. Run `pnpm tsc --noEmit & pnpm lint:fix` → fix all type errors
2. Verify main page: department summary shows activity types with counts, not table names
3. Verify daily trends chart renders
4. Verify employee list shows ranked users with activity counts
5. Verify employee detail: breakdown chart, heatmap, timeline all render
6. Verify non-admin manager can only see their department's data
7. Verify dark mode rendering for all components
8. Verify time presets calculate correct date ranges
