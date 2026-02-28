# Step 1: Centralize Storage Utility

> **Priority:** High (prerequisite for all other steps)  
> **Risk:** Low (additive change, no breaking modifications)  
> **Estimated effort:** 1–2 hours

---

## Objective

Create a single source of truth for R2 configuration, path construction, and URL resolution. Eliminate all hardcoded URLs and duplicated helper functions.

## 1.1 — Environment Variable Setup (PREREQUISITE)

Add `NEXT_PUBLIC_R2_PUBLIC_URL` to the environment:

```env
# .env / .env.local
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev
```

Update `README.md` env section to include:

```
NEXT_PUBLIC_R2_PUBLIC_URL=
```

> **WHY `NEXT_PUBLIC_` prefix?** The `storage-utils.ts` file is imported by client components (e.g., `PaymentReviewDocumentSwitcher.tsx`). Non-prefixed env vars like `R2_PUBLIC_URL` are `undefined` on the client side in Next.js. Using `NEXT_PUBLIC_R2_PUBLIC_URL` ensures the URL is available on BOTH server and client.

## 1.2 — File Architecture (Two Files)

> **CRITICAL DECISION**: The current `storage.ts` has `'use server'`, which makes ALL exports into async server actions. Pure functions like `StoragePaths` and `getPublicUrl` need to be importable synchronously in client components (e.g., `PaymentReviewDocumentSwitcher.tsx`). Therefore, we **split into two files**:

| File | Purpose | Restrictions |
|------|---------|-------------|
| `src/core/integrations/storage.ts` | S3 operations (upload, delete, HEAD) | Server-side only — must NOT be imported from client components |
| `src/core/integrations/storage-utils.ts` | Pure functions (path builders, URL resolver, key generator) | None — importable from anywhere (client + server) |

### Why remove `'use server'` instead of keeping it?
- `'use server'` makes every export an async server action (network round-trip per call)
- `uploadFile` and `deleteFile` should NOT be callable from client components directly — they are low-level S3 operations
- Instead, each module creates server actions (e.g., `uploadStudentPhoto`) that call `uploadFile` internally
- This is cleaner: the upload + DB update happen atomically in one server action, not as two separate client calls

### Why is `storage.ts` safe without `'use server'` or `import 'server-only'`?
- Without any directive, `storage.ts` is a plain module that only runs on the server
- Client components cannot call its functions directly (they would get a runtime error for AWS SDK)
- The risk of accidental client import is mitigated by the architecture: all client-facing operations go through module-specific server actions
- Code review and TypeScript compilation will catch any accidental client imports (AWS SDK has Node.js-only APIs)

### Impact on client components that currently call `uploadDocument` directly:
The following client components currently import `uploadDocument`/`deleteDocument` from `storage.ts`:
- `PhotoView.tsx` (students) → Will call `uploadStudentPhoto(stdNo, file)` server action instead
- `PhotoSelection.tsx` (students) → Same
- `PhotoView.tsx` (employees) → Will call `uploadEmployeePhoto(empNo, file)` server action instead
- `PhotoSelection.tsx` (employees) → Same
- `AddDocumentModal.tsx` → Will call `createDocument(data)` server action with file
- `ResultsPublicationAttachments.tsx` → Will call a `uploadPublicationAttachment(...)` server action
- `DeleteDocumentModal.tsx` → Will call a server action that handles both R2 deletion + DB deletion

These changes are detailed in [Step 6](./06-update-upload-code.md).

## 1.2.1 — `src/core/integrations/storage-utils.ts` (NEW file, pure functions)

This file has **NO** `'use server'` and **NO** `import 'server-only'`. It is importable from both client and server code.

### Path Builders

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

### URL Resolver

```typescript
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

export function getPublicUrl(key: string): string {
  if (!key) return '';
  if (key.startsWith('http')) return key; // Already a full URL (backwards compat)
  if (key.startsWith('data:')) return key; // Base64 data URI (transition safety)
  return `${PUBLIC_URL}/${key}`;
}
```

> **CRITICAL**: The `data:` URI check is essential during the transition period. Between Steps 3/4 and full deployment, some `documents.fileUrl` records may still contain base64 data URIs while others have been migrated to R2 keys. This ensures both formats render correctly.

> **ENV VAR NOTE**: Since this file runs on both client and server, we use `NEXT_PUBLIC_R2_PUBLIC_URL` (with the `NEXT_PUBLIC_` prefix) so it's available on both sides. There is no separate `R2_PUBLIC_URL` — one env var serves both contexts.

### Generate Upload Key (encapsulates nanoid + extension)

```typescript
import { nanoid } from 'nanoid';

export function generateUploadKey(
  pathBuilder: (fileName: string) => string,
  originalFileName: string
): string {
  const ext = getFileExtension(originalFileName) || '.bin';
  const fileName = `${nanoid()}${ext}`;
  return pathBuilder(fileName);
}

export function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '';
}
```

## 1.2.2 — `src/core/integrations/storage.ts` (REWRITTEN, server-side only)

Replace the current file. **Remove** `'use server'`. No `import 'server-only'` needed.

### Header

```typescript
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  region: 'weur',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
```

### Upload Function

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

> **NOTE**: This function is NOT a server action. It cannot be called from client components. Auth is the calling server action's responsibility. Migration scripts (Steps 3-4) and the public-facing `submitReceiptPayment` action (Step 5) call this without user context.

### Delete Function

```typescript
export async function deleteFile(key: string): Promise<void> {
  if (!key) throw new Error('No key provided');

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

### File Existence Check (replaces HEAD-request probing)

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

## 1.3 — Deprecation Wrappers (Temporary)

Keep the old function signatures as deprecated wrappers in `storage.ts` during the transition period so existing code doesn't break before Step 6 updates it:

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

> **NOTE**: These wrappers live in `storage.ts` (server-side only). Since the current callers are client components that rely on `'use server'`, these wrappers are NOT callable from client components after this step. **This is intentional** — the deprecated wrappers are only for server-side code that still uses the old patterns. Client component callsites are updated in Step 6 to use module-specific server actions.

## 1.4 — Remove Duplicated Utilities

The `formatFileSize()` function is duplicated in **7 files** (see [Step 6, section 6.9](./06-update-upload-code.md) for the full list). All should import from `@/shared/lib/utils/files` instead.

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
| `src/core/integrations/storage.ts` | Rewrite: remove `'use server'`, add `uploadFile`, `deleteFile`, `fileExists`, keep deprecated wrappers |
| `src/core/integrations/storage-utils.ts` | **NEW**: `StoragePaths`, `getPublicUrl`, `generateUploadKey`, `getFileExtension` (pure functions, importable from client & server) |
| `next.config.ts` | Add `images.remotePatterns` for R2 domain (MANDATORY) |
| `README.md` | Add `NEXT_PUBLIC_R2_PUBLIC_URL` to env vars |
| `.env` / `.env.local` | Add `NEXT_PUBLIC_R2_PUBLIC_URL` value |
| `package.json` | No changes needed |

## Verification

After this step:
- All new functions are exported and available
- Old `uploadDocument`/`deleteDocument` still work as deprecated wrappers (server-side only)
- `getPublicUrl` and `StoragePaths` are importable in client components from `storage-utils.ts`
- Client components that previously imported from `storage.ts` will get build errors — this is intentional and fixed in Step 6
- No existing server-side functionality is broken
- `pnpm tsc --noEmit` may show errors in client components importing from `storage.ts` — these are fixed in Step 6
