# Phase 13: Admissions & Finance Services

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 12 complete. Read `000_overview.md` first.

This phase migrates admissions and finance module services from role-array authorization to permission-based authorization.

## 13.1 Admissions Module Services

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

## 13.2 Finance Module Services

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

## Exit Criteria

- [ ] All 8 admissions services migrated
- [ ] All 2 finance services migrated
- [ ] No `withAuth` imports remain in admissions or finance modules
- [ ] No `next-auth` imports remain in these service files
- [ ] `pnpm tsc --noEmit` passes for admissions and finance modules
