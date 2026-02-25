# Step 007a: Activity Tracker — Backend

## Introduction

Build the server-side infrastructure for the **Employee Activity Tracker** — a feature that allows department managers (users with `position = 'manager'`) to monitor their department employees' work activity based on audit logs. The tracker aggregates `audit_logs` data per user, scoped by the manager's department (derived from their `role` field).

**Route**: `/admin/activity-tracker`
**Access**: Users with `position = 'manager'` or role `admin`
**Scoping**: A manager with `role = 'registry'` sees activity for all users with `role = 'registry'`. An `admin` sees all departments.

## Requirements

### 1. Department-to-Tables Mapping

Define a mapping from department roles to the tables they primarily operate on. This powers the "Activity by Entity" metric and allows filtering relevant vs. irrelevant audit entries.

Create `src/app/admin/activity-tracker/_lib/department-tables.ts`:

```typescript
import type { DashboardUser } from '@auth/users/_schema/users';

const departmentTables: Record<DashboardUser, string[]> = {
  registry: [
    'students',
    'student_programs',
    'student_semesters',
    'student_modules',
    'registration_requests',
    'clearances',
    'graduation_lists',
  ],
  finance: [
    'sponsors',
    'sponsor_allocations',
    'student_sponsors',
    'blocked_students',
    'clearances',
  ],
  academic: [
    'modules',
    'semester_modules',
    'assessments',
    'assessment_marks',
    'programs',
    'structure_semesters',
  ],
  library: [
    'loans',
    'loan_renewals',
    'clearances',
  ],
  resource: [
    'venues',
    'clearances',
  ],
  marketing: [
    'applications',
  ],
  student_services: [
    'clearances',
  ],
  admin: [],
  leap: [],
};

function getTablesForDepartment(dept: DashboardUser): string[] {
  return departmentTables[dept] ?? [];
}
```

> **Note**: This mapping is advisory — the activity tracker shows ALL audit entries by department employees, regardless of which table they modified. The mapping can optionally be used to highlight "core" vs. "other" department activity.

### 2. Repository Layer

Create `src/app/admin/activity-tracker/_server/repository.ts`:

```typescript
class ActivityTrackerRepository {
  // No BaseRepository — read-only queries on audit_logs + users
}
```

