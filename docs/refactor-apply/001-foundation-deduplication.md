# Part 1 — Foundation & Deduplication

Eliminates ~1000 lines of duplicated code by extracting shared types, centralizing constants, and merging near-identical components.

**Priority**: 🔴 Critical — must complete before Part 2

## Legend
- ✅ Done
- 🔲 Not started

---

### 🔲 1.1 Extract Shared Upload Types

**Action**: Create `src/app/apply/_lib/types.ts`

**Move** the following types from both `DocumentUpload.tsx` and `MobileDocumentUpload.tsx`:
- `DocumentUploadType` (`'identity' | 'certificate' | 'receipt' | 'any'`)
- `UploadState` (`'idle' | 'uploading' | 'analyzing' | 'confirming' | 'confirmed' | 'error'`)
- `AnalysisResultMap` (maps document type → analysis result shape)
- `DocumentUploadResult`

**Impact**: DocumentUpload.tsx, MobileDocumentUpload.tsx, all confirmation modals

**Can parallelize with**: 1.2

---

### 🔲 1.2 Centralize Constants

**Action (A)**: Create `src/app/apply/_lib/constants.ts` for module-level constants that are the same across deployments.

**Action (B)**: Extend `AppConfig` in `src/config/index.ts` with an `apply.banking` section for deployment-specific banking details, then populate in `src/config/lesotho.config.ts` and `src/config/eswatini.config.ts`.

**Constants to centralize**:
| Constant | Current locations | Target |
|----------|-------------------|--------|
| `MAX_FILE_SIZE` (2MB) | DocumentUpload.tsx, MobileDocumentUpload.tsx, identity/actions.ts, qualifications/actions.ts, payment/actions.ts | `apply/_lib/constants.ts` |
| `POLL_INTERVAL` (5000ms) | MobilePayment.tsx | `apply/_lib/constants.ts` |
| `TIMEOUT_SECONDS` (90s) | MobilePayment.tsx | `apply/_lib/constants.ts` |
| Banking details (`9080003987813`, `060667`, beneficiary name/variations) | payment/validation.ts, ReceiptUpload.tsx | `config.apply.banking` |
| `SALES_RECEIPT_ISSUERS` | payment/validation.ts | `config.apply.banking.salesReceiptIssuers` |

**Remove**: All 5 `MAX_FILE_SIZE` definitions + hardcoded banking details from:
- `apply/_components/DocumentUpload.tsx`
- `apply/_components/MobileDocumentUpload.tsx`
- `apply/[id]/(wizard)/identity/_server/actions.ts`
- `apply/[id]/(wizard)/qualifications/_server/actions.ts`
- `apply/[id]/(wizard)/payment/_server/actions.ts`
- `apply/[id]/(wizard)/payment/_server/validation.ts`
- `apply/[id]/(wizard)/payment/_components/ReceiptUpload.tsx`
- `apply/[id]/(wizard)/payment/_components/MobilePayment.tsx`

**Note**: Only banking details go in `AppConfig` (they vary per deployment: Lesotho vs Eswatini). `MAX_FILE_SIZE`, `POLL_INTERVAL`, `TIMEOUT_SECONDS` are module constants — same across all deployments.

**Can parallelize with**: 1.1

---

### 🔲 1.3 Create Responsive DocumentUpload Component

**Action**: Merge `DocumentUpload.tsx` (~455 lines) and `MobileDocumentUpload.tsx` (~540 lines) into **one** responsive component.

**Strategy**:
- Auto-detect mobile via `useMediaQuery`
- Render camera/gallery inputs on mobile, Dropzone on desktop
- Extract shared helper functions into the single component:
  - `getFileIcon(mimeType)`
  - `getStatusMessage(uploadState)`
  - `getStatusColor(uploadState)`
  - `handleConfirm()` / `handleCancelConfirm()`
  - The `/api/documents/analyze` fetch logic (~90 lines duplicated)
- Both variants share the same core rendering, differing only in input mechanism

**Delete**: `MobileDocumentUpload.tsx`

**Update**: All import sites to use the single `DocumentUpload`

**Depends on**: 1.1 (shared types), 1.2 (centralized MAX_FILE_SIZE)

---

### 🔲 1.4 Create BaseConfirmationModal + ConfirmationField

**Action**: Create shared modal shell in `src/app/apply/_components/BaseConfirmationModal.tsx`
- Props: `title`, `opened`, `onConfirm`, `onCancel`, `children`
- Shared confirm/cancel button layout

**Action**: Create `ConfirmationField` component to replace `IDField`, `CertField`, `ReceiptField` (identical components with different names):
```tsx
// All three are the same:
function IDField({ label, value }: { label: string; value: string | undefined }) { ... }
function CertField({ label, value }: { label: string; value: string | undefined | null }) { ... }
function ReceiptField({ label, value }: { label: string; value: string | null | undefined }) { ... }
```

**Refactor**:
- `IdentityConfirmationModal.tsx` → uses BaseConfirmationModal + ConfirmationField
- `ReceiptConfirmationModal.tsx` → uses BaseConfirmationModal + ConfirmationField
- `CertificateConfirmationModal.tsx` → uses BaseConfirmationModal + ConfirmationField + custom children for grade tables

**Note**: Keep `CertificateConfirmationModal` specialized for its richer academic-record presentation — only extract the shell and field primitives.

---

### 🔲 1.5 Create DocumentStepForm Wrapper

**Action**: Create `src/app/apply/[id]/(wizard)/_components/DocumentStepForm.tsx`

**Props**:
- `maxDocuments: number`
- `documentType: DocumentUploadType`
- `documents: Document[]`
- `onUpload: (result) => void`
- `onDelete: (docId) => void`
- `renderCard: (doc) => ReactNode`

**Handles**: Document limit alert, auto mobile/desktop detection (now unified from 1.3), uploaded cards display, upload trigger, WizardNavigation

**Refactor**:
- `IdentityUploadForm.tsx` → thin wrapper using DocumentStepForm
- `QualificationsUploadForm.tsx` → thin wrapper using DocumentStepForm

**Depends on**: 1.3 (unified DocumentUpload)

---

### 🔲 1.6 Replace InfoTab FieldDisplay with FieldView

**File**: `src/app/apply/profile/_components/InfoTab.tsx` (lines 181–198)

**Action**: Delete local `FieldDisplay` component:
```tsx
interface FieldDisplayProps {
  label: string;
  value: React.ReactNode;
}
function FieldDisplay({ label, value }: FieldDisplayProps) { ... }
```

**Replace**: All usages with `FieldView` from `@/shared/ui/adease/`

---

### 🔲 1.7 Replace Math.random() with nanoid()

**File**: `src/app/apply/[id]/(wizard)/payment/_components/ReceiptUpload.tsx` (line 55)

**Action**: Replace local `generateId()` using `Math.random().toString(36)` with `nanoid()`

**Remove**: Local `generateId` function

---

### 🔲 1.8 Replace formatRole with toTitleCase

**File**: `src/app/apply/restricted/page.tsx`

**Action**: Remove local `formatRole()` function:
```ts
function formatRole(role: string) {
  return role.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
```

**Replace**: With `toTitleCase()` from `@/shared/lib/utils/utils`
