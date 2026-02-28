# Step 4: Extract Base64 Deposit Receipts to R2

> **Priority:** High (removes ~892 MB of base64 data from PostgreSQL)  
> **Risk:** Medium (touches 1,422 live document records; mitigated by copy-first strategy)  
> **Estimated effort:** 2–3 hours (script + dry run + execution)  
> **Prerequisite:** Steps 1, 2, 3 completed (storage utility + path builders available)

---

## Objective

Decode 1,422 base64-encoded deposit receipt images from the `documents.file_url` column, upload them to R2 under a standardized path, and update `file_url` to the new R2 key. This reclaims ~892 MB of PostgreSQL storage.

## Background

The admissions payment workflow at `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` stores deposit receipts as `data:{mediaType};base64,{content}` directly in `documents.file_url`. These records are all linked via `bank_deposits.documentId` and are **actively viewed** by admins in the payment review page (`PaymentReviewDocumentSwitcher` → `DocumentViewer`).

### Data Profile

| Metric | Value |
|--------|-------|
| Total base64 records | 1,422 |
| All linked via `bank_deposits` | Yes (100%) |
| Total DB size consumed | ~892 MB |
| Date range | 2026-02-02 to 2026-02-27 |

### MIME Type Breakdown

| MIME Type | Count | Avg Size (chars) |
|-----------|-------|-------------------|
| image/jpeg | 1,268 | ~687,376 |
| application/pdf | 120 | ~330,369 |
| image/heic | 23 | ~828,823 |
| image/png | 5 | ~404,835 |
| image/webp | 5 | ~316,005 |
| image/heif | 1 | ~1,165,555 |

## 4.1 — Target R2 Path

```
admissions/deposits/{applicationId}/{fileName}
```

Where `fileName` is the existing `documents.fileName` value (e.g., `deposit-APPLICATION FEE.jpeg`).

This keeps deposits separate from applicant documents and is keyed by `applicationId` (matching `bank_deposits.applicationId`).

Uses `StoragePaths.admissionDeposit` (already defined in [Step 1](./01-centralize-storage-utility.md)):

```typescript
StoragePaths.admissionDeposit(applicationId, fileName)
// → "admissions/deposits/{applicationId}/{fileName}"
```

## 4.2 — Script Location & Usage

```
scripts/extract-base64-deposits.ts
```

Run via:
```bash
pnpm tsx scripts/extract-base64-deposits.ts [--dry-run] [--batch-size 50]
```

## 4.3 — Script Logic

```
┌───────────────────────────────────────────────┐
│       extract-base64-deposits.ts              │
├───────────────────────────────────────────────┤
│ 1. Connect to DB (Drizzle) + R2 (S3Client)   │
│ 2. Query all documents WHERE fileUrl          │
│    LIKE 'data:%' AND type = 'proof_of_payment'│
│ 3. Join with bank_deposits to get             │
│    applicationId                              │
│ 4. For each record (batched):                 │
│    a. Parse data URI → mediaType + base64     │
│    b. Decode base64 → Buffer                  │
│    c. Determine extension from mediaType      │
│    d. Build R2 key using StoragePaths         │
│    e. PutObjectCommand to R2                  │
│    f. HeadObjectCommand to verify upload      │
│    g. UPDATE documents SET file_url = key     │
│    h. Log result                              │
│ 5. Print summary report                       │
└───────────────────────────────────────────────┘
```

### Pseudocode:

```typescript
const base64Docs = await db
  .select({
    docId: documents.id,
    fileName: documents.fileName,
    fileUrl: documents.fileUrl,
    applicationId: bankDeposits.applicationId,
  })
  .from(documents)
  .innerJoin(bankDeposits, eq(bankDeposits.documentId, documents.id))
  .where(
    and(
      like(documents.fileUrl, 'data:%'),
      eq(documents.type, 'proof_of_payment')
    )
  );

for (const batch of chunk(base64Docs, BATCH_SIZE)) {
  await Promise.all(batch.map(async (doc) => {
    const { mediaType, base64 } = parseDataUri(doc.fileUrl);
    const buffer = Buffer.from(base64, 'base64');
    const key = StoragePaths.admissionDeposit(doc.applicationId, doc.fileName);

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mediaType,
      ACL: 'public-read',
    }));

    const head = await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));

    // CRITICAL: Verify content integrity — uploaded size must match decoded size
    const expectedSize = buffer.length;
    const actualSize = head.ContentLength;

    if (head.$metadata.httpStatusCode === 200 && actualSize === expectedSize) {
      await db.update(documents)
        .set({ fileUrl: key })
        .where(eq(documents.id, doc.id));

      log({ docId: doc.id, oldSize: doc.fileUrl.length, newKey: key, uploadedBytes: actualSize, status: 'success' });
    } else if (actualSize !== expectedSize) {
      log({ docId: doc.id, status: 'failed', reason: `Size mismatch: expected ${expectedSize}, got ${actualSize}` });
    } else {
      log({ docId: doc.id, status: 'failed', reason: 'HEAD verification failed' });
    }
  }));
}
```

