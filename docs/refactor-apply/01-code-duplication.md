# 01 — Code Duplication

## 🔴 CRITICAL: DocumentUpload vs MobileDocumentUpload (~95% identical)

**Files:**
- `src/app/apply/_components/DocumentUpload.tsx` (~480 lines)
- `src/app/apply/_components/MobileDocumentUpload.tsx` (~540 lines)

**Problem:**
These two components are nearly identical. MobileDocumentUpload adds camera capture and gallery input, but the core logic — document analysis, confirmation flow, state management, type definitions, and rendering — is duplicated verbatim.

### Duplicated Types (redefined in both files)
```ts
type DocumentUploadType = 'identity' | 'certificate' | 'receipt' | 'any';
type UploadState = 'idle' | 'uploading' | 'analyzing' | 'confirming' | 'confirmed' | 'error';
type AnalysisResultMap = { identity: ...; certificate: ...; receipt: ...; any: null };
type DocumentUploadResult = { ... };
```

### Duplicated Functions (identical in both files)
- `getFileIcon(mimeType)` — returns icon based on MIME type
- `getStatusMessage(uploadState)` — status text for state
- `getStatusColor(uploadState)` — color for state
- `handleConfirm()` — triggers onUploadComplete callback
- `handleCancelConfirm()` — resets state
- The entire if/else chain for `/api/documents/analyze` fetch logic (~90 lines each)

### Duplicated Rendering
- Both render `IdentityConfirmationModal`, `CertificateConfirmationModal`, `ReceiptConfirmationModal`
- Both render identical "file uploaded" UI with status overlay

### Fix
1. Extract all shared types into `_lib/types.ts`
2. Create a `useDocumentUpload(type, onUploadComplete)` hook with ALL shared logic
3. Create a single `DocumentUpload` component with a `variant: 'desktop' | 'mobile'` prop
4. Mobile variant adds camera/gallery inputs, desktop variant uses Dropzone
5. Both variants share the same core rendering, just differ in the input mechanism

---

## 🟠 HIGH: Confirmation modals duplicate shell and field patterns

**Files:**
- `src/app/apply/_components/IdentityConfirmationModal.tsx`
- `src/app/apply/_components/CertificateConfirmationModal.tsx`
- `src/app/apply/_components/ReceiptConfirmationModal.tsx`

**Problem:**
All three modals share the same outer modal pattern:
1. Modal shell with title and confirm/cancel buttons
2. Data display using local field helpers (`IDField`, `CertField`, `ReceiptField`)
3. Same opened/onConfirm/onCancel prop pattern

`IdentityConfirmationModal` and `ReceiptConfirmationModal` are especially close. `CertificateConfirmationModal` is more specialized because it also renders subject tables, badges, and certificate-specific summary sections, so it is not accurate to treat all three as near-identical end-to-end.

Each still defines its own field display component:
```tsx
// IdentityConfirmationModal.tsx
function IDField({ label, value }: { label: string; value: string | undefined }) { ... }

// CertificateConfirmationModal.tsx
function CertField({ label, value }: { label: string; value: string | undefined | null }) { ... }

// ReceiptConfirmationModal.tsx
function ReceiptField({ label, value }: { label: string; value: string | null | undefined }) { ... }
```

These are the same component with different names.

### Fix
1. Extract a shared `BaseConfirmationModal` shell for title, layout, and actions
2. Extract a shared `ConfirmationField` primitive for the repeated label/value rows
3. Keep `CertificateConfirmationModal` specialized for the richer academic-record presentation instead of forcing a fully generic modal abstraction

If a generic modal is still desired, it should only cover the shared shell:
   ```tsx
   type Props = {
     title: string;
     opened: boolean;
     onConfirm: () => void;
     onCancel: () => void;
     fields: Array<{ label: string; value: string | null | undefined }>;
     children?: ReactNode; // for custom rendering (e.g., grade colors)
   };
   ```
4. Each document type passes its specific fields or custom body via config
5. Place shared pieces in `src/app/apply/_components/`

---

## 🔴 CRITICAL: MAX_FILE_SIZE defined in 5+ files

**Locations:**
- `src/app/apply/_components/DocumentUpload.tsx` — `const MAX_FILE_SIZE = 2 * 1024 * 1024`
- `src/app/apply/_components/MobileDocumentUpload.tsx` — `const MAX_FILE_SIZE = 2 * 1024 * 1024`
- `src/app/apply/[id]/(wizard)/identity/_server/actions.ts` — `const MAX_FILE_SIZE = 2 * 1024 * 1024`
- `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` — `const MAX_FILE_SIZE = 2 * 1024 * 1024`
- `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` — `const MAX_FILE_SIZE = 2 * 1024 * 1024`

**Fix:**
Create `src/app/apply/_lib/constants.ts`:
```ts
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
```
Import from this single source everywhere.

---

## 🟠 HIGH: Upload Form Structural Duplication

**Files:**
- `src/app/apply/[id]/(wizard)/identity/_components/IdentityUploadForm.tsx`
- `src/app/apply/[id]/(wizard)/qualifications/_components/QualificationsUploadForm.tsx`

**Problem:**
Both follow the exact same structure:
1. Document limit alert (identity: 1, qualifications: 3)
2. Mobile/desktop toggle based on `useMediaQuery`
3. Display uploaded document cards
4. Show DocumentUpload/MobileDocumentUpload when under limit
5. WizardNavigation at bottom

### Fix
Create a `DocumentStepForm` wrapper accepting:
- `maxDocuments: number`
- `documentType: DocumentUploadType`
- `documents: Document[]`
- `onUpload: (result) => void`
- `onDelete: (docId) => void`
- `renderCard: (doc) => ReactNode`

---

## 🟠 HIGH: InfoTab reinvents FieldView

**File:** `src/app/apply/profile/_components/InfoTab.tsx` (lines 181–198)

**Problem:**
Defines a local `FieldDisplay` component:
```tsx
interface FieldDisplayProps {
  label: string;
  value: React.ReactNode;
}
function FieldDisplay({ label, value }: FieldDisplayProps) { ... }
```

**Existing shared component:** `src/shared/ui/adease/FieldView.tsx`

### Fix
Replace all `FieldDisplay` usages with `FieldView` from `@/shared/ui/adease/`.
