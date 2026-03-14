# Admin Module — Permission Map

## Navigation (admin.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Tasks | `roles: ['admin', 'registry', 'finance']` | — |
| Users | `roles: ['admin']` | — |
| Permission Presets | `roles: ['admin']` | `permissions: [{ resource: 'permission-presets', action: 'read' }]` |
| Notifications | `roles: ['admin']` | — |
| Activity Tracker | `roles: ['admin', 'registry', 'finance', 'library', 'resource', 'academic', 'marketing', 'student_services']` | `permissions: [{ resource: 'activity-tracker', action: 'read' }]` |
| Tools > Simulator | `roles: ['registry', 'academic', 'admin', 'student_services']` | — |
| Tools > Grade Calculator | `roles: ['registry', 'academic', 'admin', 'student_services']` | — |
| Tools > Grade Finder | `roles: ['registry', 'academic', 'admin', 'student_services']` | — |
| Bulk > Export Transcript | `roles: ['admin', 'registry']` | — |

---

## Users Service (Admin)

**File:** `src/app/admin/users/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ users: ['read'] }` |
| `findAll()` | `{ users: ['read'] }` |
| `getUserSchoolIds()` | `{ users: ['read'] }` |
| `getUserSchools()` | `{ users: ['read'] }` |
| `create()` | `{ users: ['create'] }` |
| `update()` | `{ users: ['update'] }` |
| `delete()` | `{ users: ['delete'] }` |
| `findAllByRoles()` | `{ users: ['read'] }` |

---

## Auth Users Service

**File:** `src/app/auth/users/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `assignPreset()` | `{ users: ['update'] }` |

---

## Permission Presets Service

**File:** `src/app/auth/permission-presets/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'permission-presets': ['read'] }` |
| findAllAuth | `{ 'permission-presets': ['read'] }` |
| createAuth | `{ 'permission-presets': ['create'] }` |
| updateAuth | `{ 'permission-presets': ['update'] }` |
| deleteAuth | `{ 'permission-presets': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ 'permission-presets': ['read'] }` |
| `findAllWithCounts()` | `{ 'permission-presets': ['read'] }` |
| `findByRole()` | `{ 'permission-presets': ['read'] }` |
| `create()` | `{ 'permission-presets': ['create'] }` + revokeAffectedUserSessions |
| `update()` | `{ 'permission-presets': ['update'] }` + revokeAffectedUserSessions |
| `delete()` | `{ 'permission-presets': ['delete'] }` + revokeAffectedUserSessions |

---

## Tasks Service

**File:** `src/app/admin/tasks/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ tasks: ['read'] }` (+ visibility logic: creator, assignee, role, admin) |
| `findAll()` | `{ tasks: ['read'] }` (+ session visibility logic) |
| `countUncompleted()` | `{ tasks: ['read'] }` (+ session visibility) |
| `getTodoSummary()` | `{ tasks: ['read'] }` (+ session visibility) |
| `create()` | `{ tasks: ['create'] }` |
| `update()` | `{ tasks: ['update'] }` (+ visibility & ownership checks) |
| `delete()` | complex logic with visibility checks |
| `updateStatus()` | `{ tasks: ['update'] }` |
| `getTaskCounts()` | `{ tasks: ['read'] }` |

---

## Notifications Service

**File:** `src/app/admin/notifications/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ notifications: ['read'] }` |
| `findAll()` | `{ notifications: ['read'] }` |
| `create()` | `{ notifications: ['create'] }` |
| `createForCurrentUser()` | `'auth'` |
| `update()` | `{ notifications: ['update'] }` |
| `delete()` | `{ notifications: ['delete'] }` |
| `getActiveNotificationsForUser()` | `'auth'` |
| `getActiveNotificationsForCurrentUser()` | `'auth'` |
| `dismissNotification()` | `'auth'` |
| `dismissNotificationForCurrentUser()` | `'auth'` |
| `getRecipientUserIds()` | `{ notifications: ['read'] }` |

---

## Activity Tracker Service

**File:** `src/app/admin/activity-tracker/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getDepartmentSummary()` | `{ 'activity-tracker': ['read'] }` + resolveDepartment(session) |
| `getEmployeeList()` | `{ 'activity-tracker': ['read'] }` + resolveDepartment(session) |
| `getEmployeeActivityBreakdown()` | `{ 'activity-tracker': ['read'] }` + verifyEmployeeBelongsToDept |
| `getEmployeeTimeline()` | `{ 'activity-tracker': ['read'] }` + verifyEmployeeBelongsToDept |
| `getActivityHeatmap()` | `{ 'activity-tracker': ['read'] }` + verifyEmployeeBelongsToDept |
| `getDailyTrends()` | `{ 'activity-tracker': ['read'] }` + resolveDepartment(session) |
| `getEmployeeUser()` | `{ 'activity-tracker': ['read'] }` + verifyEmployeeBelongsToDept |
| `getEmployeeTotalActivities()` | `{ 'activity-tracker': ['read'] }` + verifyEmployeeBelongsToDept |

---

## Auth Providers Service

**File:** `src/app/auth/auth-providers/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getLmsCredentials()` | *(no explicit permission check — internal use)* |
| `syncLmsCredentials()` | *(no explicit permission check — internal use)* |

---

## Grade Finder Service

**File:** `src/app/admin/tools/grade-finder/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findStudentsByGrade()` | `'dashboard'` |
| `searchModulesForFilter()` | `'dashboard'` |
| `findStudentsByCGPA()` | `'dashboard'` |
| `exportStudentsByGrade()` | `'dashboard'` |
| `exportStudentsByCGPA()` | `'dashboard'` |