## 4.4 — Data URI Parser

```typescript
function parseDataUri(dataUri: string): { mediaType: string; base64: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error(`Invalid data URI: ${dataUri.substring(0, 50)}...`);
  return { mediaType: match[1], base64: match[2] };
}
```

## 4.5 — HEIC/HEIF Handling

23 records use `image/heic` and 1 uses `image/heif`. These should be uploaded as-is to R2 — the `DocumentViewer` component uses `<Image unoptimized>` which passes through the original format. The browser or Next.js Image component handles rendering.

No conversion needed at migration time.

## 4.6 — Edge Cases

| Scenario | Handling |
|----------|----------|
| Duplicate `fileName` for same `applicationId` | Append nanoid suffix: `deposit-ref-{nanoid}.ext` |
| `fileUrl` is NULL or empty | Skip, log as warning |
| `fileUrl` already an R2 key (not base64) | Skip, log as already-migrated |
| Upload fails | Log error, continue with next record; do NOT update DB |
| Multiple deposits per application | Each gets its own file under the same `applicationId/` folder |

## 4.7 — Migration Log

Write to `scripts/logs/base64-extraction-{timestamp}.json`:

```json
{
  "startedAt": "2026-XX-XXTXX:XX:XXZ",
  "completedAt": "2026-XX-XXTXX:XX:XXZ",
  "total": 1422,
  "success": 1420,
  "skipped": 0,
  "failed": 2,
  "totalBytesUploaded": 670000000,
  "dbSizeReclaimed": "~892 MB",
  "failures": [
    { "docId": "xxx", "reason": "..." }
  ]
}
```

## 4.8 — Verification Queries

After running the script:

```sql
SELECT COUNT(*) AS remaining_base64
FROM documents
WHERE file_url LIKE 'data:%'
AND type = 'proof_of_payment';
-- Expected: 0

SELECT COUNT(*) AS migrated_deposits
FROM documents d
JOIN bank_deposits bd ON bd.document_id = d.id
WHERE d.file_url LIKE 'admissions/deposits/%';
-- Expected: 1422

SELECT pg_size_pretty(pg_total_relation_size('documents')) AS table_size;
-- Will still be large until VACUUM FULL runs (dead tuples)
```

## 4.8.1 — VACUUM FULL (Mandatory)

After the extraction completes, ~892 MB of base64 data becomes dead tuples in PostgreSQL. The space is NOT automatically reclaimed.

```sql
-- Run IMMEDIATELY after extraction completes and verification passes
VACUUM FULL documents;
ANALYZE documents;
```

Then re-check:
```sql
SELECT pg_size_pretty(pg_total_relation_size('documents')) AS table_size_after_vacuum;
-- Should now be dramatically smaller (~5-10 MB vs ~900 MB)
```

> **WARNING**: `VACUUM FULL` requires an exclusive lock on the table. This is acceptable during the maintenance window but must NOT be run while the server is live.

## 4.8.2 — Orphaned Documents (153 Records)

The database contains **153 documents** with full R2 URLs that are NOT linked to any `applicant_documents` or `bank_deposits` record (likely leftovers from deleted applicants):
- 70 identity documents
- 48 certificates
- 35 academic records

These will have their `file_url` stripped of the base URL prefix by Step 3 (since they match `LIKE 'https://pub-%'`). The R2 files themselves are handled by Step 3 Phase 3 (logged as orphaned, copied to `_orphaned/` subfolder).

No special handling needed beyond what Step 3 already defines, but the extraction script should explicitly log these as skipped (they are NOT base64).

## 4.9 — UI Impact

> **NOTE**: Since all steps are deployed atomically during the maintenance window (see [00-overview.md](./00-overview.md#maintenance-window--deployment-procedure)), Steps 4 and 7 are live simultaneously. No interim workaround is needed.

The `DocumentViewer` component at `src/app/admissions/documents/_components/DocumentViewer.tsx` currently works with both base64 data URIs and regular URLs as the `src` prop. After migration:

- `fileUrl` will be an R2 key like `admissions/deposits/{appId}/deposit-ref.jpeg`
- The retrieval code (Step 7) resolves this key to a full URL via `getPublicUrl(key)`
- The `PaymentReviewDocumentSwitcher` passes `selected.document.fileUrl` directly to `<DocumentViewer src=...>` — this must go through `getPublicUrl()` after migration
- `getPublicUrl()` also handles `data:` URIs (returns as-is) for safety during any partial state

## 4.10 — Rollback Plan

If something goes wrong:
1. The R2 uploads are additive (no deletions)
2. The DB updates are the only destructive change
3. Restore from backup if needed, or re-run with `--dry-run` to verify

Recommended: Take a DB backup before running the extraction.
