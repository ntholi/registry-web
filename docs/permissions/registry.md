# Registry Module — Permission Map

## Navigation (registry.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Students | — | `permissions: [{ resource: 'students', action: 'read' }]` |
| Registration | — | `permissions: [{ resource: 'registration', action: 'read' }]` |
| Graduations > Requests | `roles: ['registry', 'admin']` | — |
| Graduations > Dates | `roles: ['admin', 'registry']` | — |
| Graduations > Certificate Reprints | `roles: ['registry', 'admin']` | — |
| Registration Clearance | `roles: ['finance', 'library', 'resource', 'leap']` | — |
| Auto-Approvals | `roles: ['finance', 'library', 'resource', 'admin']` | — |
| Graduation Clearance | — | `permissions: [{ resource: 'graduation-clearance', action: 'read' }]` |
| Student Status | — | `permissions: [{ resource: 'student-statuses', action: 'read' }]` |
| Notes | `roles: ['admin', 'registry', 'finance', 'academic', 'student_services']` | — |
| Blocked Students | `roles: ['admin', 'registry', 'finance']` | — |
| Terms | `roles: ['admin', 'registry']` | — |
| Modules | `roles: ['admin']` | — |
| Semester Modules | `roles: ['registry', 'admin', 'academic', 'finance']` | — |
| Schools | `roles: ['registry', 'admin', 'academic', 'finance', 'student_services', 'marketing']` | — |

---

## Students Service

**File:** `src/app/registry/students/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ students: ['read'] }` |
| `getAcademicHistory(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasPermission(session, 'students', 'read')` |
| `getRegistrationData(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasAnyPermission(session, 'registration', ['read', 'create', 'update'])` |
| `getRegistrationDataByTerm(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasAnyPermission(session, 'registration', ['read', 'create', 'update'])` |
| `getStdNoByUserId()` | `'auth'` |
| `findStudentByUserId(userId)` | `async (session) => session?.user?.id === userId \|\| hasPermission(session, 'students', 'read')` |
| `findBySemesterModules()` | `{ students: ['read'] }` |
| `findAll()` | `{ students: ['read'] }` |
| `create()` | `{ students: ['update'] }` |
| `update()` | `{ students: ['update'] }` |

---

## Registration Request Service

**File:** `src/app/registry/registration/requests/_server/requests/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getHistory(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasPermission(session, 'registration', 'read')` |
| `findAll()` | `{ registration: ['read'] }` |
| `countByStatus()` | `{ registration: ['read'] }` |
| `get()` | `{ registration: ['read'] }` |
| `delete()` | `{ registration: ['delete'] }` |
| `createWithModules(data)` | `async (session) => session?.user?.stdNo === data.stdNo \|\| hasAnyPermission(session, 'registration', ['create', 'update'])` |
| `updateWithModules()` | `async (session) => hasAnyPermission(session, 'registration', ['create', 'update'])` |
| `getStudentSemesterModules(student)` | `async (session) => session?.user?.stdNo === student.stdNo \|\| hasAnyPermission(session, 'registration', ['create', 'update'])` |
| `getExistingRegistrationSponsorship(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasAnyPermission(session, 'registration', ['create', 'update'])` |
| `checkIsAdditionalRequest(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasAnyPermission(session, 'registration', ['create', 'update'])` |
| `getExistingSemesterStatus(stdNo)` | `async (session) => session?.user?.stdNo === stdNo \|\| hasAnyPermission(session, 'registration', ['create', 'update'])` |

---

## Registration Clearance Service

