# 02 — Architecture Violations

## 🔴 CRITICAL: Direct Database Access in Server Actions

The project mandates that **only `repository.ts` files** may import `db` from `@/core/database`. Two payment files violate this rule with raw DB queries.

### File 1: `src/app/apply/[id]/(wizard)/payment/_server/actions.ts`

```ts
import { bankDeposits, db, documents } from '@/core/database';
```

This file performs raw `db.transaction()` with `tx.insert()` calls:
```ts
await db.transaction(async (tx) => {
  await tx.insert(documents).values({ ... });
  await tx.insert(bankDeposits).values({ ... });
});
```

### File 2: `src/app/apply/[id]/(wizard)/payment/_server/validation.ts`

```ts
import { applicants, db, intakePeriods } from '@/core/database';
```

Performs raw queries and defines hardcoded business constants:
```ts
const BENEFICIARY_ACCOUNT = '9080003987813';
const BENEFICIARY_VARIATIONS = ['limkokwing university of creative technology', 'limkokwing university', 'luct', 'limkokwing'];

const intake = await db.query.intakePeriods.findFirst({ ... });
```

### Fix
1. Create proper repository/service functions in the relevant domain modules (e.g., `src/app/finance/` or `src/app/admissions/`)
2. The payment actions should call domain service functions, not access `db` directly
3. Validation queries should go through existing repositories

---

## 🔴 CRITICAL: Wrong Cross-Module Import for `getGradeColor`

Three files import `getGradeColor` from a deeply nested component inside the admissions module:

```ts
import { getGradeColor } from '@/app/admissions/applicants/[id]/_components/AcademicRecordsTab';
```

**Affected files:**
1. `src/app/apply/_components/CertificateConfirmationModal.tsx` (line 24)
2. `src/app/apply/[id]/(wizard)/qualifications/_components/AcademicRecordCard.tsx` (line 6)
3. `src/app/apply/profile/_components/InfoTab.tsx` (line 17)

**Problem:**
- Importing from another module's internal `_components/` folder violates encapsulation
- A `getGradeColor` already exists in `src/shared/lib/utils/colors.ts` (line 390), but it accepts a `Grade` enum type
- The admissions version accepts `string | null` — it's a duplicate that should not exist

### Fix
1. Unify into `src/shared/lib/utils/colors.ts` — extend the existing `getGradeColor` to handle `string | null` if needed
2. Delete the duplicate from `AcademicRecordsTab.tsx`
3. Update all 3 files to import from `@/shared/lib/utils/colors`

---

## 🟠 HIGH: Cross-Module Footer Import

**File:** `src/app/apply/page.tsx`

```ts
import { Footer } from '../student-portal/_shared';
```

**Problem:**
The apply module imports `Footer` from the student-portal module's internal `_shared` folder. This creates a tight coupling between two modules.

### Fix
- If Footer is shared across modules, move it to `src/shared/ui/` or `src/shared/ui/layout/`
- Both `apply` and `student-portal` should import from the shared location

---

## 🟡 MEDIUM: ProfileView Performs a Redundant Applications Fetch

**File:** `src/app/apply/profile/_components/ProfileView.tsx`

`ProfileView` calls `findApplicationsByApplicant(applicant.id)` via TanStack Query even though the applicant payload loaded through `getApplicant()` / `getOrCreateApplicantForCurrentUser()` already includes `applications`.

**Problem:**
- Extra client round-trip on a page that already has the base applications relation available
- Works against the repository guidance to minimize repeated data access
- Makes the profile page harder to reason about because the displayed status depends on two overlapping sources of truth

**Nuance:**
The second fetch may still be needed if the profile truly requires richer deposit relations than the applicant relation currently returns. If so, the correct fix is to centralize that richer shape in one server-side query rather than fetching a lighter applicant and then re-querying applications on the client.

### Fix
1. Decide on the exact profile data shape needed
2. Return that shape from one server-side load path
3. Remove the extra `findApplicationsByApplicant()` client query from `ProfileView`

---

## 🟡 MEDIUM: Shared Apply UI Lives Inside a Page Feature Folder

**File:** `src/app/apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`

```ts
import CoursesFilters from '@/app/apply/courses/_components/CoursesFilters';
```

**Problem:**
- The wizard step imports reusable UI from the `apply/courses` page feature's private `_components/` folder
- This creates the same encapsulation problem as the Footer and admissions `_components` imports, just within the same top-level module
- The component is now effectively shared UI, but it is not stored in a shared location

### Fix
Move `CoursesFilters` to an apply-shared component location and have both the courses page and wizard step import from there.

---

## 🟡 MEDIUM: Apply Module Has No Repository/Service Layer

The entire `src/app/apply/` module has NO `_server/repository.ts` or `_server/service.ts` at the module root. Each wizard step has its own `_server/actions.ts` that either:
1. Calls domain functions from other modules directly (acceptable but fragile)
2. Performs raw DB operations (violation — see above)

### Recommendation
For operations that are application-specific (payments, document uploads), create at minimum thin wrappers in the appropriate domain module repositories rather than inlining DB access in the apply module's actions.
