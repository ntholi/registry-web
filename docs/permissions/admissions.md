# Admissions Module — Permission Map

## Navigation (admissions.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Applicants | `roles: ['registry', 'marketing', 'admin']` | — |
| Applications | `roles: ['registry', 'marketing', 'admin']` | — |
| Payments | `roles: ['finance', 'admin']` | — |
| Document Review | `roles: ['registry', 'marketing', 'admin']` | — |
| Reports (parent) | `roles: ['registry', 'marketing', 'admin']` | — |
| Settings > Intake Periods | `roles: ['registry', 'marketing', 'admin']` | — |
| Settings > Certificate Types | `roles: ['registry', 'marketing', 'admin']` | — |
| Settings > Subjects | `roles: ['registry', 'marketing', 'admin']` | — |
| Settings > Recognized Schools | `roles: ['registry', 'marketing', 'admin']` | — |
| Settings > Entry Requirements | `roles: ['registry', 'marketing', 'admin']` | — |

---

## Applicants Service

**File:** `src/app/admissions/applicants/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ applicants: ['read'] }` |
| findAllAuth | `{ applicants: ['read'] }` |
| createAuth | `{ applicants: ['create'] }` |
| updateAuth | `{ applicants: ['update'] }` |
| deleteAuth | *default (denyAccess)* |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasSessionPermission(session, 'applicants', 'read', ['applicant', 'user'])` |
| `findByUserId()` | *(no permission check)* |
| `findByNationalIdWithUser()` | *(no permission check)* |
| `search()` | `{ applicants: ['read'] }` |
| `create()` | `async (session) => hasSessionPermission(session, 'applicants', 'create', ['applicant', 'user'])` |
| `update()` | `async (session) => hasSessionPermission(session, 'applicants', 'update', ['applicant', 'user'])` |
| `addPhone()` | `async (session) => hasSessionPermission(session, 'applicants', 'update', ['applicant', 'user'])` |
| `removePhone()` | `async (session) => hasSessionPermission(session, 'applicants', 'update', ['applicant', 'user'])` |
| `createGuardian()` | `async (session) => hasSessionPermission(session, 'applicants', 'update', ['applicant', 'user'])` |

---

## Applications Service

**File:** `src/app/admissions/applications/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ applications: ['read'] }` |
| findAllAuth | `{ applications: ['read'] }` |
| createAuth | `{ applications: ['create'] }` |
| updateAuth | `{ applications: ['update'] }` |
| deleteAuth | `{ applications: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasSessionPermission(session, 'applications', 'read', ['applicant', 'user'])` |
| `search()` | `{ applications: ['read'] }` |
| `create()` | `async (session) => hasSessionPermission(session, 'applications', 'create', ['applicant', 'user'])` |
| `createOrUpdate()` | `async (session) => hasSessionPermission(session, 'applications', 'create', ['applicant', 'user'])` |

---

## Payments Service (Admissions)

**File:** `src/app/admissions/payments/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'admissions-payments': ['read'] }` |
| findAllAuth | `{ 'admissions-payments': ['read'] }` |
| createAuth | `{ 'admissions-payments': ['create'] }` |
| updateAuth | `{ 'admissions-payments': ['update'] }` |
| deleteAuth | `{ 'admissions-payments': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getBankDeposit()` | `{ 'admissions-payments': ['read'] }` |
| `getBankDepositWithDocument()` | `{ 'admissions-payments': ['read'] }` |
| `searchBankDeposits()` | `{ 'admissions-payments': ['read'] }` (+ session.user.id) |
| `getBankDepositsByApplication()` | `async (session) => hasSessionPermission(session, 'admissions-payments', 'read', ['applicant', 'user'])` |
| `createBankDeposit()` | `async (session) => hasSessionPermission(session, 'admissions-payments', 'create', ['applicant', 'user'])` |
| `verifyBankDeposit()` | `{ 'admissions-payments': ['update'] }` |
| `rejectBankDeposit()` | `{ 'admissions-payments': ['update'] }` |

---

## Document Reviews Service (Admissions)

**File:** `src/app/admissions/documents/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'admissions-documents': ['read'] }` |
| findAllAuth | `{ 'admissions-documents': ['read'] }` |
| createAuth | *default (denyAccess)* |
| updateAuth | `{ 'admissions-documents': ['update'] }` |
| deleteAuth | `{ 'admissions-documents': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findAllForReview()` | `{ 'admissions-documents': ['read'] }` |
| `findByIdWithRelations()` | `{ 'admissions-documents': ['read'] }` |
| `countPending()` | `{ 'admissions-documents': ['read'] }` |
| `updateRotation()` | `{ 'admissions-documents': ['update'] }` |
| `updateVerificationStatus()` | `{ 'admissions-documents': ['update'] }` |
| `updateApplicantField()` | `{ 'admissions-documents': ['update'] }` |
| `updateAcademicRecordField()` | `{ 'admissions-documents': ['update'] }` |
| `updateSubjectGradeField()` | `{ 'admissions-documents': ['update'] }` |
| `acquireLock()` | `{ 'admissions-documents': ['update'] }` |
| `releaseLock()` | `{ 'admissions-documents': ['update'] }` |

---

## Applicant Documents Service

**File:** `src/app/admissions/applicants/[id]/documents/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'admissions-documents': ['read'] }` |
| findAllAuth | `{ 'admissions-documents': ['read'] }` |
| createAuth | `{ 'admissions-documents': ['create'] }` |
| updateAuth | `{ 'admissions-documents': ['update'] }` |
| deleteAuth | `{ 'admissions-documents': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findByApplicant()` | `async (session) => hasSessionPermission(session, 'admissions-documents', 'read', ['applicant', 'user'])` |
| `findByType()` | `async (session) => hasSessionPermission(session, 'admissions-documents', 'read', ['applicant', 'user'])` |
| `uploadDocument()` | `async (session) => hasSessionPermission(session, 'admissions-documents', 'create', ['applicant', 'user'])` |
| `verifyDocument()` | `async (session) => hasSessionPermission(session, 'admissions-documents', 'update', ['applicant', 'user'])` |
| `delete()` | `async (session) => hasSessionPermission(session, 'admissions-documents', 'delete', ['applicant', 'user'])` |

---

## Academic Records Service

**File:** `src/app/admissions/applicants/[id]/academic-records/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ applicants: ['read'] }` |
| findAllAuth | `{ applicants: ['read'] }` |
| createAuth | `{ applicants: ['create'] }` |
| updateAuth | `{ applicants: ['update'] }` |
| deleteAuth | `{ applicants: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasSessionPermission(session, 'applicants', 'read', ['applicant', 'user'])` |
| `findByApplicant()` | `async (session) => hasSessionPermission(session, 'applicants', 'read', ['applicant', 'user'])` |
| `createWithGrades()` | `async (session) => hasSessionPermission(session, 'applicants', 'create', ['applicant', 'user'])` |
| `updateWithGrades()` | `async (session) => hasSessionPermission(session, 'applicants', 'update')` |
| `delete()` | `async (session) => hasSessionPermission(session, 'applicants', 'delete', ['applicant', 'user'])` |

---

## Intake Periods Service

**File:** `src/app/admissions/intake-periods/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'intake-periods': ['read'] }` |
| findAllAuth | `{ 'intake-periods': ['read'] }` |
| createAuth | `{ 'intake-periods': ['create'] }` |
| updateAuth | `{ 'intake-periods': ['update'] }` |
| deleteAuth | `{ 'intake-periods': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findActive()` | `'all'` |
| `findAllActive()` | `{ 'intake-periods': ['read'] }` |
| `findWithPrograms()` | `{ 'intake-periods': ['read'] }` |
| `getProgramIds()` | `{ 'intake-periods': ['read'] }` |
| `setProgramIds()` | `{ 'intake-periods': ['update'] }` |
| `getOpenProgramIds()` | `async (session) => hasSessionPermission(session, 'intake-periods', 'read', ['applicant', 'user'])` |
| `create()` | `{ 'intake-periods': ['create'] }` |
| `update()` | `{ 'intake-periods': ['update'] }` |
| `delete()` | `{ 'intake-periods': ['delete'] }` |

---

## Subjects Service

**File:** `src/app/admissions/subjects/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ subjects: ['read'] }` |
| findAllAuth | `{ subjects: ['read'] }` |
| createAuth | `{ subjects: ['create'] }` |
| updateAuth | `{ subjects: ['update'] }` |
| deleteAuth | `{ subjects: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findOrCreateByName()` | `async (session) => hasSessionPermission(session, 'subjects', 'create', ['applicant', 'user'])` |
| `findActive()` | `async (session) => hasSessionPermission(session, 'subjects', 'read', ['applicant', 'user'])` |
| `toggleActive()` | `{ subjects: ['update'] }` |
| `addAlias()` | `{ subjects: ['update'] }` |
| `removeAlias()` | `{ subjects: ['update'] }` |
| `getAliases()` | `{ subjects: ['read'] }` |
| `moveToAlias()` | `{ subjects: ['update'] }` |
| `delete()` | `{ subjects: ['delete'] }` |

---

## Entry Requirements Service

**File:** `src/app/admissions/entry-requirements/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'entry-requirements': ['read'] }` |
| findAllAuth | `{ 'entry-requirements': ['read'] }` |
| createAuth | `{ 'entry-requirements': ['create'] }` |
| updateAuth | `{ 'entry-requirements': ['update'] }` |
| deleteAuth | `{ 'entry-requirements': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasSessionPermission(session, 'entry-requirements', 'read', ['applicant', 'user'])` |
| `findAllWithRelations()` | `{ 'entry-requirements': ['read'] }` |
| `findProgramsWithRequirements()` | `{ 'entry-requirements': ['read'] }` |
| `findByProgram()` | `{ 'entry-requirements': ['read'] }` |
| `findByProgramAndCertificate()` | `{ 'entry-requirements': ['read'] }` |
| `findAllForEligibility()` | `async (session) => hasSessionPermission(session, 'entry-requirements', 'read', ['applicant', 'user'])` |
| `findPublicCoursesData()` | *(no permission check)* |
| `create()` | `{ 'entry-requirements': ['create'] }` |

---

## Recognized Schools Service

**File:** `src/app/admissions/recognized-schools/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'recognized-schools': ['read'] }` |
| findAllAuth | `{ 'recognized-schools': ['read'] }` |
| createAuth | `{ 'recognized-schools': ['create'] }` |
| updateAuth | `{ 'recognized-schools': ['update'] }` |
| deleteAuth | `{ 'recognized-schools': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findAllForEligibility()` | `async (session) => hasSessionPermission(session, 'recognized-schools', 'read', ['applicant', 'user'])` |

---

## Certificate Types Service

**File:** `src/app/admissions/certificate-types/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ 'certificate-types': ['read'] }` |
| findAllAuth | `{ 'certificate-types': ['read'] }` |
| createAuth | `{ 'certificate-types': ['create'] }` |
| updateAuth | `{ 'certificate-types': ['update'] }` |
| deleteAuth | `{ 'certificate-types': ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => hasSessionPermission(session, 'certificate-types', 'read', ['applicant', 'user'])` |
| `search()` | `async (session) => hasSessionPermission(session, 'certificate-types', 'read', ['applicant', 'user'])` |
| `createWithMappings()` | `{ 'certificate-types': ['create'] }` |
| `findByName()` | *(no permission check)* |
| `updateWithMappings()` | `{ 'certificate-types': ['update'] }` |
| `delete()` | `{ 'certificate-types': ['delete'] }` |
| `isInUse()` | `{ 'certificate-types': ['read'] }` |
| `mapGrade()` | `async (session) => hasSessionPermission(session, 'certificate-types', 'read', ['applicant', 'user'])` |
