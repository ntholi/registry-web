# Step 7: Update All Retrieval Code

> **Priority:** High  
> **Risk:** Medium (changes how URLs are resolved — user-visible)  
> **Estimated effort:** 2 hours  
> **Prerequisite:** Steps 1–6 completed

---

## Objective

Replace all hardcoded URL construction and HEAD-request probing with database lookups and the centralized `getPublicUrl()` utility.

## 7.1 — Replace `getStudentPhoto()` (Eliminate 4 HEAD Requests)

### File: `src/app/registry/students/_server/actions.ts`

### Current code (lines 174–207):
```typescript
export async function getStudentPhoto(studentNumber: number | undefined | null): Promise<string | null> {
  if (!studentNumber) return null;
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  for (const ext of extensions) {
    const fileName = `${studentNumber}.${ext}`;
    const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/photos/${fileName}`;
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (response.ok) {
      return `${url}?v=${etag}`;
    }
  }
  return null;
}
```

### New code:
```typescript
export async function getStudentPhoto(
  studentNumber: number | undefined | null
): Promise<string | null> {
  if (!studentNumber) return null;
  const student = await service.getPhotoKey(studentNumber);
  if (!student?.photoKey) return null;
  return getPublicUrl(student.photoKey);
}
```

### New repository method:
```typescript
async getPhotoKey(stdNo: number) {
  return db.query.students.findFirst({
    where: eq(students.stdNo, stdNo),
    columns: { photoKey: true },
  });
}
```

### Performance improvement:
- **Before:** 1–4 HTTP HEAD requests to R2 per call (sequential, no-cache)
- **After:** 1 DB query (indexed primary key lookup, <1ms)
- **Cache busting:** If needed, append `?v={timestamp}` at the component level when the photo is updated, not on every read

## 7.2 — Replace `getEmployeePhoto()` (Eliminate 4 HEAD Requests)

### File: `src/app/human-resource/employees/_server/actions.ts`

### Same pattern as 5.1:
```typescript
export async function getEmployeePhoto(
  empNo: string | undefined | null
): Promise<string | null> {
  if (!empNo) return null;
  const employee = await service.getPhotoKey(empNo);
  if (!employee?.photoKey) return null;
  return getPublicUrl(employee.photoKey);
}
```

## 7.3 — Replace `getDocumentUrl()` (Registry Documents)

### File: `src/app/registry/documents/_server/actions.ts`

### Current code:
```typescript
export async function getDocumentUrl(fileName: string | undefined | null): Promise<string | null> {
  if (!fileName) return null;
  const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/documents/${fileName}`;
  const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  if (response.ok) {
    return `${url}?v=${etag}`;
  }
  return null;
}
```

### New code:
```typescript
export async function getDocumentUrl(
  fileUrl: string | undefined | null
): Promise<string | null> {
  if (!fileUrl) return null;
  return getPublicUrl(fileUrl);
}
```

> **CRITICAL SIGNATURE CHANGE**: The parameter changes from `fileName` (display name) to `fileUrl` (R2 key). See section 7.3.1 below for caller updates.

Since the `documents.fileUrl` column now stores the R2 key (after Step 3 migration), we just pass it through `getPublicUrl()`. No HEAD request needed — if the document exists in the DB, it exists in R2.

### 7.3.1 — Fix `DocumentCard` Caller (PRE-EXISTING BUG)

### File: `src/app/registry/students/_components/documents/DocumentsView.tsx`

The `DocumentCard` component currently receives `doc.document.fileName` (display name), but the URL resolution needs `doc.document.fileUrl` (R2 key). This is a **pre-existing bug** — the current `getDocumentUrl(fileName)` constructs `https://...r2.dev/documents/{displayName}` which points to a non-existent R2 object.

### Current code (`DocumentsView.tsx`):
```tsx
<DocumentCard
  key={doc.id}
  id={doc.id}
  fileName={doc.document.fileName}
  type={doc.document.type}
  createdAt={doc.document.createdAt}
  canEdit={canEdit}
  onDelete={handleDelete}
/>
```

### New code:
```tsx
<DocumentCard
  key={doc.id}
  id={doc.id}
  fileName={doc.document.fileName}
  fileUrl={doc.document.fileUrl}
  type={doc.document.type}
  createdAt={doc.document.createdAt}
  canEdit={canEdit}
  onDelete={handleDelete}
/>
```

### File: `src/app/registry/students/_components/documents/DocumentCard.tsx`

### Current props:
```typescript
type DocumentCardProps = {
  id: string;
  fileName: string;
  type: string | null;
  createdAt: Date | null;
  canEdit: boolean;
  onDelete: (id: string, fileName: string) => void;
};
```

### New props:
```typescript
type DocumentCardProps = {
  id: string;
  fileName: string;
  fileUrl: string | null;
  type: string | null;
  createdAt: Date | null;
  canEdit: boolean;
  onDelete: (id: string, fileName: string) => void;
};
```

### Update query inside `DocumentCard`:
```typescript
// BEFORE (broken — passes display name):
queryFn: () => getDocumentUrl(fileName),

// AFTER (correct — passes R2 key, resolves locally):
// No more server call needed! Use getPublicUrl from storage-utils:
import { getPublicUrl } from '@/core/integrations/storage-utils';

const documentUrl = fileUrl ? getPublicUrl(fileUrl) : null;
```

> **PERFORMANCE WIN**: The old `getDocumentUrl(fileName)` made a HEAD request to R2 every time. The new approach is a pure function call — zero network requests, instant resolution.

## 7.4 — Replace Publication Attachment URL Construction

### File: `src/app/registry/terms/settings/_server/actions.ts`

### Current code:
```typescript
const BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';

export async function getPublicationAttachments(termCode: string) {
  const attachments = await service.getPublicationAttachments(termCode);
  return attachments.map((att) => {
    const folder = getAttachmentFolder(termCode, att.type);
    return { ...att, url: `${BASE_URL}/${folder}/${att.fileName}` };
  });
}
```

### New code:
```typescript
export async function getPublicationAttachments(termCode: string) {
  const attachments = await service.getPublicationAttachments(termCode);
  return attachments.map((att) => ({
    ...att,
    url: getPublicUrl(att.storageKey ?? StoragePaths.termPublication(termCode, att.type, att.fileName)),
  }));
}
```

Remove the `BASE_URL` constant and `getAttachmentFolder` function entirely.

## 7.5 — Replace Question Paper URL Construction

### File: `src/app/library/resources/question-papers/_server/actions.ts`

After Step 3, `documents.fileUrl` stores the key. Any place that reads document URLs should use `getPublicUrl()`:

```typescript
// In any query result mapping:
const publicUrl = getPublicUrl(questionPaper.document.fileUrl);
```

Remove the `BASE_URL` constant.

## 7.6 — Replace Publication URL Construction

### File: `src/app/library/resources/publications/_server/actions.ts`

Same pattern as question papers. Remove `BASE_URL`.

## 7.7 — Replace Admissions Document URL Construction

### File: `src/app/admissions/applicants/[id]/documents/_server/actions.ts`

### Current code:
```typescript
const ADMISSIONS_DOCUMENTS_BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';

export async function saveApplicantDocument(data: { ... }) {
  const folder = await getDocumentFolder(data.applicantId);
  const fileUrl = `${ADMISSIONS_DOCUMENTS_BASE_URL}/${folder}/${data.fileName}`;
  // ...
}
```

### New code:
After Step 3, `fileUrl` already contains the R2 key. The `getDocumentFolder()` function is no longer needed. Remove the `ADMISSIONS_DOCUMENTS_BASE_URL` constant.

For reading documents, use `getPublicUrl()`:
```typescript
const publicUrl = getPublicUrl(document.fileUrl);
```

### File: `src/app/admissions/applicants/_server/service.ts`

### Current code (line 186):
```typescript
fileUrl: `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/documents/admissions/${doc.fileName}`,
```

### New code:
```typescript
fileUrl: getPublicUrl(doc.document?.fileUrl ?? ''),
```

## 7.7.1 — Fix `PaymentReviewDocumentSwitcher` URL Resolution

### File: `src/app/admissions/payments/_components/PaymentReviewDocumentSwitcher.tsx`

### Current code:
```tsx
{selected.document?.fileUrl ? (
  <DocumentViewer
    src={selected.document.fileUrl}
    alt={selected.document.fileName || 'Payment proof'}
  />
```

After migration, `fileUrl` is an R2 key (e.g., `admissions/deposits/{appId}/deposit.jpeg`), not a renderable URL. Must resolve via `getPublicUrl()`:

### New code:
```tsx
import { getPublicUrl } from '@/core/integrations/storage-utils';

{selected.document?.fileUrl ? (
  <DocumentViewer
    src={getPublicUrl(selected.document.fileUrl)}
    alt={selected.document.fileName || 'Payment proof'}
  />
```

> **NOTE**: Import from `storage-utils` (NOT `storage`). The `storage.ts` file is server-side only and should not be imported from client components. `getPublicUrl` is a pure function in `storage-utils.ts`.

## 7.7.2 — Fix `DocumentViewer` PDF Rendering (CRITICAL)

### File: `src/app/admissions/documents/_components/DocumentViewer.tsx`

### Problem:
The admissions `DocumentViewer` uses Next.js `<Image>` for ALL content. After migration, 120 deposit receipts are PDFs (`application/pdf`). `<Image>` cannot render PDFs — they'll show as broken images. This is likely already broken for base64 PDF data URIs.

### Fix:
Add PDF detection and render PDFs in an `<iframe>` instead of `<Image>`:

```tsx
const isPdf = src.toLowerCase().endsWith('.pdf') ||
  src.startsWith('data:application/pdf');

// In the render:
{isPdf ? (
  <iframe
    src={src}
    style={{ width: '100%', height: '100%', minHeight: 500, border: 'none' }}
    title={alt}
  />
) : (
  <Image src={src} alt={alt} fill unoptimized ... />
)}
```

> **NOTE**: The library `DocumentViewer` at `src/app/library/resources/_components/DocumentViewer.tsx` already handles PDFs correctly with a similar pattern. The admissions one must be brought to parity.

## 7.7.3 — Update Library `DocumentViewer` URL Resolution

### File: `src/app/library/resources/_components/DocumentViewer.tsx`

This component receives `fileUrl` directly. After Step 3 strips the base URL from `documents.fileUrl` for library resources, the `fileUrl` prop will be a bare R2 key (e.g., `library/question-papers/abc123.pdf`).

The callers (question paper page, publication page) must wrap the value with `getPublicUrl()` before passing it to this component:

```tsx
<DocumentViewer
  fileUrl={getPublicUrl(questionPaper.document.fileUrl)}
  fileName={questionPaper.document.fileName}
/>
```

> **IMPORT NOTE**: In server components, import `getPublicUrl` from `@/core/integrations/storage-utils`. In client components, import from the same path. The file has no `'use server'` or server-only restrictions.

## 7.8 — Update Deletion on Attachment Removal

### File: `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx` (**client component**)

> **CRITICAL**: This is a `'use client'` component. It CANNOT import `deleteFile` from `storage.ts`. Use the `deletePublicationAttachmentWithFile` server action defined in Step 6.5 instead.

### Current delete pattern:
```typescript
const folder = getAttachmentFolderPath(termCode, attachment.type);
await deleteDocument(`${folder}/${attachment.fileName}`);
```

### New pattern:
```typescript
import { deletePublicationAttachmentWithFile } from '../../_server/actions';

await deletePublicationAttachmentWithFile(attachment.id);
```

## 7.9 — Cache Busting Strategy

The current implementations use ETags/Last-Modified headers from HEAD requests for cache busting. Since we're eliminating HEAD requests, adopt this strategy:

### For photos (change frequently):
- The TanStack Query already has `staleTime: 1000 * 60 * 3` (3 minutes)
- When a photo is updated, `queryClient.invalidateQueries({ queryKey: ['student-photo', stdNo] })` forces a refetch
- The URL itself changes only when `photoKey` changes after re-upload
- For aggressive cache busting, append `?t=${Date.now()}` only in the component that just uploaded

### For documents (rarely change):
- Documents are immutable — once uploaded, the content doesn't change (new version = new file)
- No cache busting needed; the URL is stable

## 7.10 — Next.js Image Configuration (MOVED TO STEP 1)

> **This section has been moved to [Step 1, section 1.5](./01-centralize-storage-utility.md#15--add-imagesremotepatterns-to-nextconfigts-mandatory).** Adding `images.remotePatterns` to `next.config.ts` is MANDATORY and is now part of the foundational setup step.

## Summary of All Files Changed

| File | Change |
|------|--------|
| `src/app/registry/students/_server/actions.ts` | `getStudentPhoto` → DB lookup |
| `src/app/registry/students/_server/service.ts` | Add `getPhotoKey()` |
| `src/app/registry/students/_server/repository.ts` | Add `getPhotoKey()` |
| `src/app/registry/students/_components/documents/DocumentCard.tsx` | Add `fileUrl` prop, use it for URL resolution instead of `fileName` |
| `src/app/registry/students/_components/documents/DocumentsView.tsx` | Pass `fileUrl` to `DocumentCard` |
| `src/app/human-resource/employees/_server/actions.ts` | `getEmployeePhoto` → DB lookup |
| `src/app/human-resource/employees/_server/service.ts` | Add `getPhotoKey()` |
| `src/app/human-resource/employees/_server/repository.ts` | Add `getPhotoKey()` |
| `src/app/registry/documents/_server/actions.ts` | `getDocumentUrl` → `getPublicUrl()`, parameter changes from `fileName` to `fileUrl` |
| `src/app/registry/terms/settings/_server/actions.ts` | Remove `BASE_URL`, `getAttachmentFolder`, use `getPublicUrl` |
| `src/app/registry/terms/settings/_components/ResultsPublicationAttachments.tsx` | Use `deleteFile` + `storageKey` |
| `src/app/library/resources/question-papers/_server/actions.ts` | Remove `BASE_URL`, use `getPublicUrl` |
| `src/app/library/resources/publications/_server/actions.ts` | Remove `BASE_URL`, use `getPublicUrl` |
| `src/app/admissions/applicants/_server/service.ts` | Use `getPublicUrl` |
| `src/app/admissions/applicants/[id]/documents/_server/actions.ts` | Remove `ADMISSIONS_DOCUMENTS_BASE_URL`, use `getPublicUrl` |
| `src/app/admissions/payments/_components/PaymentReviewDocumentSwitcher.tsx` | Wrap `fileUrl` with `getPublicUrl()` before passing to `DocumentViewer` |
| `src/app/admissions/documents/_components/DocumentViewer.tsx` | **CRITICAL**: Add PDF detection and render PDFs via `<iframe>` instead of `<Image>` (120 PDF deposit receipts) |
| `src/app/library/resources/question-papers/[id]/page.tsx` | Wrap `fileUrl` with `getPublicUrl()` before passing to library `DocumentViewer` |
| `src/app/library/resources/publications/[id]/page.tsx` | Wrap `fileUrl` with `getPublicUrl()` before passing to library `DocumentViewer` |
| `src/app/student-portal/profile/_components/ProfileHeader.tsx` | No code change needed (calls `getStudentPhoto` which is updated above) |
| `src/app/student-portal/home/_components/Hero.tsx` | No code change needed (calls `getStudentPhoto` which is updated above) |
| `next.config.ts` | Add `images.remotePatterns` (optional) |

## Verification

After this step:
- `grep -r "pub-2b37ce26bd70421e" src/` returns **0 results**
- `grep -r "r2\.dev" src/` returns **0 results** (only in env vars)
- All `getPublicUrl` imports in client components point to `@/core/integrations/storage-utils`
- All `uploadFile`/`deleteFile` imports are only in server-side files (actions, services, repositories)
- Student photos load from DB `photoKey` — no HEAD requests in server logs
- Employee photos load from DB `photoKey` — no HEAD requests in server logs
- All document URLs resolve correctly via `getPublicUrl()`
- `pnpm tsc --noEmit` passes cleanly
- Manual test: open a student, employee, document, question paper, and publication — all images/files load correctly
