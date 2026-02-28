# Step 4: Update All Upload Code

> **Priority:** High  
> **Risk:** Medium (changes upload paths for new files)  
> **Estimated effort:** 2–3 hours  
> **Prerequisite:** Steps 1, 2, 3 completed

---

## Objective

Update every file upload callsite to use `StoragePaths`, `uploadFile`, and `generateUploadKey` from the centralized storage utility. No more ad-hoc folder strings.

## 4.1 — Student Photo Upload

### Files to update:
- `src/app/registry/students/_components/info/PhotoView.tsx`
- `src/app/registry/students/_components/card/PhotoSelection.tsx`

### Current code (PhotoView.tsx):
```typescript
const fileName = `${student.stdNo}.jpg`;
const photoFile = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });
await uploadDocument(photoFile, fileName, 'photos');
```

### New code:
```typescript
import { StoragePaths, uploadFile } from '@/core/integrations/storage';
import { updateStudentPhotoKey } from '../../_server/actions';

const key = StoragePaths.studentPhoto(student.stdNo);
const photoFile = new File([croppedImageBlob], `${student.stdNo}.jpg`, { type: 'image/jpeg' });
await uploadFile(photoFile, key);
await updateStudentPhotoKey(student.stdNo, key);
```

### New server action needed in `src/app/registry/students/_server/actions.ts`:
```typescript
export async function updateStudentPhotoKey(stdNo: number, photoKey: string | null) {
  return service.updatePhotoKey(stdNo, photoKey);
}
```

### Service/Repository changes:
Add `updatePhotoKey(stdNo, key)` method that does:
```sql
UPDATE students SET photo_key = $1 WHERE std_no = $2
```

### PhotoSelection.tsx:
Same pattern — replace `uploadDocument(photoFile, fileName, 'photos')` with `uploadFile(photoFile, key)` and `updateStudentPhotoKey(...)`.

Also update the camera capture handler with the same pattern.

## 4.2 — Employee Photo Upload

### Files to update:
- `src/app/human-resource/employees/_components/info/PhotoView.tsx`
- `src/app/human-resource/employees/_components/card/PhotoSelection.tsx`

### Current code:
```typescript
await uploadDocument(photoFile, fileName, 'photos/employees');
```

### New code:
```typescript
import { StoragePaths, uploadFile } from '@/core/integrations/storage';
import { updateEmployeePhotoKey } from '../../_server/actions';

const key = StoragePaths.employeePhoto(employee.empNo);
await uploadFile(photoFile, key);
await updateEmployeePhotoKey(employee.empNo, key);
```

### New server action needed in `src/app/human-resource/employees/_server/actions.ts`:
```typescript
export async function updateEmployeePhotoKey(empNo: string, photoKey: string | null) {
  return service.updatePhotoKey(empNo, photoKey);
}
```

## 4.3 — Admissions Document Upload

### Files to update:
- `src/app/admissions/applicants/_components/DocumentUpload.tsx`
- `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts`
- `src/app/apply/[id]/(wizard)/identity/_server/actions.ts`

### Current code (DocumentUpload.tsx):
```typescript
const folder = 'documents/admissions';
const fileName = `${nanoid()}.${getFileExtension(file.name)}`;
await uploadDocument(file, fileName, folder);
```

### New code:
```typescript
import { StoragePaths, uploadFile, generateUploadKey } from '@/core/integrations/storage';

const key = generateUploadKey(
  (fn) => StoragePaths.applicantDocument(applicantId, fn),
  file.name
);
await uploadFile(file, key);
```

### For `saveApplicantDocument`, update to store the key:
```typescript
const fileUrl = key; // Store key, not full URL
```

### qualifications/_server/actions.ts:
```typescript
// Replace:
const folder = 'documents/admissions';
const ext = getFileExtension(file.name);
const fileName = `${nanoid()}${ext}`;
await uploadDocument(file, fileName, folder);

// With:
const key = generateUploadKey(
  (fn) => StoragePaths.applicantDocument(applicantId, fn),
  file.name
);
await uploadFile(file, key);
```

