# Part 2 — Architecture & Type Safety

Fixes database access violations, cross-module encapsulation breaches, and type safety issues.

**Priority**: 🔴 Critical (DB access) / 🟠 High (types)
**Depends on**: Part 1 (some imports change after deduplication)

## Legend
- ✅ Done
- 🔲 Not started

---

### ✅ 2.1 Move Payment DB Access to Repository + Service

The project mandates only `repository.ts` files may import `db`. Two payment files violate this.

**File 1**: `src/app/apply/[id]/(wizard)/payment/_server/actions.ts`
```ts
import { bankDeposits, db, documents } from '@/core/database';
// Raw db.transaction() with tx.insert() calls
```

**File 2**: `src/app/apply/[id]/(wizard)/payment/_server/validation.ts`
```ts
import { applicants, db, intakePeriods } from '@/core/database';
// Raw db.query calls + hardcoded business constants
```

**Action**:
1. Create proper repository and service for payment-related DB operations in the relevant domain modules (finance for deposits, admissions for applicant docs) or create apply-level `_server/repository.ts` if operations are apply-specific
2. Payment actions → call service/repository, not raw `db.transaction()`
3. Validation queries → go through repositories
4. Remove all `import { db } from '@/core/database'` from action/validation files

---

### ✅ 2.2 Extend Shared getGradeColor

Three files import `getGradeColor` from a deeply nested admissions component (encapsulation violation):
```ts
import { getGradeColor } from '@/app/admissions/applicants/[id]/_components/AcademicRecordsTab';
```

**Affected files**:
1. `src/app/apply/_components/CertificateConfirmationModal.tsx`
2. `src/app/apply/[id]/(wizard)/qualifications/_components/AcademicRecordCard.tsx`
3. `src/app/apply/profile/_components/InfoTab.tsx`

**Root cause**: The shared `getGradeColor` in `src/shared/lib/utils/colors.ts` only accepts `Grade` enum. The admissions version accepts `string | null`.

**Action**:
1. Extend `getGradeColor` in `src/shared/lib/utils/colors.ts` to accept `string | null` as well as `Grade`
2. Delete the duplicate from `AcademicRecordsTab.tsx`
3. Update all 3 files to import from `@/shared/lib/utils/colors`

---

### ✅ 2.3 Move Footer to shared/ui/

**File**: `src/app/apply/page.tsx`
```ts
import { Footer } from '../student-portal/_shared';
```

**Problem**: Apply module imports `Footer` from student-portal's internal `_shared` folder.

**Action**:
1. Move `Footer` from `src/app/student-portal/_shared/` to `src/shared/ui/`
2. Update imports in both `apply/page.tsx` and `student-portal` consumers

---

### ✅ 2.4 Move CoursesFilters to apply/_components/

**File**: `src/app/apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`
```ts
import CoursesFilters from '@/app/apply/courses/_components/CoursesFilters';
```

**Problem**: Wizard step imports from the courses page's private `_components/` folder.

**Action**:
1. Move `CoursesFilters` from `apply/courses/_components/` to `src/app/apply/_components/`
2. Update imports in both the courses page and the wizard's `CourseSelectionForm.tsx`

---

### ✅ 2.5 Consolidate ProfileView Query

**File**: `src/app/apply/profile/_components/ProfileView.tsx`

**Problem**: `ProfileView` calls `findApplicationsByApplicant(applicant.id)` via TanStack Query because the applicant data from `useApplicant()` does NOT include `bankDeposits` or `mobileDeposits` on the applications relation. This creates an extra client round-trip.

**Action**:
1. Enrich the server-side applicant query (`getOrCreateApplicantForCurrentUser` → `findByUserId` in applicants repository) to include `bankDeposits` and `mobileDeposits` on the applications relation
2. Remove the client-side `findApplicationsByApplicant()` TanStack Query from `ProfileView`
3. Use `applicant.applications` (now enriched with deposit data) directly

**Note**: This is NOT a simple removal — the separate query fetches deposit data that the applicant query currently lacks. The fix requires enriching the upstream query first.

---

### ✅ 2.6 Rename WizardStep Union to WizardStepId

**File**: `src/app/apply/_lib/wizard-utils.ts`

Two different types named `WizardStep` exist:
- `wizard-utils.ts`: `type WizardStep = 'identity' | 'qualifications' | ...` (string union)
- `wizard-steps.ts`: `type WizardStep = { label: string; path: string; description: string }` (object)

**Action**:
1. Rename the string union to `WizardStepId`
2. Keep the object type as `WizardStep`
3. Update `computeWizardStep()` return type and all consumers

---

### ✅ 2.7 Replace unknown[] with Schema Types

**File**: `src/app/apply/_lib/wizard-utils.ts`

```ts
type ApplicantData = {
  academicRecords: unknown[];
  guardians: unknown[];
};
```

**Action**: Import actual types from domain schemas and replace `unknown[]` with proper types.

---

### ✅ 2.8 Use Application Type in Actions

**Files**:
- `src/app/apply/[id]/(wizard)/program/_server/actions.ts`
- `src/app/apply/[id]/(wizard)/review/_server/actions.ts`

```ts
const existing = applications.find((app: { status: string }) => ...)
```

**Action**: Import `Application` type from `@admissions/_database` and replace inline `{ status: string }` annotations.
