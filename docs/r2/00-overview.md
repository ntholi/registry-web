# R2 Storage Migration — Master Plan

> **Status:** Planning  
> **Created:** 2026-02-28  
> **Goal:** Standardize all R2 file storage with a unified folder hierarchy, centralized URL management, DB-tracked photo references, and zero data loss.
> **Maintenance Window:** Full server downtime during migration; no new records will be created while maintenance is active.

---

## Problem Statement

The current R2 storage implementation suffers from:

1. **Inconsistent folder paths** — 7 different naming conventions across modules
2. **Hardcoded public URL** — `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev` appears in 9+ files
3. **No database tracking for photos** — Student/employee photos are discovered via 4 sequential HEAD requests (probing .jpg, .jpeg, .png, .webp)
4. **Duplicated upload/retrieval logic** — Each module implements its own URL construction, file size validation, and extension handling
5. **Mixed storage reference patterns** — Some DB records store `fileName` only, others store full `fileUrl`, others store nothing (photos)
6. **`formatFileSize()` duplicated** — Exists in 6 places instead of using the shared utility

## Decisions Made

| Decision | Choice |
|----------|--------|
| Folder strategy | **Module-aligned hierarchy** — `{module}/{feature}/{entity-id}/{file}` |
| Base URL management | **Env var + centralized utility** — `R2_PUBLIC_URL` + `getPublicUrl(key)` |
| Photo tracking | **Store photo key in DB** — Add `photoKey` column to students & employees |
| Migration strategy | **Copy-then-update** — Copy to new paths, update DB, verify, then delete old |

## Current State Audit

### R2 Folder Patterns in Use

| # | Current R2 Key Pattern | Module | How URL Is Built |
|---|------------------------|--------|------------------|
| 1 | `photos/{stdNo}.{ext}` | Registry → Students | Hardcoded BASE_URL + probing 4 extensions |
| 2 | `photos/employees/{empNo}.{ext}` | HR → Employees | Hardcoded BASE_URL + probing 4 extensions |
| 3 | `documents/admissions/{nanoid}.{ext}` | Admissions → Applicant Docs | Hardcoded BASE_URL + folder + fileName |
| 4 | `documents/registry/students/{stdNo}/{nanoid}.{ext}` | Registry → Student Docs | `uploadDocument` returns fileName; DB stores relative name |
| 5 | `documents/{termCode}/publications/{type}/{file}` | Registry → Term Attachments | Hardcoded BASE_URL + computed folder |
| 6 | `library/question-papers/{nanoid}.{ext}` | Library → Question Papers | Hardcoded BASE_URL + FOLDER + fileName |
| 7 | `library/publications/{nanoid}.{ext}` | Library → Publications | Hardcoded BASE_URL + FOLDER + fileName |

### Files With Hardcoded R2 URL

| File | Line |
|------|------|
| `src/app/registry/students/_server/actions.ts` | 183 |
| `src/app/registry/documents/_server/actions.ts` | 28 |
| `src/app/registry/terms/settings/_server/actions.ts` | 79 |
| `src/app/human-resource/employees/_server/actions.ts` | 49 |
| `src/app/admissions/applicants/_server/service.ts` | 186 |
| `src/app/admissions/applicants/[id]/documents/_server/actions.ts` | 39 |
| `src/app/library/resources/question-papers/_server/actions.ts` | 11 |
| `src/app/library/resources/publications/_server/actions.ts` | 16 |

### Files Using Old Upload Patterns (No Hardcoded URL but Must Be Updated)

| File | Issue |
|------|-------|
| `src/app/admissions/applications/_server/actions.ts` | Uses `uploadDocument(file, fileName, 'documents/admissions')` — hardcoded folder |
| `src/app/admissions/applicants/[id]/documents/_components/UploadModal.tsx` | Uses `uploadDocument()` with old folder from `getDocumentFolder()` |
| `src/app/admissions/applicants/[id]/academic-records/_server/actions.ts` | Uses `deleteDocument(getStorageKeyFromUrl(fileUrl))` — will need `deleteFile(fileUrl)` |
| `src/app/registry/students/_components/documents/DeleteDocumentModal.tsx` | **BUG**: Passes display name as storage key |
| `src/app/apply/[id]/(wizard)/payment/_server/actions.ts` | Stores base64 directly in `documents.fileUrl` — see Step 0 |

