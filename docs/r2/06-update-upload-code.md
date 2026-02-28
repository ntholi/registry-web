# Step 6: Update All Upload Code

> **Priority:** High  
> **Risk:** Medium (changes upload paths for new files)  
> **Estimated effort:** 2–3 hours  
> **Prerequisite:** Steps 1–5 completed

---

## Objective

Update every file upload callsite to use `StoragePaths`, `uploadFile`, and `generateUploadKey` from the centralized storage utility. No more ad-hoc folder strings.

## IMPORTANT: Client Components and Storage Imports

> **Since `storage.ts` is now a plain server module (no `'use server'` directive), client components CANNOT import `uploadFile`/`deleteFile` directly.** All upload and delete operations from client components MUST go through module-specific server actions. Pure utilities like `StoragePaths` and `getPublicUrl` are imported from `@/core/integrations/storage-utils` (no restrictions).

## 6.1 — Student Photo Upload

### Files to update:
- `src/app/registry/students/_components/info/PhotoView.tsx`
- `src/app/registry/students/_components/card/PhotoSelection.tsx`

### Current code (PhotoView.tsx):
```typescript
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
// ...
if (photoUrl) {
  await deleteDocument(photoUrl);
}
const fileName = `${student.stdNo}.jpg`;
const photoFile = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });
await uploadDocument(photoFile, fileName, 'photos');
```

### New code:
```typescript
import { uploadStudentPhoto } from '../../_server/actions';
// NO import from '@/core/integrations/storage'

const photoFile = new File([croppedImageBlob], `${student.stdNo}.jpg`, { type: 'image/jpeg' });
await uploadStudentPhoto(student.stdNo, photoFile);
```

### New server action needed in `src/app/registry/students/_server/actions.ts`:
```typescript
export async function uploadStudentPhoto(stdNo: number, photo: File) {
  return service.uploadPhoto(stdNo, photo);
}
```

### Service method:
```typescript
async uploadPhoto(stdNo: number, photo: File) {
  return withAuth(async () => {
    const student = await this.repo.findByStdNo(stdNo);
    if (student?.photoKey) {
      await deleteFile(student.photoKey);
    }
    const key = StoragePaths.studentPhoto(stdNo);
    await uploadFile(photo, key);
    return this.repo.updatePhotoKey(stdNo, key);
  }, ['admin', 'registry']);
}
```

### Repository:
Add `updatePhotoKey(stdNo, key)` method:
```sql
UPDATE students SET photo_key = $1 WHERE std_no = $2
```

### PhotoSelection.tsx:
Same pattern — replace all `uploadDocument(photoFile, fileName, 'photos')` calls with `await uploadStudentPhoto(student.stdNo, photoFile)`. Remove all `deleteDocument` calls (the server action handles old photo cleanup).

Also update the camera capture handler with the same pattern.

> **KEY CHANGE**: The old pattern had the client uploading to S3 then updating DB in separate calls (race condition). The new pattern is a single server action that does both atomically.

## 6.2 — Employee Photo Upload

### Files to update:
- `src/app/human-resource/employees/_components/info/PhotoView.tsx`
- `src/app/human-resource/employees/_components/card/PhotoSelection.tsx`

### Current code:
```typescript
await uploadDocument(photoFile, fileName, 'photos/employees');
```

### New code:
```typescript
import { uploadEmployeePhoto } from '../../_server/actions';
// NO import from '@/core/integrations/storage'

const photoFile = new File([croppedImageBlob], `${employee.empNo}.jpg`, { type: 'image/jpeg' });
await uploadEmployeePhoto(employee.empNo, photoFile);
```

### New server action needed in `src/app/human-resource/employees/_server/actions.ts`:
```typescript
export async function uploadEmployeePhoto(empNo: string, photo: File) {
  return service.uploadPhoto(empNo, photo);
}
```

### Service method (same pattern as students):
Handles old photo cleanup, S3 upload, and DB update atomically.

## 6.3 — Admissions Document Upload

### Files to update:
- `src/app/admissions/applicants/_components/DocumentUpload.tsx` (**client component**)
- `src/app/admissions/applicants/[id]/documents/_components/UploadModal.tsx` (**client component**)
- `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` (server action — can use `uploadFile` directly)
- `src/app/apply/[id]/(wizard)/identity/_server/actions.ts` (server action — can use `uploadFile` directly)

