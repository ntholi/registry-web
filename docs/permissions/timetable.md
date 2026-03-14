# Timetable Module — Permission Map

## Navigation (timetable.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Timetables | — | `permissions: [{ resource: 'timetable', action: 'read' }]` |
| Allocations | `isVisible: (session) => hasAnyPermission(session, 'timetable', ['create', 'update', 'delete'])` | — |
| Venues | — | `permissions: [{ resource: 'venues', action: 'read' }]` |
| Venue Types | — | `permissions: [{ resource: 'venues', action: 'read' }]` |

---

## Venues Service

**File:** `src/app/timetable/venues/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ venues: ['create'] }` |
| updateAuth | `{ venues: ['update'] }` |
| deleteAuth | `{ venues: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `'dashboard'` |
| `findAllWithRelations()` | `'dashboard'` |
| `getAllWithRelations()` | `'dashboard'` |
| `createWithSchools()` | `{ venues: ['create'] }` |
| `updateWithSchools()` | `{ venues: ['update'] }` |

---

## Venue Types Service

**File:** `src/app/timetable/venue-types/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ venues: ['create'] }` |
| updateAuth | `{ venues: ['update'] }` |
| deleteAuth | `{ venues: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getAll()` | `'dashboard'` |

---

## Timetable Slots Service

**File:** `src/app/timetable/slots/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ timetable: ['create'] }` |
| updateAuth | `{ timetable: ['update'] }` |
| deleteAuth | `{ timetable: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `listTermSlots()` | `'dashboard'` |
| `getUserSlots()` | `'dashboard'` |
| `allocateSlot()` | `{ timetable: ['update'] }` |
| `rebuildTermSlots()` | `{ timetable: ['update'] }` |
| `createAllocationsWithSlots()` | `{ timetable: ['create'] }` |

---

## Timetable Allocations Service

**File:** `src/app/timetable/timetable-allocations/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `'dashboard'` |
| findAllAuth | `'dashboard'` |
| createAuth | `{ timetable: ['create'] }` |
| updateAuth | `{ timetable: ['update'] }` |
| deleteAuth | `{ timetable: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `'dashboard'` |
| `getByUserIdWithRelations()` | `'dashboard'` |
| `createWithVenueTypes()` | `{ timetable: ['create'] }` |
| `createManyWithVenueTypes()` | `{ timetable: ['create'] }` |
| `create()` | `{ timetable: ['create'] }` |
| `update()` | `{ timetable: ['update'] }` |
| `delete()` | `{ timetable: ['delete'] }` |
| `deleteMany()` | `{ timetable: ['delete'] }` |
| `updateVenueTypes()` | `{ timetable: ['update'] }` |

---

## Timetable Viewer Service

**File:** `src/app/timetable/viewer/_server/service.ts`
**Extends:** *Not BaseService (custom)*

### Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getVenueTimetable()` | `'dashboard'` |
| `getClassTimetable()` | `'dashboard'` |
| `getLecturerTimetable()` | `'dashboard'` |
| `getAvailableClasses()` | `'dashboard'` |
