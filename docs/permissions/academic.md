# Academic Module — Permission Map

## Navigation (academic.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Lecturers | `roles: ['academic']` | `permissions: [{ resource: 'lecturers', action: 'read' }]` |
| Assessments | `roles: ['academic']` | `permissions: [{ resource: 'assessments', action: 'read' }]` |
| Attendance | `roles: ['academic']` | `permissions: [{ resource: 'attendance', action: 'read' }]` |
| Gradebook | `roles: ['academic']` | `permissions: [{ resource: 'gradebook', action: 'read' }]` |
| Feedback > Questions | `roles: ['academic', 'admin', 'human_resource']` | `permissions: [{ resource: 'feedback-questions', action: 'read' }]` |
| Feedback > Cycles | `roles: ['academic', 'admin', 'human_resource']` | `permissions: [{ resource: 'feedback-cycles', action: 'read' }]` |
| Feedback > Reports | `roles: ['academic', 'admin', 'human_resource']` | `permissions: [{ resource: 'feedback-reports', action: 'read' }]` |

---

## Semester Modules Service

**File:** `src/app/academic/semester-modules/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ 'semester-modules': ['create'] }` |
| updateAuth | `{ 'semester-modules': ['update'] }` |
| deleteAuth | *default (denyAccess)* |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `'dashboard'` |
| `getByCode()` | `'dashboard'` |
| `search()` | `'dashboard'` |
| `findModulesByStructure()` | `'dashboard'` |
| `getModulesByStructure()` | `'dashboard'` |
| `getStructuresByModule()` | `'dashboard'` |
| `addPrerequisite()` | `{ 'semester-modules': ['update'] }` |
| `clearPrerequisites()` | `{ 'semester-modules': ['update'] }` |
| `getPrerequisites()` | `'dashboard'` |
| `getModulesForStructure()` | `async (session) => isStudentSession(session) \|\| hasSessionRole(session, DASHBOARD_ROLES)` |
| `searchModulesWithDetails()` | `'dashboard'` |
| `getStudentCountForModule()` | `'dashboard'` |
| `findGradeByModuleAndStudent()` | `{ gradebook: ['read'] }` |
| `getGradesByModuleId()` | `{ gradebook: ['read'] }` |

---

## Modules Service

**File:** `src/app/academic/modules/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ modules: ['create'] }` |
| updateAuth | *default (denyAccess)* |
| deleteAuth | *default (denyAccess)* |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `'dashboard'` (overrides base) |

---

## Assessments Service

**File:** `src/app/academic/assessments/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ assessments: ['read'] }` |
| findAllAuth | `{ assessments: ['read'] }` |
| createAuth | `{ assessments: ['create'] }` |
| updateAuth | `{ assessments: ['update'] }` |
| deleteAuth | `{ assessments: ['delete'] }` |
| countAuth | `{ assessments: ['read'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `create()` | `{ assessments: ['create'] }` (overrides base) |
| `getByModuleId()` | `{ assessments: ['read'] }` |
| `getByLmsId()` | `{ assessments: ['read'] }` |
| `getAuditHistory()` | `{ assessments: ['read'] }` |
| `updateWithGradeRecalculation()` | `{ assessments: ['update'] }` |

---

## School Structures Service

**File:** `src/app/academic/schools/structures/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | *default (denyAccess)* |
| updateAuth | `{ 'school-structures': ['update'] }` |
| deleteAuth | `{ 'school-structures': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `'dashboard'` |
| `getByProgramId()` | `'dashboard'` |
| `getStructureModules()` | `'dashboard'` |
| `getStructureSemestersByStructureId()` | `'dashboard'` |
| `createStructureSemester()` | `{ 'school-structures': ['update'] }` |

---

## Schools Service

**File:** `src/app/academic/schools/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findAll()` | `'dashboard'` |
| `get()` | `'dashboard'` |
| `getAll()` | `'dashboard'` |
| `getActiveSchools()` | `'dashboard'` |
| `getProgramsBySchoolId()` | `'dashboard'` |
| `getAllPrograms()` | `'dashboard'` |
| `getAllProgramsWithLevel()` | `'dashboard'` |
| `getProgramsBySchoolIds()` | `'dashboard'` |

---

## Lecturers Service

**File:** `src/app/academic/lecturers/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ lecturers: ['read'] }` |
| `getAll()` | `{ lecturers: ['read'] }` (+ session.user.id for school filtering) |
| `searchWithSchools()` | `{ lecturers: ['read'] }` (+ session.user.id for school filtering) |

---

## Attendance Service

**File:** `src/app/academic/attendance/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWeeksForTerm()` | `{ attendance: ['read'] }` |
| `getStudentsForModule()` | `{ attendance: ['read'] }` |
| `getAttendanceForWeek()` | `{ attendance: ['read'] }` |
| `markAttendance()` | `{ attendance: ['create'] }` |
| `getAttendanceSummary()` | `{ attendance: ['read'] }` |
| `getAssignedModulesForCurrentUser()` | `{ attendance: ['read'] }` |
| `deleteAttendanceForWeek()` | `{ attendance: ['delete'] }` |
| `exportAttendanceForm()` | `{ attendance: ['read'] }` |

---

## Assessment Marks Service

**File:** `src/app/academic/assessment-marks/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `create()` | `{ gradebook: ['update'] }` |
| `update()` | `{ gradebook: ['update'] }` |
| `getByModuleId()` | `{ gradebook: ['read'] }` |
| `getByStudentModuleId()` | `{ gradebook: ['read'] }` |
| `getByStudentModuleIdWithDetails()` | `async (session) => hasPermission(session, 'gradebook', 'read') \|\| registry` |
| `getStudentMarks()` | `async (session) => hasPermission(session, 'gradebook', 'read') \|\| registry` |
| `getAssessmentsByModuleId()` | `{ gradebook: ['read'] }` |
| `getAuditHistory()` | `{ gradebook: ['read'] }` |
| `createOrUpdateMarks()` | `{ gradebook: ['update'] }` |
| `createOrUpdateMarksInBulk()` | `{ gradebook: ['update'] }` |
| `getStudentAuditHistory()` | `{ gradebook: ['read'] }` |

