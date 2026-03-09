# 03 — Type Safety Issues

## 🟠 HIGH: WizardStep Name Collision

Two different types named `WizardStep` exist in the same module:

### Definition 1: `src/app/apply/_lib/wizard-utils.ts`
```ts
type WizardStep = 'identity' | 'qualifications' | 'program' | 'personal-info' | 'review' | 'payment';
```
A string union used by `computeWizardStep()`.

### Definition 2: `src/app/apply/[id]/(wizard)/_lib/wizard-steps.ts`
```ts
export type WizardStep = {
  label: string;
  path: string;
  description: string;
};
```
An object type used by `WIZARD_STEPS` array.

**Problem:** Same name, completely different shapes. Confusing for any developer working across these files.

### Fix
- Rename the string union to `WizardStepId` or `WizardStepSlug`
- Keep the object type as `WizardStep`
- Update `computeWizardStep()` return type accordingly

---

## 🟠 HIGH: Weak Typing in wizard-utils.ts

**File:** `src/app/apply/_lib/wizard-utils.ts`

```ts
type ApplicantData = {
  // ...
  academicRecords: unknown[];
  guardians: unknown[];
};
```

**Problem:** Uses `unknown[]` instead of importing the actual types. This defeats TypeScript's purpose — any property access on array items requires casting.

### Fix
Import the actual record types from `ApplicantWithRelations` in `useApplicant.ts` or from the domain schemas directly.

---

## 🟠 HIGH: Loose Type Annotations in Actions

### File: `src/app/apply/[id]/(wizard)/program/_server/actions.ts`
```ts
const existing = applications.find((app: { status: string }) => ...)
```

### File: `src/app/apply/[id]/(wizard)/review/_server/actions.ts`
```ts
// Similar loose annotation pattern
```

**Problem:** Using `{ status: string }` inline instead of the proper `Application` type (or `typeof applications.$inferSelect`). This bypasses compile-time checking of the status field values.

### Fix
Import the proper type from the schema:
```ts
import type { Application } from '@admissions/_database';
```

---

## 🟡 MEDIUM: Missing Type Exports / Scattered Type Definitions

Several types are defined locally where they should be centralized:

| Type | Location | Should Be |
|------|----------|-----------|
| `DocumentUploadType` | DocumentUpload.tsx, MobileDocumentUpload.tsx | `_lib/types.ts` |
| `UploadState` | DocumentUpload.tsx, MobileDocumentUpload.tsx | `_lib/types.ts` |
| `DocumentUploadResult` | DocumentUpload.tsx, MobileDocumentUpload.tsx | `_lib/types.ts` |
| `Guardian` (local) | GuardianManager.tsx | Import from schema |
| `ApplicantData` | wizard-utils.ts | Import from useApplicant.ts |

### Fix
Create `src/app/apply/_lib/types.ts` with all shared upload types, and import domain types from their schemas.
