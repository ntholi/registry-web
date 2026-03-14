# Finance Module — Permission Map

## Navigation (finance.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Sponsors | `roles: ['admin', 'finance']` | — |

---

## Sponsors Service

**File:** `src/app/finance/sponsors/_server/service.ts`
**Extends:** *Not BaseService (custom with private permission helpers)*

### Private Helpers

- `canRead(session)` → `hasPermission(session, 'sponsors', 'read') || session?.user?.role === 'registry'`
- `canUpdate(session)` → `hasPermission(session, 'sponsors', 'update') || session?.user?.role === 'registry'`

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `async (session) => canRead(session)` |
| `findAll()` | `async (session) => canRead(session)` |
| `getAll()` | `async (session) => canRead(session)` |
| `create()` | `async (session) => hasPermission(session, 'sponsors', 'create')` |
| `update()` | `async (session) => canUpdate(session)` |
| `delete()` | `async (session) => hasPermission(session, 'sponsors', 'delete')` |
| `getSponsoredStudent(stdNo)` | `async (session) => canRead(session) \|\| hasOwnedStudentSession(session, stdNo)` |
| `getStudentCurrentSponsorship(stdNo)` | `async (session) => canRead(session) \|\| hasOwnedStudentSession(session, stdNo)` |
| `updateStudentSponsorship(data)` | `async (session) => canUpdate(session) \|\| hasOwnedStudentSession(session, data.stdNo)` |
| `getSponsoredStudents()` | `async (session) => canRead(session)` |
| `getAllSponsoredStudents()` | `async (session) => canRead(session)` |

---

## Payment Receipts Service

**File:** `src/app/finance/payment-receipts/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `async (session) => isStudentSession(session)` |
| findAllAuth | `async (session) => isStudentSession(session)` |
| createAuth | `async (session) => isStudentSession(session)` |
| updateAuth | `async (session) => isStudentSession(session)` |
| deleteAuth | `async (session) => isStudentSession(session)` |
| countAuth | `async (session) => isStudentSession(session)` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `create()` | `async (session) => isStudentSession(session)` |
| `getByGraduationRequest()` | `async (session) => isStudentSession(session)` |
| `createMany()` | `async (session) => isStudentSession(session)` |
| `updateGraduationPaymentReceipts()` | `async (session) => isStudentSession(session) + hasOwnedStudentSession check` |
