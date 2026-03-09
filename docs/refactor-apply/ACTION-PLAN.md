# Apply Module — Refactor Action Plan

Consolidated from the 5 audit documents with user-approved decisions.

## Approach
- **Strategy**: Fix-as-you-go (document by document, 01 → 05)
- **Scope**: All issues (Critical + High + Medium)
- **Verification**: `pnpm tsc --noEmit & pnpm lint:fix` after each step

---

## Phase 1: Code Duplication (01)

### 1.1 Extract Shared Upload Types
- **Action**: Create `src/app/apply/_lib/types.ts`
- **Move**: `DocumentUploadType`, `UploadState`, `AnalysisResultMap`, `DocumentUploadResult` from both DocumentUpload files
- **Impact**: DocumentUpload.tsx, MobileDocumentUpload.tsx, confirmation modals

### 1.2 Centralize Constants in lesotho.config.ts
- **Action**: Extend `AppConfig` interface in `src/config/index.ts` with an `apply` section
- **Add to** `src/config/lesotho.config.ts`:
  - `MAX_FILE_SIZE: 2 * 1024 * 1024`
  - Banking details: `beneficiaryName`, `beneficiaryAccount`, `branchCode`, `beneficiaryVariations`, `salesReceiptIssuers`
  - `pollInterval`, `timeoutSeconds` (for mobile payment)
- **Remove**: All 5 `MAX_FILE_SIZE` definitions + hardcoded banking details from:
  - `apply/_components/DocumentUpload.tsx`
  - `apply/_components/MobileDocumentUpload.tsx`
  - `apply/[id]/(wizard)/identity/_server/actions.ts`
  - `apply/[id]/(wizard)/qualifications/_server/actions.ts`
  - `apply/[id]/(wizard)/payment/_server/actions.ts`
  - `apply/[id]/(wizard)/payment/_server/validation.ts`
  - `apply/[id]/(wizard)/payment/_components/ReceiptUpload.tsx`
  - `apply/[id]/(wizard)/payment/_components/MobilePayment.tsx`

### 1.3 Create Responsive DocumentUpload Component
- **Action**: Merge `DocumentUpload.tsx` (~480 lines) and `MobileDocumentUpload.tsx` (~540 lines) into **one** responsive component
- **Strategy**: Auto-detect mobile via `useMediaQuery`, render camera/gallery inputs on mobile, Dropzone on desktop
- **Extract**: Shared helper functions (`getFileIcon`, `getStatusMessage`, `getStatusColor`, `handleConfirm`, `handleCancelConfirm`, analyze fetch logic) into the single component
- **Delete**: `MobileDocumentUpload.tsx`
- **Update**: All import sites to use the single `DocumentUpload`

### 1.4 Create BaseConfirmationModal + ConfirmationField
- **Action**: Create shared modal shell in `src/app/apply/_components/BaseConfirmationModal.tsx`
  - Props: `title`, `opened`, `onConfirm`, `onCancel`, `children`
  - Shared confirm/cancel button layout
- **Action**: Create `ConfirmationField` component (replaces `IDField`, `CertField`, `ReceiptField`)
- **Refactor**:
  - `IdentityConfirmationModal.tsx` → uses BaseConfirmationModal + ConfirmationField
  - `ReceiptConfirmationModal.tsx` → uses BaseConfirmationModal + ConfirmationField
  - `CertificateConfirmationModal.tsx` → uses BaseConfirmationModal + ConfirmationField + custom children for grade tables

### 1.5 Create DocumentStepForm Wrapper
- **Action**: Create `src/app/apply/[id]/(wizard)/_components/DocumentStepForm.tsx`
- **Props**: `maxDocuments`, `documentType`, `documents`, `onUpload`, `onDelete`, `renderCard`
- **Handles**: Document limit alert, auto mobile/desktop detection, uploaded cards display, upload trigger, WizardNavigation
- **Refactor**:
  - `IdentityUploadForm.tsx` → thin wrapper using DocumentStepForm
  - `QualificationsUploadForm.tsx` → thin wrapper using DocumentStepForm

