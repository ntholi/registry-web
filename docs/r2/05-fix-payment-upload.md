# Step 5: Fix Payment Action to Upload to R2

> **Priority:** High (prevents new base64 records from being created)  
> **Risk:** Low (isolated change to one server action)  
> **Estimated effort:** 1 hour  
> **Prerequisite:** Step 1 completed (storage utility with `StoragePaths` and `uploadFile`)

---

## Objective

Update `submitReceiptPayment` in `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` to decode the base64 receipt → upload to R2 → store the R2 key in `documents.fileUrl` instead of the raw base64 data URI.

## 5.1 — Current Code (Problem)

```typescript
const [doc] = await tx
  .insert(documents)
  .values({
    fileName: `deposit-${receipt.reference}.${receipt.mediaType.split('/')[1] || 'pdf'}`,
    fileUrl: `data:${receipt.mediaType};base64,${receipt.base64}`,
    type: 'proof_of_payment',
  })
  .returning({ id: documents.id });
```

This stores the entire base64 payload (~500KB–1MB per file) directly in PostgreSQL.

## 5.2 — New Code (Fix)

```typescript
import { StoragePaths, uploadFile } from '@/core/integrations/storage';

// Inside the transaction, for each receipt:
const ext = receipt.mediaType.split('/')[1] || 'pdf';
const fileName = `deposit-${receipt.reference}.${ext}`;
const buffer = Buffer.from(receipt.base64, 'base64');
const key = StoragePaths.admissionDeposit(applicationId, fileName);

await uploadFile(buffer, key, receipt.mediaType);

const [doc] = await tx
  .insert(documents)
  .values({
    fileName,
    fileUrl: key,
    type: 'proof_of_payment',
  })
  .returning({ id: documents.id });
```

## 5.3 — Storage Utility (Already Handled in Step 1)

The `uploadFile` function defined in Step 1 already accepts `File | Blob | Buffer` with an optional `contentType` parameter. No additional changes needed here.

```typescript
// Step 1 already defines:
export async function uploadFile(
  input: File | Blob | Buffer,
  key: string,
  contentType?: string
): Promise<string>
```

The function also does NOT require auth (auth is the action's responsibility), which is correct for this public-facing payment action.

## 5.4 — Authentication Note

The current `submitReceiptPayment` action does **not** use `withAuth` — it's a public-facing action for applicants (unauthenticated users). Per Step 1's design, `uploadFile` is a low-level function that does NOT check auth. Auth enforcement is the calling action's responsibility. No special handling needed here.

## 5.5 — Input Validation

The existing validation already handles:
- File size limit (2MB max, checked via base64 length)
- Receipt content validation via `validateReceipts` and `validateAnalyzedReceipt`

No additional validation needed for the R2 upload path.

## 5.6 — Error Handling

If the R2 upload fails, the entire transaction should fail and no `documents` or `bank_deposits` rows should be created. Since the upload happens **outside** the DB transaction, structure it as:

```typescript
// Upload all receipts to R2 first
const uploadedKeys: { key: string; receipt: DepositData }[] = [];
for (const receipt of receipts) {
  const ext = receipt.mediaType.split('/')[1] || 'pdf';
  const fileName = `deposit-${receipt.reference}.${ext}`;
  const buffer = Buffer.from(receipt.base64, 'base64');
  const key = StoragePaths.admissionDeposit(applicationId, fileName);
  await uploadFile(buffer, key, receipt.mediaType);
  uploadedKeys.push({ key, receipt });
}

// Then insert into DB in a transaction
await db.transaction(async (tx) => {
  for (const { key, receipt } of uploadedKeys) {
    const ext = receipt.mediaType.split('/')[1] || 'pdf';
    const [doc] = await tx
      .insert(documents)
      .values({
        fileName: `deposit-${receipt.reference}.${ext}`,
        fileUrl: key,
        type: 'proof_of_payment',
      })
      .returning({ id: documents.id });

    await tx.insert(bankDeposits).values({
      applicationId,
      documentId: doc.id,
      // ...other fields unchanged
    });
  }
});
```

If the DB transaction fails after R2 upload, orphaned R2 objects remain. To handle this, wrap the entire flow in a try/catch that cleans up uploaded files on failure:

```typescript
const uploadedKeys: { key: string; receipt: DepositData }[] = [];
try {
  // Upload all receipts to R2 first
  for (const receipt of receipts) {
    const ext = receipt.mediaType.split('/')[1] || 'pdf';
    const fileName = `deposit-${receipt.reference}.${ext}`;
    const buffer = Buffer.from(receipt.base64, 'base64');
    const key = StoragePaths.admissionDeposit(applicationId, fileName);
    await uploadFile(buffer, key, receipt.mediaType);
    uploadedKeys.push({ key, receipt });
  }

  // Then insert into DB in a transaction
  await db.transaction(async (tx) => {
    for (const { key, receipt } of uploadedKeys) {
      const ext = receipt.mediaType.split('/')[1] || 'pdf';
      const [doc] = await tx
        .insert(documents)
        .values({
          fileName: `deposit-${receipt.reference}.${ext}`,
          fileUrl: key,
          type: 'proof_of_payment',
        })
        .returning({ id: documents.id });

      await tx.insert(bankDeposits).values({
        applicationId,
        documentId: doc.id,
        // ...other fields unchanged
      });
    }
  });
} catch (error) {
  // Clean up orphaned R2 objects if DB transaction fails
  for (const { key } of uploadedKeys) {
    try {
      await deleteFile(key);
    } catch {
      // Log but don't throw — cleanup is best-effort
      console.error(`Failed to clean up orphaned R2 object: ${key}`);
    }
  }
  throw error;
}
```

> **NOTE**: `deleteFile` is now auth-free (see Step 1), so it can be called from this public-facing action without a session.

## 5.7 — Testing

1. Submit a new payment via the applicant portal
2. Verify the deposit receipt appears in R2 at `admissions/deposits/{applicationId}/deposit-{ref}.{ext}`
3. Verify `documents.file_url` stores the R2 key (not base64)
4. Verify the admin payment review page renders the receipt image correctly
5. Verify the file size in R2 matches the decoded base64 size

## 5.8 — Files Changed

| File | Change |
|------|--------|
| `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` | Decode base64 → upload to R2 → store key |
| `src/core/integrations/storage.ts` | Already updated in Step 1 (`uploadFile` accepts `Buffer`) |