> **CRITICAL**: `DocumentUpload.tsx` and `UploadModal.tsx` are `'use client'` components. They CANNOT import `uploadFile` or `generateUploadKey` from `storage.ts` (a plain server module). They MUST call server actions instead.

### New server action needed in `src/app/admissions/applicants/[id]/documents/_server/actions.ts`:
```typescript
export async function uploadApplicantFile(applicantId: string, file: File): Promise<string> {
  const key = generateUploadKey(
    (fn) => StoragePaths.applicantDocument(applicantId, fn),
    file.name
  );
  await uploadFile(file, key);
  return key;
}
```

### Current code (DocumentUpload.tsx):
```typescript
const folder = 'documents/admissions';
const fileName = `${nanoid()}.${getFileExtension(file.name)}`;
await uploadDocument(file, fileName, folder);
```

### New code (DocumentUpload.tsx):
```typescript
import { uploadApplicantFile } from '../[id]/documents/_server/actions';
// NO import from '@/core/integrations/storage'

const key = await uploadApplicantFile(applicantId, file);
```

### Current code (UploadModal.tsx):
```typescript
const folder = await getDocumentFolder(applicantId);
const fileName = `${nanoid()}${getFileExtension(uploadResult.file.name)}`;
await uploadDocument(uploadResult.file, fileName, folder);
```

### New code (UploadModal.tsx):
```typescript
import { uploadApplicantFile } from '../_server/actions';
// NO import from '@/core/integrations/storage'

const key = await uploadApplicantFile(applicantId, uploadResult.file);
```

### For `saveApplicantDocument`, update to accept a pre-built key:
```typescript
export async function saveApplicantDocument(data: {
  applicantId: string;
  fileName: string;
  fileUrl: string; // Now receives the R2 key directly
  type: DocumentType;
}) {
  return applicantDocumentsService.uploadDocument(
    { fileName: data.fileName, fileUrl: data.fileUrl, type: data.type },
    data.applicantId, 0
  );
}
```

### qualifications/_server/actions.ts (server action — CAN import directly):
```typescript
// Replace:
const folder = 'documents/admissions';
const ext = getFileExtension(file.name);
const fileName = `${nanoid()}${ext}`;
await uploadDocument(file, fileName, folder);

// With:
import { uploadFile } from '@/core/integrations/storage';
import { generateUploadKey, StoragePaths } from '@/core/integrations/storage-utils';

const key = generateUploadKey(
  (fn) => StoragePaths.applicantDocument(applicantId, fn),
  file.name
);
await uploadFile(file, key);
```

### identity/_server/actions.ts:
Same pattern as qualifications (server action, can import directly).

## 6.4 — Student Document Upload (Registry)

### File to update:
- `src/app/registry/students/_components/documents/AddDocumentModal.tsx` (**client component**)

> **CRITICAL**: This is a `'use client'` component. It CANNOT import `uploadFile` or `generateUploadKey` from `storage.ts`. It must call a server action instead.

### New server action needed in `src/app/registry/documents/_server/actions.ts`:
```typescript
export async function uploadAndCreateDocument(data: {
  file: File;
  type: DocumentType;
  stdNo: number;
}) {
  const key = generateUploadKey(
    (fn) => StoragePaths.studentDocument(data.stdNo, fn),
    data.file.name
  );
  await uploadFile(data.file, key);
  return service.create({
    fileName: data.file.name,
    fileUrl: key,
    type: data.type,
    stdNo: data.stdNo,
  });
}
```

### Current code:
```typescript
const uploadPath = `documents/registry/students/${stdNo}`;
const uploadedPath = await uploadDocument(file, generatedFileName, uploadPath);
```

### New code:
```typescript
import { uploadAndCreateDocument } from '@registry/documents';
// NO import from '@/core/integrations/storage'

await uploadAndCreateDocument({ file, type, stdNo });
```

## 6.5 — Term Publication Attachments

### File to update:
- `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx` (**client component**)