### 1.6 Replace InfoTab FieldDisplay with FieldView
- **File**: `src/app/apply/profile/_components/InfoTab.tsx`
- **Action**: Delete local `FieldDisplay` component, replace all usages with `FieldView` from `@/shared/ui/adease/`

---

## Phase 2: Architecture Violations (02)

### 2.1 Move Payment DB Access to Repository + Service
- **Action**: Create proper repository and service files for payment-related DB operations
- **Use existing domain modules** (finance for deposits, admissions for applicant docs) or create apply-level repository if the operations are apply-specific
- **Refactor**:
  - `payment/_server/actions.ts` → call service/repository instead of raw `db.transaction()`
  - `payment/_server/validation.ts` → call repository instead of raw `db.query`
- **Remove**: All `import { db } from '@/core/database'` from these files

### 2.2 Extend Shared getGradeColor
- **Action**: Modify `src/shared/lib/utils/colors.ts` `getGradeColor` to accept `string | null` as well as `Grade` enum
- **Preserve**: Add an optional argument/overload so the admissions version's behavior is preserved
- **Delete**: The duplicate `getGradeColor` export from `AcademicRecordsTab.tsx` in admissions
- **Update imports** in:
  - `apply/_components/CertificateConfirmationModal.tsx`
  - `apply/[id]/(wizard)/qualifications/_components/AcademicRecordCard.tsx`
  - `apply/profile/_components/InfoTab.tsx`

### 2.3 Move Footer to shared/ui/
- **Action**: Move `Footer` from `src/app/student-portal/_shared/` to `src/shared/ui/`
- **Update imports** in both `apply/page.tsx` and `student-portal` consumers

### 2.4 Move CoursesFilters to apply/_components/
- **Action**: Move `CoursesFilters` from `apply/courses/_components/` to `src/app/apply/_components/`
- **Update imports** in:
  - `apply/courses/` page
  - `apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`

### 2.5 Consolidate ProfileView Query
- **Action**: Enrich the server-side applicant query to include all needed relations (including deposit data)
- **Remove**: Client-side `findApplicationsByApplicant()` TanStack Query from `ProfileView.tsx`
- **Pass**: Pre-loaded data as props instead of re-fetching

---

## Phase 3: Type Safety (03)

### 3.1 Rename WizardStep Union to WizardStepId
- **File**: `src/app/apply/_lib/wizard-utils.ts`
- **Action**: Rename `type WizardStep` → `type WizardStepId`
- **Update**: `computeWizardStep()` return type and all consumers

### 3.2 Replace unknown[] with Schema Types
- **File**: `src/app/apply/_lib/wizard-utils.ts`
- **Action**: Import `AcademicRecord`, `Guardian` (or equivalent) from domain schemas
- **Replace**: `academicRecords: unknown[]` → proper type, `guardians: unknown[]` → proper type

### 3.3 Use Application Type in Actions
- **Files**: `program/_server/actions.ts`, `review/_server/actions.ts`
- **Action**: Import `Application` type from `@admissions/_database`
- **Replace**: Inline `{ status: string }` annotations with proper type

---

## Phase 4: Anti-Patterns (04)

### 4.1 Fix CourseSelectionForm Render-Time State
- **File**: `src/app/apply/[id]/(wizard)/program/_components/CourseSelectionForm.tsx`
- **Action**: Conditionally render form only when application data is ready; pass existing values as defaults
- **Remove**: The `if (appLoaded && !initialized)` render-phase state update block

### 4.2 Gate PersonalInfoForm on Data Ready
- **File**: `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`
- **Action**: Show loading skeleton until `applicant` data arrives from `useApplicant()`
- **Then**: Mount form with correct initial values

### 4.3 Relocate Geolocation Capture
- **File**: `src/app/apply/_lib/useApplicant.ts` (lines 155–168)
- **Action**: Move geolocation capture to `welcome/page.tsx` or `new/page.tsx` as a one-time action after user consent
- **Remove**: useEffect + useRef geolocation pattern from useApplicant

### 4.4 Server-Side Eligibility Redirect
- **File**: `src/app/apply/_lib/useApplicant.ts` (lines 137–145)
- **Action**: Move eligibility check to server-side (layout.tsx server component or middleware)
- **Remove**: Client-side useEffect redirect

