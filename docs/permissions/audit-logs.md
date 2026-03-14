# Audit Logs Module — Permission Map

## Navigation

No dedicated config file — accessed via admin module navigation (Activity Tracker).

---

## Audit Log Service

**File:** `src/app/audit-logs/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `findAll()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry'` |
| `get()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry'` |
| `getRecordHistory()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry'` |
| `getDistinctTables()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry'` |
| `getUnsynced()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry'` |
| `markAsSynced()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry'` |
| `getStudentModuleAuditHistory()` | `async (session) => hasPermission(session, 'activity-tracker', 'read') \|\| session?.user?.role === 'registry' \|\| session?.user?.role === 'academic'` |