---

## Assigned Modules Service

**File:** `src/app/academic/assigned-modules/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `delete()` | `{ 'assigned-modules': ['delete'] }` |
| `assignModulesToLecturer()` | `{ 'assigned-modules': ['create'] }` |
| `getByUserAndModule()` | `{ 'assigned-modules': ['read'] }` |
| `getLecturersByModule()` | `{ 'assigned-modules': ['read'] }` |
| `getByUser()` | `{ 'assigned-modules': ['read'] }` |
| `checkAssignment()` | `{ 'assigned-modules': ['read'] }` |
| `getByLmsCourseId()` | `'dashboard'` |
| `linkCourseToAssignment()` | `'dashboard'` |

---

## Feedback Cycles Service

**File:** `src/app/academic/feedback/cycles/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| findAllAuth | `{ 'feedback-cycles': ['read'] }` |
| byIdAuth | `{ 'feedback-cycles': ['read'] }` |
| createAuth | `{ 'feedback-cycles': ['create'] }` |
| updateAuth | `{ 'feedback-cycles': ['update'] }` |
| deleteAuth | `{ 'feedback-cycles': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findAllWithSchoolCodes()` | `{ 'feedback-cycles': ['read'] }` |
| `createWithSchools()` | `{ 'feedback-cycles': ['create'] }` |
| `updateWithSchools()` | `{ 'feedback-cycles': ['update'] }` |
| `getClassesForCycle()` | `{ 'feedback-cycles': ['read'] }` |
| `getPassphraseStats()` | `{ 'feedback-cycles': ['read'] }` |
| `generatePassphrases()` | `{ 'feedback-cycles': ['update'] }` |
| `getPassphrasesForClass()` | `{ 'feedback-cycles': ['read'] }` |

---

## Feedback Questions Service

**File:** `src/app/academic/feedback/questions/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| findAllAuth | `{ 'feedback-questions': ['read'] }` |
| byIdAuth | `{ 'feedback-questions': ['read'] }` |
| createAuth | `{ 'feedback-questions': ['create'] }` |
| updateAuth | `{ 'feedback-questions': ['update'] }` |
| deleteAuth | `{ 'feedback-questions': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ 'feedback-questions': ['read'] }` |
| `findAllWithCategories()` | `{ 'feedback-questions': ['read'] }` |
| `findQuestionBoard()` | `{ 'feedback-questions': ['read'] }` |
| `reorderQuestions()` | `{ 'feedback-questions': ['update'] }` |
| `reorderCategories()` | `{ 'feedback-questions': ['update'] }` |

---

## Feedback Categories Service

**File:** `src/app/academic/feedback/categories/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| findAllAuth | `{ 'feedback-categories': ['read'] }` |
| byIdAuth | `{ 'feedback-categories': ['read'] }` |
| createAuth | `{ 'feedback-categories': ['create'] }` |
| updateAuth | `{ 'feedback-categories': ['update'] }` |
| deleteAuth | `{ 'feedback-categories': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `delete()` | `{ 'feedback-categories': ['delete'] }` (overrides base) |

---

## Feedback Reports Service

**File:** `src/app/academic/feedback/reports/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getReportData()` | `{ 'feedback-reports': ['read'] }` |
| `getLecturerDetail()` | `{ 'feedback-reports': ['read'] }` + custom access (admin/human_resource or matching lecturer) |
| `getCyclesByTerm()` | `{ 'feedback-reports': ['read'] }` |
| `getModulesForFilter()` | `{ 'feedback-reports': ['read'] }` |
| `hasFullAccess()` | Checks admin/human_resource roles OR `{ 'feedback-reports': ['update'] }` |