> **CRITICAL**: This is a `'use client'` component. It CANNOT import `uploadFile` from `storage.ts`. It must call a server action instead.

### New server action needed in `src/app/registry/terms/settings/_server/actions.ts`:
```typescript
export async function uploadPublicationAttachment(data: {
  termCode: string;
  file: File;
  type: 'scanned-pdf' | 'raw-marks' | 'other';
}) {
  const key = StoragePaths.termPublication(data.termCode, data.type, data.file.name);
  await uploadFile(data.file, key);
  return service.createPublicationAttachment({
    termCode: data.termCode,
    fileName: data.file.name,
    type: data.type,
    storageKey: key,
  });
}

export async function deletePublicationAttachmentWithFile(id: string) {
  const attachment = await service.getPublicationAttachment(id);
  if (attachment?.storageKey) {
    await deleteFile(attachment.storageKey);
  } else if (attachment) {
    const fallbackKey = StoragePaths.termPublication(
      attachment.termCode, attachment.type, attachment.fileName
    );
    await deleteFile(fallbackKey);
  }
  return service.deletePublicationAttachment(id);
}
```

### Current code:
```typescript
const folder = await getAttachmentFolderPath(termCode, type);
await uploadDocument(file, file.name, folder);
```

### New code:
```typescript
import { uploadPublicationAttachment, deletePublicationAttachmentWithFile } from '../../_server/actions';
// NO import from '@/core/integrations/storage'

await uploadPublicationAttachment({ termCode, file, type });
```

## 6.6 — Library Question Papers

### File to update:
- `src/app/library/resources/question-papers/_server/actions.ts`

### Current code:
```typescript
const FOLDER = 'library/question-papers';
const fileName = `${nanoid()}.${ext}`;
await uploadDocument(file, fileName, FOLDER);
const fileUrl = `${BASE_URL}/${FOLDER}/${fileName}`;
```

### New code:
```typescript
import { StoragePaths, uploadFile, generateUploadKey, getPublicUrl } from '@/core/integrations/storage';

const key = generateUploadKey(StoragePaths.questionPaper, file.name);
await uploadFile(file, key);

// In DB insert:
const [doc] = await tx.insert(documents).values({
  fileName: key.split('/').pop()!, // Just the filename part
  fileUrl: key, // Store key, not full URL
}).returning();
```

Remove the `BASE_URL` and `FOLDER` constants.

## 6.7 — Library Publications

### File to update:
- `src/app/library/resources/publications/_server/actions.ts`

Same pattern as question papers. Remove `BASE_URL` and `FOLDER` constants.

## 6.8 — Delete Operations

Update all delete operations to use `deleteFile` with the stored key:

### Current pattern (e.g., question papers):
```typescript
const key = existing.document.fileUrl.replace(`${BASE_URL}/`, '');
await deleteDocument(key);
```

### New pattern:
```typescript
import { deleteFile } from '@/core/integrations/storage';

await deleteFile(existing.document.fileUrl); // fileUrl IS the key now
```

### Photo deletions:
```typescript
// Before uploading new photo, delete old one
if (student.photoKey) {
  await deleteFile(student.photoKey);
}
```

## 6.9 — Remove Duplicated `formatFileSize`

### Files with duplicated implementation (7 total):
- `src/app/registry/students/_components/documents/AddDocumentModal.tsx` (line 42)
- `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx` (line 67)
- `src/app/library/resources/_components/UploadField.tsx` (line 26)
- `src/app/apply/_components/DocumentUpload.tsx` (line 101)
- `src/app/apply/_components/MobileDocumentUpload.tsx` (line 95)
- `src/app/lms/assignments/_features/submissions/utils.ts` (line 3)
- `src/app/admissions/applicants/_components/DocumentUpload.tsx` (line 53)

### Replace with import:
```typescript
import { formatFileSize } from '@/shared/lib/utils/files';
```

Delete the local `formatFileSize` function from ALL 7 files. The canonical implementation lives in `src/shared/lib/utils/files.ts`.

## 6.10 — Applicant Service (Hardcoded URL)

### File to update:
- `src/app/admissions/applicants/_server/service.ts` (line 186)

### Current code:
```typescript
fileUrl: `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/documents/admissions/${doc.fileName}`,
```