This repository does NOT extend `BaseRepository` (it's a read-only analytics layer querying `audit_logs` and `users`). It imports `db` directly as permitted for repository files.

#### Key Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getDepartmentSummary` | `dept, dateRange` | `DepartmentSummary` | Aggregate stats for the entire department |
| `getEmployeeList` | `dept, dateRange, page, search` | Paginated `EmployeeSummary[]` | List of employees with activity stats |
| `getEmployeeActivity` | `userId, dateRange` | `EmployeeActivity` | Detailed activity for a single employee |
| `getEmployeeTimeline` | `userId, dateRange, page` | Paginated audit entries | Chronological activity feed |
| `getActivityHeatmap` | `userId, dateRange` | `HeatmapData` | Hour-of-day × day-of-week activity distribution |
| `getDailyTrends` | `dept, dateRange` | `DailyTrend[]` | Daily operation counts for trend charts |
| `getEntityBreakdown` | `userId, dateRange` | `EntityBreakdown[]` | Operations grouped by table name |
| `getClearanceStats` | `dept, dateRange` | `ClearanceEmployeeStats[]` | Per-employee clearance approved/rejected/pending counts (clearance departments only) |

#### `getDepartmentSummary(dept, dateRange)`

Returns aggregate stats for the manager's department:

```typescript
type DepartmentSummary = {
  totalOperations: number;
  totalEmployees: number;
  activeEmployees: number;
  operationsByType: {
    inserts: number;
    updates: number;
    deletes: number;
  };
  topTables: Array<{ tableName: string; count: number }>;
};
```

**Query strategy**: Single query joining `audit_logs` with `users` where `users.role = dept` and `audit_logs.changed_at` within the date range. Uses `COUNT(*)` with `FILTER` for operation type breakdown. A subquery counts distinct `changed_by` for active employees. `topTables` uses `GROUP BY table_name ORDER BY count DESC LIMIT 5`.

#### `getEmployeeList(dept, dateRange, page, search)`

Returns a paginated list of department employees with their activity summary:

```typescript
type EmployeeSummary = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  totalOperations: number;
  lastActiveAt: Date | null;
  inserts: number;
  updates: number;
  deletes: number;
};
```

**Query strategy**: 
```sql
SELECT 
  u.id, u.name, u.email, u.image,
  COUNT(a.id)::int AS total_operations,
  MAX(a.changed_at) AS last_active_at,
  COUNT(*) FILTER (WHERE a.operation = 'INSERT')::int AS inserts,
  COUNT(*) FILTER (WHERE a.operation = 'UPDATE')::int AS updates,
  COUNT(*) FILTER (WHERE a.operation = 'DELETE')::int AS deletes
FROM users u
LEFT JOIN audit_logs a 
  ON a.changed_by = u.id 
  AND a.changed_at >= $startDate 
  AND a.changed_at <= $endDate
WHERE u.role = $dept
  AND (u.name ILIKE $search OR u.email ILIKE $search)
GROUP BY u.id
ORDER BY total_operations DESC
LIMIT $size OFFSET $offset
```

This is a single query with no sequential DB calls.

#### `getEmployeeActivity(userId, dateRange)`

Returns detailed metrics for a single employee:

```typescript
type EmployeeActivity = {
  user: { id: string; name: string | null; email: string | null; image: string | null };
  totalOperations: number;
  operationsByType: { inserts: number; updates: number; deletes: number };
  topTables: Array<{ tableName: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
};
```

**Query strategy**: Two parallel queries (can be run concurrently with `Promise.all`):
1. Aggregate stats: `COUNT(*)` with `FILTER` by operation type + `GROUP BY table_name` for top tables
2. Daily activity: `GROUP BY DATE(changed_at)` for chart data

#### `getActivityHeatmap(userId, dateRange)`

Returns activity distribution by hour-of-day and day-of-week:

```typescript
type HeatmapData = Array<{
  dayOfWeek: number;  // 0=Sunday, 6=Saturday
  hour: number;       // 0-23
  count: number;
}>;
```

**Query**:
```sql
SELECT 
  EXTRACT(DOW FROM changed_at) AS day_of_week,
  EXTRACT(HOUR FROM changed_at) AS hour,
  COUNT(*)::int AS count
FROM audit_logs
WHERE changed_by = $userId
  AND changed_at BETWEEN $start AND $end
GROUP BY day_of_week, hour
ORDER BY day_of_week, hour
```

#### `getDailyTrends(dept, dateRange)`

Aggregates daily operation counts across all department employees for trend visualization:

```typescript
type DailyTrend = {
  date: string;       // YYYY-MM-DD
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
};
```

**Query**:
```sql
SELECT 
  DATE(a.changed_at) AS date,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE a.operation = 'INSERT')::int AS inserts,
  COUNT(*) FILTER (WHERE a.operation = 'UPDATE')::int AS updates,
  COUNT(*) FILTER (WHERE a.operation = 'DELETE')::int AS deletes
FROM audit_logs a
INNER JOIN users u ON u.id = a.changed_by
WHERE u.role = $dept
  AND a.changed_at BETWEEN $start AND $end
GROUP BY DATE(a.changed_at)
ORDER BY date
```

#### `getEntityBreakdown(userId, dateRange)`

Groups operations by table for a specific employee:

```typescript
type EntityBreakdown = {
  tableName: string;
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
};
```

#### `getEmployeeTimeline(userId, dateRange, page)`

Paginated chronological feed of an employee's recent actions (reuses the same query pattern as `AuditLogRepository.findByUser` but with date range filtering).

#### `getClearanceStats(dept, dateRange)`

**Clearance departments only** (`finance`, `library`, `resource`). Returns per-employee clearance processing stats queried from the `clearance` table directly (not from `audit_logs`). This replaces the functionality in `reports/clearance/`.

```typescript
type ClearanceEmployeeStats = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  approved: number;
  rejected: number;
  pending: number;
  total: number;
  approvalRate: number;
};
```

**Query**:
```sql
SELECT 
  u.id AS user_id,
  u.name,
  u.email,
  u.image,
  COUNT(*) FILTER (WHERE c.status = 'approved')::int AS approved,
  COUNT(*) FILTER (WHERE c.status = 'rejected')::int AS rejected,
  COUNT(*) FILTER (WHERE c.status = 'pending')::int AS pending,
  COUNT(c.id)::int AS total,
  CASE 
    WHEN COUNT(c.id) > 0 
    THEN ROUND(COUNT(*) FILTER (WHERE c.status = 'approved') * 100.0 / COUNT(c.id))::int 
    ELSE 0 
  END AS approval_rate
FROM users u
LEFT JOIN clearance c 
  ON c.responded_by = u.id 
  AND c.department = $dept
  AND c.response_date BETWEEN $start AND $end
WHERE u.role = $dept
GROUP BY u.id
ORDER BY total DESC
```

> **Why query clearance directly?** The `audit_logs` table tracks that a clearance record was created/updated, but does NOT capture the semantic outcome (approved vs. rejected vs. pending). That data lives in the `clearance` table's `status` column. This is a targeted domain query that complements the generic audit-based activity tracking.

> **This replaces** `reports/clearance/_server/repository.ts` → `getClearanceStatsByDepartment()` and `reports/clearance/_server/service.ts` → `getDepartmentClearanceStats()`. The data shape is equivalent but integrated into the activity tracker context.

**Clearance departments constant** (shared with frontend):
```typescript
const CLEARANCE_DEPARTMENTS: DashboardUser[] = ['finance', 'library', 'resource'];

function isClearanceDepartment(dept: string): boolean {
  return CLEARANCE_DEPARTMENTS.includes(dept as DashboardUser);
}
```

### 3. Types

Create `src/app/admin/activity-tracker/_lib/types.ts`:

```typescript
type DateRange = {
  start: Date;
  end: Date;
};

type TimePreset = 'today' | '7d' | '30d' | 'custom';

type DepartmentSummary = { ... };  // as above
type EmployeeSummary = { ... };    // as above
type EmployeeActivity = { ... };   // as above
type HeatmapData = { ... };        // as above
type DailyTrend = { ... };         // as above
type EntityBreakdown = { ... };    // as above
type ClearanceEmployeeStats = { ... };  // as above
```

### 4. Service Layer

Create `src/app/admin/activity-tracker/_server/service.ts`:

The service enforces access control: only users with `position = 'manager'` or `role = 'admin'` can access. A manager is automatically scoped to their department (their `role`).

```typescript
class ActivityTrackerService {
  constructor(private readonly repository = new ActivityTrackerRepository()) {}

  async getDepartmentSummary(dateRange: DateRange) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      return this.repository.getDepartmentSummary(dept, dateRange);
    }, this.accessCheck);
  }

  async getEmployeeList(dateRange: DateRange, page: number, search: string) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      return this.repository.getEmployeeList(dept, dateRange, page, search);
    }, this.accessCheck);
  }

  async getEmployeeActivity(userId: string, dateRange: DateRange) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      // Verify the target user belongs to the manager's department
      // (admin can view any user)
      return this.repository.getEmployeeActivity(userId, dateRange);
    }, this.accessCheck);
  }

  async getEmployeeTimeline(userId: string, dateRange: DateRange, page: number) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      return this.repository.getEmployeeTimeline(userId, dateRange, page);
    }, this.accessCheck);
  }

  async getActivityHeatmap(userId: string, dateRange: DateRange) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      return this.repository.getActivityHeatmap(userId, dateRange);
    }, this.accessCheck);
  }

  async getDailyTrends(dateRange: DateRange) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      return this.repository.getDailyTrends(dept, dateRange);
    }, this.accessCheck);
  }

  async getEntityBreakdown(userId: string, dateRange: DateRange) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      return this.repository.getEntityBreakdown(userId, dateRange);
    }, this.accessCheck);
  }

  async getClearanceStats(dateRange: DateRange) {
    return withAuth(async (session) => {
      const dept = this.resolveDepartment(session);
      if (dept !== 'all' && !isClearanceDepartment(dept)) {
        throw new Error('Clearance stats not available for this department');
      }
      return this.repository.getClearanceStats(dept, dateRange);
    }, this.accessCheck);
  }

  private accessCheck = async (session: Session): Promise<boolean> => {
    if (session.user.role === 'admin') return true;
    return session.user.position === 'manager';
  };

  private resolveDepartment(session: Session | null): string {
    if (!session?.user) throw new Error('Unauthorized');
    if (session.user.role === 'admin') return 'all';
    return session.user.role;
  }
}

export const activityTrackerService = serviceWrapper(new ActivityTrackerService());
```

> **Department scoping**: `resolveDepartment` returns the user's role as the department. For `admin` users it returns `'all'`, which tells the repository to skip the department filter. The repository methods accept `dept: string` — when `dept === 'all'`, the `WHERE u.role = $dept` clause is omitted.

> **Cross-department guard**: `getEmployeeActivity` and similar per-user methods must verify the target employee's role matches the manager's department. Admins bypass this check.

### 5. Server Actions

Create `src/app/admin/activity-tracker/_server/actions.ts`:

```typescript
'use server';

import { activityTrackerService as service } from './service';

export async function getDepartmentSummary(start: Date, end: Date) {
  return service.getDepartmentSummary({ start, end });
}

export async function getEmployeeList(
  start: Date,
  end: Date,
  page: number,
  search: string
) {
  return service.getEmployeeList({ start, end }, page, search);
}

export async function getEmployeeDetail(
  userId: string,
  start: Date,
  end: Date
) {
  return service.getEmployeeActivity(userId, { start, end });
}

export async function getEmployeeTimeline(
  userId: string,
  start: Date,
  end: Date,
  page: number
) {
  return service.getEmployeeTimeline(userId, { start, end }, page);
}

export async function getActivityHeatmap(
  userId: string,
  start: Date,
  end: Date
) {
  return service.getActivityHeatmap(userId, { start, end });
}

export async function getDailyTrends(start: Date, end: Date) {
  return service.getDailyTrends({ start, end });
}

export async function getEntityBreakdown(
  userId: string,
  start: Date,
  end: Date
) {
  return service.getEntityBreakdown(userId, { start, end });
}

export async function getClearanceStats(start: Date, end: Date) {
  return service.getClearanceStats({ start, end });
}
```

### 6. Session Type Extension

The `session.user.position` field must be available in the session. Verify that the `next-auth.d.ts` type declaration includes `position`:

```typescript
declare module 'next-auth' {
  interface User {
    role: UserRole;
    position: UserPosition | null;
    // ...existing fields
  }
}
```

If `position` is not currently included in the session callback in `src/core/auth.ts`, add it:

```typescript
session({ session, user }) {
  session.user.id = user.id;
  session.user.role = user.role;
  session.user.position = user.position;  // ← Ensure this exists
  return session;
}
```

### 7. Database Index Consideration

The activity tracker queries heavily filter on `changed_by` + `changed_at` together. The existing indexes (`idx_audit_logs_changed_by` on `changed_by` alone and `idx_audit_logs_changed_at` on `changed_at` alone) may not be optimal for range queries scoped to a user.

**Recommended composite index** (generate via `pnpm db:generate`):

```sql
CREATE INDEX idx_audit_logs_user_date 
  ON audit_logs (changed_by, changed_at DESC);
```

Add this to the schema indexes in `src/core/database/schema/auditLogs.ts`:

```typescript
index('idx_audit_logs_user_date').on(table.changedBy, table.changedAt),
```

This index covers:
- `getEmployeeActivity` — `WHERE changed_by = $userId AND changed_at BETWEEN ...`
- `getEmployeeTimeline` — same filter + `ORDER BY changed_at DESC`
- `getActivityHeatmap` — same filter
- `getEntityBreakdown` — same filter + `GROUP BY table_name`

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/activity-tracker/_lib/types.ts` | Type definitions for all analytics data shapes |
| `src/app/admin/activity-tracker/_lib/department-tables.ts` | Department → table mapping (optional enrichment) |
| `src/app/admin/activity-tracker/_server/repository.ts` | Read-only analytics queries on audit_logs + users |
| `src/app/admin/activity-tracker/_server/service.ts` | Access control + department scoping |
| `src/app/admin/activity-tracker/_server/actions.ts` | Server actions for client consumption |

## Validation Criteria

1. `pnpm tsc --noEmit` passes
2. `pnpm lint:fix` passes
3. All actions return correct data when called by a manager
4. Department scoping works: registry manager only sees registry employees
5. Admin sees all departments
6. Non-managers are denied access
7. Date range filtering works correctly
8. Queries perform efficiently (no N+1, single query per method where possible)