### identity/_server/actions.ts:
Same pattern as qualifications.

## 4.4 — Student Document Upload (Registry)

### File to update:
- `src/app/registry/students/_components/documents/AddDocumentModal.tsx`

### Current code:
```typescript
const uploadPath = `documents/registry/students/${stdNo}`;
const uploadedPath = await uploadDocument(file, generatedFileName, uploadPath);
```

### New code:
```typescript
import { StoragePaths, uploadFile, generateUploadKey } from '@/core/integrations/storage';

const key = generateUploadKey(
  (fn) => StoragePaths.studentDocument(stdNo, fn),
  file.name
);
await uploadFile(file, key);

await createDocument({
  fileName: file.name,
  fileUrl: key, // Store key, not relative path
  type,
  stdNo,
});
```

## 4.5 — Term Publication Attachments

### File to update:
- `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx`

### Current code:
```typescript
const folder = await getAttachmentFolderPath(termCode, type);
await uploadDocument(file, file.name, folder);
```

### New code:
```typescript
import { StoragePaths, uploadFile } from '@/core/integrations/storage';

const key = StoragePaths.termPublication(termCode, type, file.name);
await uploadFile(file, key);

await savePublicationAttachment({
  termCode,
  fileName: file.name,
  type,
  storageKey: key, // New field
});
```

## 4.6 — Library Question Papers

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

## 4.7 — Library Publications

### File to update:
- `src/app/library/resources/publications/_server/actions.ts`

Same pattern as question papers. Remove `BASE_URL` and `FOLDER` constants.

## 4.8 — Delete Operations

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

## 4.9 — Remove Duplicated `formatFileSize`

### Files with duplicated implementation:
- `src/app/admissions/applicants/_components/DocumentUpload.tsx` (lines 54-61)
- `src/app/registry/students/_components/documents/AddDocumentModal.tsx` (lines 44-53)

### Replace with import:
```typescript
import { formatFileSize } from '@/shared/lib/utils/files';
```

Delete the local `formatFileSize` function from both files.

## 4.10 — Applicant Service (Hardcoded URL)

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
| `src/app/admissions/applicants/_components/DocumentUpload.tsx` | Use `StoragePaths`, `uploadFile`, remove `formatFileSize` |
| `src/app/admissions/applicants/_server/service.ts` | Use `getPublicUrl()` |
| `src/app/admissions/applicants/[id]/documents/_server/actions.ts` | Use `getPublicUrl()`, remove hardcoded URL constant |
| `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` | Use `StoragePaths.applicantDocument` + `uploadFile` |
| `src/app/apply/[id]/(wizard)/identity/_server/actions.ts` | Use `StoragePaths.applicantDocument` + `uploadFile` |
| `src/app/registry/students/_components/documents/AddDocumentModal.tsx` | Use `StoragePaths`, `uploadFile`, remove `formatFileSize` |
| `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx` | Use `StoragePaths.termPublication` + `uploadFile` |
| `src/app/registry/terms/settings/_server/actions.ts` | Remove `getAttachmentFolder`/`getAttachmentFolderPath`, use `StoragePaths` |
| `src/app/library/resources/question-papers/_server/actions.ts` | Use `StoragePaths.questionPaper` + `uploadFile`, remove `BASE_URL`/`FOLDER` |
| `src/app/library/resources/publications/_server/actions.ts` | Use `StoragePaths.publication` + `uploadFile`, remove `BASE_URL`/`FOLDER` |

## Verification

After this step:
- All new uploads use standardized paths via `StoragePaths`
- No hardcoded R2 URLs remain in the codebase (grep for `pub-2b37ce26bd70421e` should return 0 results)
- All file sizes validated using shared constants
- `pnpm tsc --noEmit` passes cleanly
- Upload a test file in each module and verify it appears in the correct R2 path
