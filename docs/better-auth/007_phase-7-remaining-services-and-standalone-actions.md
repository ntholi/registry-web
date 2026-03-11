# Phase 7: Remaining Services & Standalone Action Migration

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 6 complete. Read `000_steering-document.md` first.

This phase migrates admissions, finance, timetable, and library services, plus all standalone server actions that use `withAuth` directly.

## 7.1 Admissions Module Services

| Service | File |
|---------|------|
| ApplicantService | `src/app/admissions/applicants/_server/service.ts` |
| ApplicationService | `src/app/admissions/applications/_server/service.ts` |
| PaymentService | `src/app/admissions/payments/_server/service.ts` |
| EntryRequirementService | `src/app/admissions/entry-requirements/_server/service.ts` |
| SubjectService | `src/app/admissions/subjects/_server/service.ts` |
| CertificateTypeService | `src/app/admissions/certificate-types/_server/service.ts` |
| IntakePeriodService | `src/app/admissions/intake-periods/_server/service.ts` |
| RecognizedSchoolService | `src/app/admissions/recognized-schools/_server/service.ts` |

### ApplicantService

**Before:** `['registry', 'marketing', 'admin']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { applicants: ['read'] },
    findAllAuth: { applicants: ['read'] },
    createAuth: { applicants: ['create'] },
    updateAuth: { applicants: ['update'] },
  });
}
```

### ApplicationService

**Before:** `['registry', 'marketing', 'admin']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { applications: ['read'] },
    findAllAuth: { applications: ['read'] },
    createAuth: { applications: ['create'] },
    updateAuth: { applications: ['update'] },
    deleteAuth: { applications: ['delete'] },
  });
}
```

### PaymentService (Admissions)

**Before:** `['registry', 'marketing', 'admin', 'finance']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'admissions-payments': ['read'] },
    findAllAuth: { 'admissions-payments': ['read'] },
    createAuth: { 'admissions-payments': ['create'] },
    updateAuth: { 'admissions-payments': ['update'] },
    deleteAuth: { 'admissions-payments': ['delete'] },
  });
}
```

### EntryRequirementService

**Before:** `['registry', 'marketing', 'admin']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { 'entry-requirements': ['read'] },
    findAllAuth: { 'entry-requirements': ['read'] },
    createAuth: { 'entry-requirements': ['create'] },
    updateAuth: { 'entry-requirements': ['update'] },
    deleteAuth: { 'entry-requirements': ['delete'] },
  });
}
```

### SubjectService, CertificateTypeService, IntakePeriodService, RecognizedSchoolService

These are supporting/lookup tables for admissions. Convert similarly based on their current role gating — typically `['registry', 'marketing', 'admin']` → appropriate `admissions-*` permission or `'dashboard'` shorthand.

## 7.2 Finance Module Services

| Service | File |
|---------|------|
| SponsorService | `src/app/finance/sponsors/_server/service.ts` |
| PaymentReceiptService | `src/app/finance/payment-receipts/_server/service.ts` |

### SponsorService

**Before:** `['finance', 'admin', 'registry']`

**After:**
```ts
constructor() {
  super(repo, {
    byIdAuth: { sponsors: ['read'] },
    findAllAuth: { sponsors: ['read'] },
    createAuth: { sponsors: ['manage'] },
    updateAuth: { sponsors: ['manage'] },
    deleteAuth: { sponsors: ['manage'] },
  });
}
```

### PaymentReceiptService

Convert based on current role gating — typically finance-related permission.

## 7.3 Timetable Module Services

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

## 7.4 Library Module Services

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

## 7.5 Standalone Server Actions Migration

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

- [ ] All 8 admissions services migrated
- [ ] All 2 finance services migrated
- [ ] All 4 timetable services migrated
- [ ] All library services migrated
- [ ] All standalone `withAuth` calls replaced with `withPermission`
- [ ] No `withAuth` imports remain anywhere in `src/`
- [ ] No `next-auth` imports remain in any service files
- [ ] `pnpm tsc --noEmit` passes
