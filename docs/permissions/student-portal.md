# Student Portal Module — Permission Map

## Navigation

Separate layout — not part of dashboard navigation configs.

---

## Fortinet Registration Service

**File:** `src/app/student-portal/fortinet-registration/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getById()` | `async (session) => isStudentSession(session) \|\| hasSessionRole(session, DASHBOARD_ROLES)` |
| `getByStudentNumber()` | `async (session) => isStudentSession(session) \|\| hasSessionRole(session, DASHBOARD_ROLES)` |
| `getForCurrentStudent()` | `async (session) => isStudentSession(session)` |
| `getForSchool()` | `'dashboard'` |
| `create()` | `async (session) => isStudentSession(session)` (+ ICT school validation) |
| `updateStatus()` | `'dashboard'` |
| `delete()` | `'dashboard'` |
| `count()` | `'dashboard'` |
| `getAll()` | `'dashboard'` |