### Database Schema for Files

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `documents` | `fileName`, `fileUrl` | Central doc table; `fileUrl` stores full URL |
| `student_documents` | `documentId`, `stdNo` | Join table → `documents` |
| `applicant_documents` | `documentId`, `applicantId` | Join table → `documents` |
| `publication_attachments` | `fileName`, `termCode`, `type` | No `fileUrl` column; URL computed at read-time |
| `question_papers` | `documentId` | References `documents.fileUrl` |
| `publications` | `documentId` | References `documents.fileUrl` |
| `students` | — | **No photo column** (photos discovered by probing R2) |
| `employees` | — | **No photo column** (photos discovered by probing R2) |

## New Folder Hierarchy

```
{bucket}/
├── registry/
│   ├── students/
│   │   ├── photos/{stdNo}.jpg
│   │   └── documents/{stdNo}/{nanoid}.{ext}
│   └── terms/
│       └── publications/{termCode}/{type}/{fileName}
├── human-resource/
│   └── employees/
│       └── photos/{empNo}.jpg
├── admissions/
│   ├── applicants/
│   │   └── documents/{applicantId}/{nanoid}.{ext}
│   └── deposits/{applicationId}/{fileName}
└── library/
    ├── question-papers/{nanoid}.{ext}
    └── publications/{nanoid}.{ext}
```

## Migration Steps (Summary)

| Step | Document | Description |
|------|----------|-------------|
| 0 | Investigation (incorporated into Step 4) | Base64 deposit receipts investigation — findings captured in Step 4 |
| 1 | [01-centralize-storage-utility.md](./01-centralize-storage-utility.md) | Create centralized storage utility with env var, path builders, and URL resolver |
| 2 | [02-schema-changes.md](./02-schema-changes.md) | Add `photoKey` to students/employees, standardize `fileUrl` storage format |
| 3 | [03-migration-script.md](./03-migration-script.md) | R2 copy script: old paths → new paths, populate `photoKey` columns |
| 4 | [04-extract-base64-deposits.md](./04-extract-base64-deposits.md) | Extract 1,422 base64 deposit receipts from DB → upload to R2 → update keys |
| 5 | [05-fix-payment-upload.md](./05-fix-payment-upload.md) | Fix payment action to upload receipts to R2 directly (prevent new base64) |
| 6 | [06-update-upload-code.md](./06-update-upload-code.md) | Update all upload callsites to use new paths and centralized utility |
| 7 | [07-update-retrieval-code.md](./07-update-retrieval-code.md) | Update all URL construction and photo retrieval to use DB + utility |
| 8 | [08-cleanup-and-verification.md](./08-cleanup-and-verification.md) | Verify all new paths, delete old objects, remove dead code |

## Pre-Migration: Base64 Data in `documents` Table

> See [04-extract-base64-deposits.md](./04-extract-base64-deposits.md)

**1,422 `documents` records** store raw base64 file content (deposit receipts) directly in `file_url` instead of R2. These are linked via `bank_deposits` and total ~892 MB of DB storage. This is resolved by **Steps 4 & 5** — Step 4 extracts existing records to R2, Step 5 fixes the source action to prevent new base64 records.

## Maintenance Window — Deployment Procedure

> **CRITICAL: Full server downtime is required. No user traffic during migration.**

The entire migration (Steps 1–7) MUST be executed as a **single atomic operation** during a scheduled maintenance window. The server is taken offline, ALL code changes and migration scripts run, and the server only comes back online once everything is verified.

### Pre-Maintenance Checklist
- [ ] Full PostgreSQL backup via `pg_dump` with `--format=custom`
- [ ] R2 bucket object listing saved to JSON (audit trail)
- [ ] All code changes (Steps 1, 2, 5, 6, 7) committed, reviewed, and ready to deploy
- [ ] Migration scripts (Steps 3, 4) tested on staging/local with `--dry-run`
- [ ] Maintenance banner / downtime notice communicated to users