**File:** `src/app/registry/registration/requests/_server/clearance/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `first()` | `async () => false` (admin only via bypass) |
| `get()` | `'dashboard'` |
| `countByStatus()` | *(no explicit wrapping)* |
| `findByDepartment()` | `'dashboard'` |
| `respond()` | `'dashboard'` |
| `update()` | `'dashboard'` |
| `delete()` | `async () => false` (admin only) |
| `count()` | `async () => false` (admin only) |
| `getHistory()` | `'dashboard'` |
| `getHistoryByStudentNo()` | `'dashboard'` |
| `findNextPending()` | `'dashboard'` |
| `findByStatusForExport()` | `'dashboard'` |

---

## Student Statuses Service

**File:** `src/app/registry/student-statuses/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'student-statuses': ['read'] }` |
| findAllAuth | `{ 'student-statuses': ['read'] }` |
| createAuth | `{ 'student-statuses': ['create'] }` |
| updateAuth | `{ 'student-statuses': ['update'] }` |
| deleteAuth | `{ 'student-statuses': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ 'student-statuses': ['read'] }` |
| `queryAll()` | `{ 'student-statuses': ['read'] }` |
| `getByStdNo()` | `{ 'student-statuses': ['read'] }` |
| `getPendingForApproval()` | `async (session) => getUserApprovalRoles(session).length > 0` |
| `countPendingForCurrentUser()` | `async (session) => getUserApprovalRoles(session).length > 0` |
| `createStatus()` | `async (session) => complex logic with getUserApprovalRoles` |

---

## Documents Service

**File:** `src/app/registry/documents/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ documents: ['read'] }` |
| `getByStudent()` | `{ documents: ['read'] }` |
| `create()` | `{ documents: ['create'] }` |
| `delete()` | `{ documents: ['create'] }` |

---

## Terms Service

**File:** `src/app/registry/terms/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | *default ('dashboard')* |
| findAllAuth | `'dashboard'` |
| createAuth | `async (session) => hasPermission(session, 'terms-settings', 'update') \|\| session?.user?.role === 'registry'` |
| updateAuth | `async (session) => hasPermission(session, 'terms-settings', 'update') \|\| session?.user?.role === 'registry'` |
| deleteAuth | *default (denyAccess)* |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getByCode()` | `'all'` |
| `getActive()` | `'all'` |
| `create()` | `async (session) => hasPermission(session, 'terms-settings', 'update') \|\| session?.user?.role === 'registry'` |
| `deleteTerm()` | `async (session) => hasPermission(session, 'terms-settings', 'update') \|\| session?.user?.role === 'registry'` |

---

## Student Notes Service

**File:** `src/app/registry/student-notes/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ 'student-notes': ['create'] }` |
| updateAuth | `{ 'student-notes': ['update'] }` |
| deleteAuth | `{ 'student-notes': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getByStudent()` | `'dashboard'` (+ requires userId + role) |
| `findAll()` | `'dashboard'` (+ requires userId + role) |
| `getNoteById()` | `'dashboard'` |
| `createNote()` | `{ 'student-notes': ['create'] }` |
| `updateNote()` | `{ 'student-notes': ['update'] }` (+ only creator or admin) |

---

## Graduation Dates Service

**File:** `src/app/registry/graduation/dates/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| findAllAuth | `'dashboard'` |
| createAuth | `async (session) => hasPermission(session, 'graduation', 'create') \|\| session?.user?.role === 'registry'` |
| updateAuth | `async (session) => hasPermission(session, 'graduation', 'update') \|\| session?.user?.role === 'registry'` |
| deleteAuth | `async (session) => hasPermission(session, 'graduation', 'delete') \|\| session?.user?.role === 'registry'` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithTerm()` | `'dashboard'` |
| `getByDateWithTerm()` | `'dashboard'` |
| `getLatest()` | `'dashboard'` |
| `getAllGraduationDates()` | `'dashboard'` |
| `deleteGraduation()` | `async (session) => hasPermission(session, 'graduation', 'delete') \|\| session?.user?.role === 'registry'` |

---

## Graduation Requests Service

**File:** `src/app/registry/graduation/clearance/_server/requests/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `first()` | `async () => false` (admin only) |
| `get(id)` | `async (session) => hasSessionRole(session, ['registry', 'finance', 'student'])` |
| `getByStudentNo(stdNo)` | `async (session) => hasSessionRole(session, ['student', 'registry'])` |
| `getByStudentProgramId()` | `async (session) => hasSessionRole(session, ['student', 'admin', 'registry'])` |
| `getEligiblePrograms(stdNo)` | `async (session) => session?.user?.role === 'student'` |
| `selectStudentProgramForGraduation(stdNo)` | `async (session) => session?.user?.role === 'student'` |
| `getAll()` | `async () => false` (admin only) |
| `findAll()` | `async (session) => hasSessionRole(session, ['registry', 'admin'])` |
| `create()` | `async () => false` (admin only) |
| `createWithPaymentReceipts()` | `async (session) => hasSessionRole(session, ['student', 'registry', 'admin'])` |
| `update()` | `async () => false` (admin only) |
| `delete()` | `async () => false` (admin only) |
| `count()` | `async () => false` (admin only) |
| `getClearanceData()` | `async (session) => admin/registry OR student with matching stdNo` |
| `countByStatus()` | `'dashboard'` |

---

## Graduation Clearance Service

**File:** `src/app/registry/graduation/clearance/_server/clearance/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `'dashboard'` |
| `countByStatus()` | *(checked server-side)* |
| `findByDepartment()` | `'dashboard'` |
| `update()` | `'dashboard'` |
| `respond()` | `'dashboard'` |
| `delete()` | `async () => false` (admin only) |
| `getHistory()` | `'dashboard'` |
| `getHistoryByStudentNo()` | `'dashboard'` |

---

## Certificate Reprints Service

**File:** `src/app/registry/certificate-reprints/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ 'certificate-reprints': ['read'] }` |
| `findByStdNo()` | `{ 'certificate-reprints': ['read'] }` |
| `queryAll()` | `{ 'certificate-reprints': ['read'] }` |
| `create()` | `{ 'certificate-reprints': ['create'] }` |
| `update()` | `{ 'certificate-reprints': ['update'] }` |
| `delete()` | `{ 'certificate-reprints': ['delete'] }` |

---

## Blocked Students Service

**File:** `src/app/registry/blocked-students/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasPermission(session, 'blocked-students', 'read') \|\| session?.user?.role === 'finance'` |
| `getByStdNo()` | `'all'` |
| `getAll()` | `async (session) => hasPermission(session, 'blocked-students', 'read') \|\| role === 'finance' \|\| role === 'registry'` |
| `create()` | `async (session) => hasPermission(session, 'blocked-students', 'create') \|\| role === 'finance' \|\| role === 'registry' \|\| role === 'library'` |
| `update()` | `async (session) => complex (admin bypass, unblock only if same dept, or permission + role checks)` |
| `delete()` | `async (session) => hasPermission(session, 'blocked-students', 'delete') \|\| admin \|\| finance \|\| registry \|\| library` |
| `bulkCreate()` | `async (session) => hasPermission(session, 'blocked-students', 'create') \|\| finance \|\| registry \|\| admin` |

---

## Auto Approval Service

**File:** `src/app/registry/clearance/auto-approve/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasPermission(session, 'auto-approvals', 'read') \|\| finance \|\| library` |
| `findAll()` | `async (session) => hasPermission(session, 'auto-approvals', 'read') \|\| finance \|\| library` |
| `create()` | `async (session) => hasPermission(session, 'auto-approvals', 'create') \|\| finance \|\| library` |
| `update()` | `async (session) => hasPermission(session, 'auto-approvals', 'update') \|\| finance \|\| library` |
| `delete()` | `async (session) => hasPermission(session, 'auto-approvals', 'delete') \|\| finance \|\| library` |
| `findMatchingRules()` | *(no permission wrapping — direct call)* |
| `bulkCreate()` | `async (session) => hasPermission(session, 'auto-approvals', 'create') \|\| finance \|\| library` |