### New code:
```typescript
import { getPublicUrl } from '@/core/integrations/storage';

fileUrl: getPublicUrl(doc.document?.fileUrl || `admissions/applicants/documents/${doc.applicantId}/${doc.fileName}`),
```

## Summary of All Files Changed

| File | Change Type |
|------|-------------|
| `src/app/registry/students/_components/info/PhotoView.tsx` | Use `StoragePaths.studentPhoto` + `uploadFile` + `updateStudentPhotoKey` |
| `src/app/registry/students/_components/card/PhotoSelection.tsx` | Same as above (both photo handlers) |
| `src/app/registry/students/_server/actions.ts` | Add `updateStudentPhotoKey` action |
| `src/app/registry/students/_server/service.ts` | Add `updatePhotoKey` method |
| `src/app/registry/students/_server/repository.ts` | Add `updatePhotoKey` method |
| `src/app/human-resource/employees/_components/info/PhotoView.tsx` | Use `StoragePaths.employeePhoto` + `uploadFile` + `updateEmployeePhotoKey` |
| `src/app/human-resource/employees/_components/card/PhotoSelection.tsx` | Same as above |
| `src/app/human-resource/employees/_server/actions.ts` | Add `updateEmployeePhotoKey` action |
| `src/app/human-resource/employees/_server/service.ts` | Add `updatePhotoKey` method |
| `src/app/human-resource/employees/_server/repository.ts` | Add `updatePhotoKey` method |
| `src/app/admissions/applicants/_components/DocumentUpload.tsx` | Replace `uploadDocument` import with `uploadApplicantFile` server action call, remove `formatFileSize` |
| `src/app/admissions/applicants/_server/service.ts` | Use `getPublicUrl()` |
| `src/app/admissions/applicants/[id]/documents/_server/actions.ts` | Use `getPublicUrl()`, remove hardcoded URL constant |
| `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` | Use `StoragePaths.applicantDocument` + `uploadFile` |
| `src/app/apply/[id]/(wizard)/identity/_server/actions.ts` | Use `StoragePaths.applicantDocument` + `uploadFile` |
| `src/app/registry/students/_components/documents/AddDocumentModal.tsx` | Replace `uploadDocument` import with `uploadAndCreateDocument` server action call, remove `formatFileSize` |
| `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx` | Replace `uploadDocument`/`deleteDocument` imports with `uploadPublicationAttachment`/`deletePublicationAttachmentWithFile` server action calls |
| `src/app/registry/terms/settings/_server/actions.ts` | Add `uploadPublicationAttachment` and `deletePublicationAttachmentWithFile` server actions, remove `getAttachmentFolder`/`getAttachmentFolderPath`, use `StoragePaths` |
| `src/app/library/resources/question-papers/_server/actions.ts` | Use `StoragePaths.questionPaper` + `uploadFile`, remove `BASE_URL`/`FOLDER` |
| `src/app/library/resources/publications/_server/actions.ts` | Use `StoragePaths.publication` + `uploadFile`, remove `BASE_URL`/`FOLDER` |
| `src/app/admissions/applicants/[id]/documents/_server/actions.ts` | Add `uploadApplicantFile` server action for client components, remove `ADMISSIONS_DOCUMENTS_BASE_URL`, update `saveApplicantDocument` to accept `fileUrl` key |
| `src/app/admissions/applications/_server/actions.ts` | Uses `uploadDocument` in server action — replace with `uploadFile` + `StoragePaths.applicantDocument` (server action can import directly) |
| `src/app/admissions/applicants/[id]/documents/_components/UploadModal.tsx` | Replace `uploadDocument` import with `uploadApplicantFile` server action call |
| `src/app/admissions/applicants/[id]/academic-records/_server/actions.ts` | **MISSED** — Uses `deleteDocument(getStorageKeyFromUrl(fileUrl))`. Use `deleteFile(fileUrl)` directly (after migration, `fileUrl` IS the key) |
| `src/app/registry/students/_components/documents/DeleteDocumentModal.tsx` | **BUG FIX** — Currently calls `deleteFromStorage(document.fileName)` but `fileName` is the display name, not the storage key. Must call a server action that handles both R2 deletion + DB deletion using `document.fileUrl`. See section 6.11 below |