### Execution Sequence (During Downtime)

```
1. Take server offline (maintenance mode)
2. pg_dump full database backup                      <- SAFETY NET
3. Deploy code changes (Steps 1+2+5+6+7)            <- New code handles BOTH old and new formats
4. Run schema migration (Step 2: pnpm db:generate)   <- Add nullable columns
5. Run R2 migration script (Step 3: --dry-run first) <- Copy files, update DB references
6. Run base64 extraction (Step 4: --dry-run first)   <- Extract deposits from DB to R2
7. VACUUM FULL documents;                            <- Reclaim ~892 MB of dead tuples
8. Verify: spot-check 10 files per category via HEAD
9. Verify: run SQL verification queries (Step 8.1)
10. Start server, smoke-test all modules
11. If ANYTHING fails → restore from pg_dump, redeploy old code, bring server back up
```

### Why Atomic Deployment Is Mandatory
- Step 3 changes `documents.fileUrl` from full URLs to bare R2 keys
- Step 4 replaces base64 data URIs with R2 keys
- If old code (without `getPublicUrl()`) runs after these DB changes, **all documents show broken images/links**
- The new code's `getPublicUrl()` handles both formats (`if (key.startsWith('http')) return key`), so deploying code first is safe but running migration scripts without code is NOT

### Rollback Plan
- **Code rollback**: Redeploy previous version (old code handles old DB format)
- **DB rollback**: Restore from `pg_dump` backup taken in step 2
- **R2 rollback**: No rollback needed — R2 changes are additive (copies, not moves). Old files remain until Step 8 cleanup
- **Partial failure**: If migration script fails mid-way, the script is idempotent and can be re-run. Mixed state (some records updated, some not) is handled by `getPublicUrl()` which accepts both formats

## Risk Mitigation

- **Zero data loss**: Copy-then-update strategy. Old files are never deleted until new paths are verified with HEAD requests.
- **Rollback**: If anything goes wrong, old paths still exist. The migration script logs all operations for audit.
- **Atomic deployment**: All code + DB + R2 changes happen in a single maintenance window — no partial states exposed to users.
- **Feature flags**: The old URL construction fallback remains until Step 8 cleanup.
- **Content integrity**: Base64 extraction (Step 4) verifies uploaded file size matches decoded size before updating DB.

## Live Database Profile (as of 2026-02-28)

| Category | Count | Notes |
|----------|-------|-------|
| Documents with full R2 URLs | 5,037 | All admissions documents (`documents/admissions/{nanoid}.{ext}`) |
| Documents with base64 data URIs | 1,422 | All bank deposit receipts (100% linked to `bank_deposits`) |
| Documents linked to applicants | 4,884 | Via `applicant_documents` join table |
| Orphaned documents (no link) | 153 | Types: identity (70), certificate (48), academic_record (35) |
| Student documents | 0 | No records yet (upload code exists but unused) |
| Library question papers | 0 | No records yet |
| Library publications | 0 | No records yet |
| Publication attachments | 0 | No records yet |
| Students (need photo scan) | 21,208 | Photos in R2 but not tracked in DB |
| Employees | 0 | No records in local DB |

## Pre-Existing Bugs (Fixed in Steps 6–7)

1. **Student photo deletion broken** — `deleteDocument(photoUrl)` passes full URL with query params as R2 Key; silently fails.
2. **Student document deletion from R2 broken** — `deleteFromStorage(document.fileName)` passes display name instead of storage key; file never deleted from R2.
3. **`DocumentCard` passes wrong field for URL resolution** — `getDocumentUrl(fileName)` receives the display name (e.g., "Report.pdf") instead of `fileUrl` (the storage reference). Currently dormant (0 student docs) but must be fixed in Step 7.
4. **`formatFileSize()` duplicated in 6 places** — Not 3 as previously estimated. Found in: `AddDocumentModal.tsx`, `ResultsPublicationAttachments.tsx`, `UploadField.tsx` (library), `DocumentUpload.tsx` (apply), `MobileDocumentUpload.tsx` (apply), LMS `submissions/utils.ts`.
