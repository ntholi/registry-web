# Human Resource Module — Permission Map

## Navigation (human-resource.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Employees | `roles: ['human_resource', 'admin']` | — |

---

## Employees Service

**File:** `src/app/human-resource/employees/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `get()` | `{ employees: ['read'] }` |
| `findAll()` | `{ employees: ['read'] }` |
| `create()` | `{ employees: ['create'] }` |
| `update()` | `{ employees: ['update'] }` |
| `delete()` | `{ employees: ['delete'] }` |
| `logCardPrint()` | `{ employees: ['update'] }` |
| `getCardPrintHistory()` | `{ employees: ['read'] }` |
| `getPhotoKey()` | `'all'` |
| `uploadPhoto()` | `{ employees: ['update'] }` |
