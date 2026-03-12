# Phase 14: Timetable, Library & Standalone Actions

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 13 complete. Read `000_overview.md` first.

This phase migrates timetable and library services, plus all standalone server actions that use `withAuth` directly.

## 14.1 Timetable Module Services

| Service | File |
|---------|------|
| AllocationService | `src/app/timetable/timetable-allocations/_server/service.ts` |
| VenueService | `src/app/timetable/venues/_server/service.ts` |
| VenueTypeService | `src/app/timetable/venue-types/_server/service.ts` |
| SlotService | `src/app/timetable/slots/_server/service.ts` |

### AllocationService

**Before:** `['dashboard']` for read, `['academic']` for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: 'dashboard',
    findAllAuth: 'dashboard',
    createAuth: { timetable: ['create'] },
    updateAuth: { timetable: ['update'] },
    deleteAuth: { timetable: ['delete'] },
  });
}
```

### VenueService

**Before:** `['dashboard']` for read, `['academic', 'registry']` for write

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: 'dashboard',
    findAllAuth: 'dashboard',
    createAuth: { venues: ['create'] },
    updateAuth: { venues: ['update'] },
    deleteAuth: { venues: ['delete'] },
  });
}
```

### VenueTypeService, SlotService

Convert similarly based on current role gating.

## 14.2 Library Module Services

All library services → change to:

```ts
constructor() {
  super(repo, {
    byIdAuth: { library: ['read'] },
    findAllAuth: { library: ['read'] },
    createAuth: { library: ['create'] },
    updateAuth: { library: ['update'] },
    deleteAuth: { library: ['delete'] },
  });
}
```

## 14.3 Standalone Server Actions Migration

Some files use `withAuth` directly (not through BaseService). These must be updated to `withPermission`:

**Pattern replacement:**
```ts
// Before
withAuth(fn, ['registry', 'admin'])
// After
withPermission(fn, { students: ['update'] })

// Before
withAuth(fn, ['dashboard'])
// After
withPermission(fn, 'dashboard')

// Before
withAuth(fn, ['all'])
// After
withPermission(fn, 'all')

// Before
withAuth(fn, ['auth'])
// After
withPermission(fn, 'auth')
```

Search all files for `withAuth` usage and convert each one to the appropriate `withPermission` call with the correct permission requirement.

## Exit Criteria

- [ ] All 4 timetable services migrated
- [ ] All library services migrated
- [ ] All standalone `withAuth` calls replaced with `withPermission`
- [ ] No `withAuth` imports remain anywhere in `src/`
- [ ] No `next-auth` imports remain in any service files
- [ ] `pnpm tsc --noEmit` passes
