# Reports Module — Permission Map

## Navigation (reports.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Course Summary | — | `permissions: [{ resource: 'reports-course-summary', action: 'read' }]` |
| Attendance Report | — | `permissions: [{ resource: 'reports-attendance', action: 'read' }]` |
| Board of Examination | — | `permissions: [{ resource: 'reports-boe', action: 'read' }]` |
| Student Enrollments | — | `permissions: [{ resource: 'reports-enrollments', action: 'read' }]` |
| Graduation Reports | — | `permissions: [{ resource: 'reports-graduation', action: 'read' }]` |
| Sponsored Students | — | `permissions: [{ resource: 'reports-sponsored-students', action: 'read' }]` |

---

## Attendance Report Service

**File:** `src/app/reports/academic/attendance/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getSemesterModulesForFilter()` | `{ 'reports-attendance': ['read'] }` |
| `getAttendanceReportData()` | `{ 'reports-attendance': ['read'] }` |
| `getPaginatedStudentsWithModuleAttendance()` | `{ 'reports-attendance': ['read'] }` |

---

## Course Summary Report Service

**File:** `src/app/reports/academic/course-summary/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `generateCourseSummaryReport()` | *(no permission wrapping)* |
| `getAvailableModulesForProgram()` | *(no permission wrapping)* |

---

## BOE Report Service

**File:** `src/app/reports/academic/boe/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getPreview()` | *(no permission wrapping)* |
| `getStatistics()` | *(no permission wrapping)* |
| `getClassReports()` | *(no permission wrapping)* |
| `generateExcel()` | *(no permission wrapping)* |

---

## Enrollment Report Service

**File:** `src/app/reports/registry/student-enrollments/enrollments/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `generateFullRegistrationReport()` | `{ 'reports-enrollments': ['read'] }` |
| `generateSummaryRegistrationReport()` | `{ 'reports-enrollments': ['read'] }` |
| `generateStudentsListReport()` | `{ 'reports-enrollments': ['read'] }` |
| `getRegistrationDataForTerms()` | `{ 'reports-enrollments': ['read'] }` |
| `getPaginatedRegistrationStudents()` | `{ 'reports-enrollments': ['read'] }` |
| `getChartData()` | `{ 'reports-enrollments': ['read'] }` |
| `getAvailableCountries()` | `{ 'reports-enrollments': ['read'] }` |

---

## Progression Report Service

**File:** `src/app/reports/registry/student-enrollments/progression/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getProgressionSummary()` | `{ 'reports-progression': ['read'] }` |
| `getPaginatedStudents()` | `{ 'reports-progression': ['read'] }` |
| `getChartData()` | `{ 'reports-progression': ['read'] }` |

---

## Distribution Report Service

**File:** `src/app/reports/registry/student-enrollments/distribution/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getDistributionData()` | `{ 'reports-distribution': ['read'] }` |

---

## Graduation Report Service

**File:** `src/app/reports/registry/graduations/student-graduations/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `generateSummaryGraduationReport()` | `{ 'reports-graduation': ['read'] }` |
| `generateStudentsListReport()` | `{ 'reports-graduation': ['read'] }` |
| `getGraduationDataPreview()` | `{ 'reports-graduation': ['read'] }` |
| `getPaginatedGraduationStudents()` | `{ 'reports-graduation': ['read'] }` |
| `getChartData()` | `{ 'reports-graduation': ['read'] }` |
| `getGraduationDates()` | `{ 'reports-graduation': ['read'] }` |
| `getAvailableCountries()` | `{ 'reports-graduation': ['read'] }` |

---

## Sponsored Students Report Service

**File:** `src/app/reports/finance/sponsored-students/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getSponsoredStudents()` | *(no permission wrapping)* |
| `getAllSponsoredStudentsForExport()` | *(no permission wrapping)* |
| `getSummary()` | *(no permission wrapping)* |
| `getTermCode()` | *(no permission wrapping)* |