## 6.11 — Fix `DeleteDocumentModal` Prop Chain (BUG FIX)

The plan to use `document.fileUrl` requires updating the entire prop chain:

### 1. `DocumentsView.tsx` — update `handleDelete` and `selectedDocument` state:
```typescript
// BEFORE:
const [selectedDocument, setSelectedDocument] = useState<{
  id: string;
  fileName: string;
} | null>(null);

function handleDelete(id: string, fileName: string) {
  setSelectedDocument({ id, fileName });
  setDeleteModalOpened(true);
}

// AFTER:
const [selectedDocument, setSelectedDocument] = useState<{
  id: string;
  fileName: string;
  fileUrl: string | null;
} | null>(null);

function handleDelete(id: string, fileName: string, fileUrl: string | null) {
  setSelectedDocument({ id, fileName, fileUrl });
  setDeleteModalOpened(true);
}
```

### 2. `DocumentCard.tsx` — update `onDelete` callback signature:
```typescript
// BEFORE:
onDelete: (id: string, fileName: string) => void;

// AFTER:
onDelete: (id: string, fileName: string, fileUrl: string | null) => void;

// In the delete button handler:
onDelete(id, fileName, fileUrl);
```

### 3. `DeleteDocumentModal.tsx` — add `fileUrl` to props, use server action for deletion:
```typescript
type DeleteDocumentModalProps = {
  opened: boolean;
  onClose: () => void;
  document: {
    id: string;
    fileName: string;
    fileUrl: string | null;
  };
  onSuccess: () => void;
};

// REMOVE: import { deleteDocument as deleteFromStorage } from '@/core/integrations/storage';
// Instead use the server action:
import { deleteDocument } from '@registry/documents';

async function handleDelete() {
  // deleteDocument server action handles BOTH R2 deletion and DB deletion
  await deleteDocument(document.id);
  onSuccess();
}
```

### 4. `deleteDocument` server action update (registry documents):
The existing `deleteDocument(id)` action in `src/app/registry/documents/_server/actions.ts` should be updated to also delete the file from R2:
```typescript
export async function deleteDocument(id: string) {
  const doc = await service.get(id);
  if (doc?.fileUrl) {
    await deleteFile(doc.fileUrl);
  }
  return service.delete(id);
}
```

> **KEY CHANGE**: The old pattern had the client component calling two separate functions (deleteFromStorage + deleteDocument) — and the storage call used the wrong key! The new pattern is a single server action that handles both, using the correct `fileUrl` from the DB.

## Pre-Existing Bugs Fixed in This Step

### Bug 1: Student Photo Deletion Passes Full URL as R2 Key
**File:** `src/app/registry/students/_components/info/PhotoView.tsx` (line 27)
**Problem:** `deleteDocument(photoUrl)` passes a full URL with cache-busting query params (e.g., `https://...r2.dev/photos/901234.jpg?v=etag`). The current `deleteDocument` passes this verbatim as the R2 Key, which fails silently — the S3 API won't find a key matching the full URL.
**Fix:** The new `deleteFile()` handles both full URLs and bare keys by stripping the URL prefix. Additionally, after this step, `student.photoKey` stores the bare key and is used directly.

### Bug 2: Student Document Deletion From R2 Uses Wrong Key
**File:** `src/app/registry/students/_components/documents/DeleteDocumentModal.tsx` (line 34)
**Problem:** `deleteFromStorage(document.fileName)` passes the **original filename** (e.g., "Report.pdf") instead of the **storage key** (e.g., "documents/registry/students/901234/abc123.pdf"). The file is never actually deleted from R2.
**Fix:** After this step, `document.fileUrl` stores the R2 key. The delete call should use `deleteFile(document.fileUrl)`.

## Verification

After this step:
- All new uploads use standardized paths via `StoragePaths`
- No hardcoded R2 URLs remain in the codebase (grep for `pub-2b37ce26bd70421e` should return 0 results)
- All file sizes validated using shared constants
- `pnpm tsc --noEmit` passes cleanly
- Upload a test file in each module and verify it appears in the correct R2 path
