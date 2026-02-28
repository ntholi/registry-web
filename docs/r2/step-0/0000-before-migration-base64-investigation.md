# Pre-Migration: Base64 Data Investigation

> **Status:** Needs full investigation  
> **Priority:** Must resolve BEFORE running the R2 migration (Step 3)  
> **Created:** 2026-02-28

---

## Summary

There are **1,422 document records** in the `documents` table that store raw base64 file content directly in the `file_url` column instead of an R2 URL or key. These records are **not orphaned** — they are all linked to the `bank_deposits` table as payment deposit receipts.

This data was created by the admissions payment workflow at `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` (line 72), which inserts `data:{mediaType};base64,{base64Content}` directly into `documents.file_url`.

## What This Document Needs

An LLM (or manual) investigation should fill in this document with:

1. **Full data audit** — exact counts, sizes, date ranges, and linkage to `bank_deposits` and `applications`
2. **Risk assessment** — what breaks if these are deleted vs. migrated vs. left as-is
3. **Recommended action** — whether to extract to R2, leave in DB, or delete
4. **Implementation plan** — if extracting, the script to decode base64 → upload to R2 → update `file_url` to key

---

## Current Findings (Brief)

### Record Statistics

| Metric | Value |
|--------|-------|
| Total base64 records | 1,422 |
| Linked via `bank_deposits` | 1,422 (all of them) |
| Linked via `applicant_documents` | 0 |
| Linked via `student_documents` | 0 |
| Total data size in DB | ~892 MB |
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

### File Naming Pattern

All files follow: `deposit-{reference}.{ext}` (e.g., `deposit-APPLICATION FEE.jpeg`, `deposit-S648402.jpeg`, `deposit-062-967.webp`)

### Source Code

Created by: `src/app/apply/[id]/(wizard)/payment/_server/actions.ts`

```typescript
const [doc] = await tx.insert(documents).values({
  fileName: `deposit-${receipt.reference}.${receipt.mediaType.split('/')[1] || 'pdf'}`,
  fileUrl: `data:${receipt.mediaType};base64,${receipt.base64}`,
  type: 'proof_of_payment',
}).returning({ id: documents.id });

await tx.insert(bankDeposits).values({
  applicationId,
  documentId: doc.id,
  // ...other fields
});
```

### Linkage Chain

```
applications → bank_deposits.applicationId
bank_deposits.documentId → documents.id (file_url contains base64)
```

---

## Investigation Needed

> Fill in the sections below with a full analysis.

### 1. Are these deposit receipts still actively used/viewed?

_Investigate which UI components or server actions read `bank_deposits.document.fileUrl` and render the base64 content. Determine if deleting them would break active user-facing features._

### 2. Can they be safely extracted to R2?

_If yes, define the target R2 path (e.g., `admissions/deposits/{applicationId}/{nanoid}.{ext}`) and the extraction script logic: decode base64 → upload to R2 → update `file_url` to the new key._

### 3. What is the impact on database size?

_~892 MB of base64 data in a text column. Estimate the DB size reduction if extracted or deleted. Check if this causes performance issues with backups, replication, or queries._

### 4. Should the payment action be updated?

_The current code stores base64 inline. Should new deposits also be uploaded to R2 instead? If yes, this should be added to Step 4 of the R2 migration plan._

### 5. Recommended action and implementation plan

_Provide the final recommendation with step-by-step implementation._