### 4.5 Replace Manual Polling with TanStack
- **File**: `src/app/apply/[id]/(wizard)/payment/_components/MobilePayment.tsx`
- **Action**: Replace `useEffect` + `setInterval` with TanStack Query's `refetchInterval`
- **Pattern**:
  ```ts
  useQuery({
    queryKey: ['payment-status', transactionRef],
    queryFn: () => checkPaymentStatus(transactionRef),
    refetchInterval: POLL_INTERVAL,
    enabled: !!transactionRef,
  });
  ```

### 4.6 Remove Console Statements
- **Files**:
  - `qualifications/_server/actions.ts` (lines 162, 190)
  - `payment/_server/actions.ts` (line 120)
- **Action**: Remove all `console.info` and `console.error` calls

### 4.7 Fix Module-Scope Date Computation
- **File**: `qualifications/_server/actions.ts`
- **Action**: Move `const CURRENT_YEAR = new Date().getFullYear()` inside the function that uses it

### 4.8 Replace Math.random() with nanoid()
- **File**: `payment/_components/ReceiptUpload.tsx`
- **Action**: Replace `generateId()` using `Math.random()` with `nanoid()`
- **Remove**: Local `generateId` function

---

## Phase 5: Inconsistencies & Style (05)

### 5.1 Batch Convert Default Exports to Named
- **Action**: Convert ALL default exports in the apply module to named exports
- **Files** (at minimum):
  - `WizardLayout.tsx`, `WizardNavigation.tsx`
  - `ApplyHeader.tsx`, `ApplyHero.tsx`
  - `CourseSelectionForm.tsx`, `PersonalInfoForm.tsx`
  - `ReceiptUpload.tsx`
  - All other default-exported components in `src/app/apply/`
- **Update**: All import sites

### 5.2 Extend WizardNavigation for Submit
- **File**: `src/app/apply/[id]/(wizard)/_components/WizardNavigation.tsx`
- **Action**: Add `onSubmit` prop and custom submit label support for the final step
- **Refactor**: `ReviewForm.tsx` to use extended WizardNavigation instead of custom buttons

### 5.3 Full Inline Styles Audit
- **Action**: Audit all 30+ `style={{}}` instances across 15 files
- **Replace** with Mantine props where possible:
  - `style={{ opacity: 0.7 }}` → `opacity={0.7}`
  - `style={{ flex: 1 }}` → `flex={1}`
  - `<div style={...}>` → `<Box ...>`
- **ProfileView.tsx**: Replace `styles={{}}` on Tabs with Mantine variants or `classNames`

### 5.4 Convert [id]/layout.tsx to Server Component
- **File**: `src/app/apply/[id]/layout.tsx`
- **Action**: Remove `'use client'` directive
- **Replace**: `useMantineColorScheme()` with Mantine's `light-dark()` CSS function or CSS variables

### 5.5 Replace formatRole with toTitleCase
- **File**: `src/app/apply/restricted/page.tsx`
- **Action**: Remove local `formatRole()` function
- **Replace**: With `toTitleCase()` from `@/shared/lib/utils/utils`

### 5.6 Rename Wizard CourseCard to ProgramChoiceCard
- **File**: `src/app/apply/[id]/(wizard)/program/_components/CourseCard.tsx`
- **Action**: Rename file to `ProgramChoiceCard.tsx`, rename component
- **Update**: All import sites

### 5.7 Add PersonalInfoForm Validation
- **File**: `src/app/apply/[id]/(wizard)/personal-info/_components/PersonalInfoForm.tsx`
- **Action**: Add Zod schema or Mantine form validate rules for:
  - Date of birth: reasonable range, not in future
  - National ID format
  - Phone number format
  - Gender: required
  - Other required fields

---

## Execution Notes
- Each step concludes with `pnpm tsc --noEmit & pnpm lint:fix`
- Fix any issues before proceeding to next step
- Steps within a phase can sometimes be done in parallel (e.g., 1.1 + 1.2 before 1.3)
- Phase 1 should be completed before Phase 2 (some Phase 2 items depend on Phase 1 extractions)
