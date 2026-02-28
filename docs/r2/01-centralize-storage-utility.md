# Step 1: Centralize Storage Utility

> **Priority:** High (prerequisite for all other steps)  
> **Risk:** Low (additive change, no breaking modifications)  
> **Estimated effort:** 1–2 hours

---

## Objective

Create a single source of truth for R2 configuration, path construction, and URL resolution. Eliminate all hardcoded URLs and duplicated helper functions.

## 1.1 — Add Environment Variable

Add `R2_PUBLIC_URL` to the environment:

```env
# .env / .env.local
R2_PUBLIC_URL=https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev
```

Update `README.md` env section to include:

```
R2_PUBLIC_URL=
```

## 1.2 — Redesign `src/core/integrations/storage.ts`

Replace the current file with a comprehensive storage module. The new module should contain:

### Constants & Client (existing, keep as-is)

```typescript
const s3Client = new S3Client({ ... }); // Keep current config
const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
```

### Path Builders (NEW)

A centralized object that defines all valid R2 key patterns. This ensures every module uses the same paths and prevents ad-hoc folder naming.

```typescript
export const StoragePaths = {
  studentPhoto: (stdNo: number) =>
    `registry/students/photos/${stdNo}.jpg`,

  studentDocument: (stdNo: number, fileName: string) =>
    `registry/students/documents/${stdNo}/${fileName}`,

  termPublication: (termCode: string, type: string, fileName: string) =>
    `registry/terms/publications/${termCode}/${type}/${fileName}`,

  employeePhoto: (empNo: string) =>
    `human-resource/employees/photos/${empNo}.jpg`,

  applicantDocument: (applicantId: string, fileName: string) =>
    `admissions/applicants/documents/${applicantId}/${fileName}`,

  questionPaper: (fileName: string) =>
    `library/question-papers/${fileName}`,

  publication: (fileName: string) =>
    `library/publications/${fileName}`,
} as const;
```

### URL Resolver (NEW)

```typescript
export function getPublicUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http')) return key; // Already a full URL (backwards compat)
  return `${PUBLIC_URL}/${key}`;
}
```

### Upload Function (MODIFIED)

Modify `uploadDocument` to accept the **full R2 key** instead of separate `fileName` + `folder` params. The caller uses `StoragePaths` to build the key.

```typescript
export async function uploadFile(file: File | Blob, key: string): Promise<string> {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file instanceof File ? file.type : 'application/octet-stream',
      ACL: 'public-read',
    })
  );

  return key;
}
```

### Delete Function (MODIFIED)

```typescript
export async function deleteFile(key: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return unauthorized();

  if (!key) throw new Error('No key provided');

  // Handle both full URLs and bare keys
  const actualKey = key.startsWith('http')
    ? new URL(key).pathname.replace(/^\//, '')
    : key;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: actualKey,
    })
  );
}
```

### File Existence Check (NEW — replaces HEAD-request probing)

```typescript
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
```

### Generate Upload Key (NEW — encapsulates nanoid + extension)

```typescript
export function generateUploadKey(
  pathBuilder: (fileName: string) => string,
  originalFileName: string
): string {
  const ext = getFileExtension(originalFileName) || '.bin';
  const fileName = `${nanoid()}${ext}`;
  return pathBuilder(fileName);
}
```

## 1.3 — Deprecation Wrappers (Temporary)

Keep the old function signatures as deprecated wrappers during the transition period so existing code doesn't break before it's updated:

```typescript
/** @deprecated Use uploadFile + StoragePaths instead */
export async function uploadDocument(
  file: File | Blob,
  fileName: string,
  folder: string
): Promise<string> {
  const key = `${folder}/${fileName}`;
  return uploadFile(file, key);
}

/** @deprecated Use deleteFile instead */
export async function deleteDocument(url: string | undefined | null): Promise<void> {
  if (!url) throw new Error('Invalid URL format');
  return deleteFile(url);
}
```

## 1.4 — Remove Duplicated Utilities

The `formatFileSize()` function is duplicated in:
- `src/app/admissions/applicants/_components/DocumentUpload.tsx`
- `src/app/registry/students/_components/documents/AddDocumentModal.tsx`

Both should import from `@/shared/lib/utils/files` instead.

Similarly, `getFileExtension()` logic is inline in several files — all should use the shared utility.

## Files Changed

| File | Change |
|------|--------|
| `src/core/integrations/storage.ts` | Major rewrite: add `StoragePaths`, `getPublicUrl`, `uploadFile`, `deleteFile`, `fileExists`, `generateUploadKey` |
| `README.md` | Add `R2_PUBLIC_URL` to env vars |
| `.env` / `.env.local` | Add `R2_PUBLIC_URL` value |

## Verification

After this step:
- All new functions are exported and available
- Old `uploadDocument`/`deleteDocument` still work (deprecated wrappers)
- No existing functionality is broken
- `pnpm tsc --noEmit` passes cleanly
