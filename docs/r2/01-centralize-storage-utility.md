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

  admissionDeposit: (applicationId: string, fileName: string) =>
    `admissions/deposits/${applicationId}/${fileName}`,

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
  if (key.startsWith('data:')) return key; // Base64 data URI (transition safety)
  return `${PUBLIC_URL}/${key}`;
}
```

> **CRITICAL**: The `data:` URI check is essential during the transition period. Between Steps 3/4 and full deployment, some `documents.fileUrl` records may still contain base64 data URIs while others have been migrated to R2 keys. This ensures both formats render correctly.
```

### Upload Function (MODIFIED)

Modify `uploadDocument` to accept the **full R2 key** instead of separate `fileName` + `folder` params. The caller uses `StoragePaths` to build the key.

Accepts `File | Blob | Buffer` to support both browser uploads (File/Blob) and server-side operations like the base64 extraction script (Buffer). This is needed from Step 1 because Step 4's extraction script uploads decoded buffers.

```typescript
export async function uploadFile(
  input: File | Blob | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  const body = input instanceof Buffer ? input : Buffer.from(await input.arrayBuffer());
  const type = contentType || (input instanceof File ? input.type : 'application/octet-stream');

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: type,
      ACL: 'public-read',
    })
  );

  return key;
}
```

> **NOTE**: This function does NOT require auth. Auth is the calling action's responsibility. This is intentional — the public-facing `submitReceiptPayment` action (Step 5) needs to upload files without a session, and migration scripts (Steps 3-4) also call this without user context.
```

### Delete Function (MODIFIED)

> **NOTE**: `deleteFile` is auth-free (like `uploadFile`). Auth is the calling action's or script's responsibility. This is intentional — migration scripts (Step 3), cleanup scripts (Step 8), and the public-facing payment action need to delete files without a user session. Server actions that expose deletion to users MUST check auth before calling `deleteFile`.

```typescript
export async function deleteFile(key: string): Promise<void> {
  if (!key) throw new Error('No key provided');

  // Handle both full URLs and bare keys
  const actualKey = key.startsWith('http')
    ? new URL(key).pathname.replace(/^\//,  '')
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

The `formatFileSize()` function is duplicated in **6 files** (see [Step 6, section 6.9](./06-update-upload-code.md) for the full list). All should import from `@/shared/lib/utils/files` instead.

Similarly, `getFileExtension()` logic is inline in several files — all should use the shared utility.

## 1.5 — Add `images.remotePatterns` to `next.config.ts` (MANDATORY)

> **CRITICAL**: This is NOT optional. The `DocumentViewer` components use Next.js `<Image>` with `fill` and `unoptimized`. While `unoptimized` may bypass optimization, `remotePatterns` ensures Next.js allows the R2 domain. Without this, images from R2 URLs may be rejected.

```typescript
const nextConfig: NextConfig = {
  // ...existing config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev',
      },
    ],
  },
};
```

## Files Changed

| File | Change |
|------|--------|
| `src/core/integrations/storage.ts` | Major rewrite: add `StoragePaths`, `getPublicUrl`, `uploadFile`, `deleteFile`, `fileExists`, `generateUploadKey` |
| `next.config.ts` | Add `images.remotePatterns` for R2 domain (MANDATORY) |
| `README.md` | Add `R2_PUBLIC_URL` to env vars |
| `.env` / `.env.local` | Add `R2_PUBLIC_URL` value |

## Verification

After this step:
- All new functions are exported and available
- Old `uploadDocument`/`deleteDocument` still work (deprecated wrappers)
- No existing functionality is broken
- `pnpm tsc --noEmit` passes cleanly
