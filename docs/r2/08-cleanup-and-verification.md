# Step 8: Cleanup & Verification

> **Priority:** Low (run after all other steps are stable in production)  
> **Risk:** Medium (deleting old R2 objects is irreversible)  
> **Estimated effort:** 1–2 hours  
> **Prerequisite:** Steps 1–7 deployed and verified in production for at least 1 week

---

## Objective

Remove old R2 objects, deprecated code wrappers, and verify the complete migration. This is the final step — only execute when confident everything works.

## 8.1 — Verification Checklist (Pre-Cleanup)

Run this checklist **before** deleting anything:

### Database Verification

```sql
-- Students with photos should have photoKey populated
SELECT COUNT(*) AS students_missing_photo_key
FROM students
WHERE photo_key IS NULL
AND std_no IN (
  -- List of students known to have photos (from migration log)
);

-- Employees with photos should have photoKey populated
SELECT COUNT(*) AS employees_missing_photo_key
FROM employees
WHERE photo_key IS NULL
AND emp_no IN (
  -- List of employees known to have photos (from migration log)
);

-- No documents.fileUrl should contain the old base URL
SELECT COUNT(*) AS docs_with_old_url
FROM documents
WHERE file_url LIKE '%pub-2b37ce26bd70421e%';

-- All publication_attachments should have storageKey
SELECT COUNT(*) AS attachments_missing_key
FROM publication_attachments
WHERE storage_key IS NULL;
```

> **CRITICAL**: If `attachments_missing_key > 0`, do NOT proceed with cleanup. This means Step 3 Phase 5 didn't populate all `storageKey` values. The fallback `StoragePaths.termPublication(...)` in deletion code (Step 7.8) depends on this column. Run the migration script again for the term publications phase before continuing.

**Expected:** All counts return 0.

### R2 Verification

Create a verification script at `scripts/verify-r2-migration.ts`:

```bash
pnpm tsx scripts/verify-r2-migration.ts
```

This script:
1. Queries all `students.photo_key` values → HEAD each in R2
2. Queries all `employees.photo_key` values → HEAD each in R2
3. Queries all `documents.file_url` values → HEAD each in R2
4. Queries all `publication_attachments.storage_key` values → HEAD each in R2
5. Reports: `{ total, found, missing, errors }`

**Expected:** 0 missing, 0 errors.

### Application Smoke Test

- [ ] Open 5 different student profiles — photos load
- [ ] Open 3 different employee profiles — photos load
- [ ] Open a student's documents tab — files download correctly
- [ ] Open admissions → applicants → any applicant's documents — files display
- [ ] Open library → question papers — files open
- [ ] Open library → publications — files open
- [ ] Open term settings → publication attachments — files open
- [ ] Upload a new student photo — saves to new path
- [ ] Upload a new document — saves to new path
- [ ] Delete a document — R2 object is removed

## 8.2 — Codebase Grep Verification

```bash
# No hardcoded R2 URLs in source code
grep -r "pub-2b37ce26bd70421e" src/
# Expected: 0 results

# No references to old folder patterns in source code
grep -r "'photos'" src/ --include="*.ts" --include="*.tsx"
grep -r "'photos/employees'" src/ --include="*.ts" --include="*.tsx"
grep -r "'documents/admissions'" src/ --include="*.ts" --include="*.tsx"
grep -r "'documents/registry'" src/ --include="*.ts" --include="*.tsx"
# Expected: 0 results (all replaced by StoragePaths)

# No deprecated function usage
grep -r "uploadDocument" src/ --include="*.ts" --include="*.tsx"
grep -r "deleteDocument" src/core --include="*.ts"
# Expected: 0 results (only deprecated wrappers remain in storage.ts)

# No duplicate formatFileSize
grep -rn "function formatFileSize" src/ --include="*.ts" --include="*.tsx"
# Expected: Only 1 result in src/shared/lib/utils/files.ts
```

## 8.3 — Remove Deprecated Wrappers

### File: `src/core/integrations/storage.ts`

Remove the deprecated functions:
- `uploadDocument()` — replaced by `uploadFile()`
- `deleteDocument()` — replaced by `deleteFile()`
- `getStorageKeyFromUrl()` — no longer needed (keys stored in DB)
- `_formatUrl()` — unused private function

## 8.4 — Remove Dead Code

### File: `src/app/registry/terms/settings/_server/actions.ts`
- Remove `getAttachmentFolder()` function
- Remove `getAttachmentFolderPath()` export
- Remove `BASE_URL` constant

### File: `src/app/admissions/applicants/[id]/documents/_server/actions.ts`
- Remove `ADMISSIONS_DOCUMENTS_BASE_URL` constant
- Remove `getDocumentFolder()` function

### File: `src/app/library/resources/question-papers/_server/actions.ts`
- Remove `BASE_URL` constant
- Remove `FOLDER` constant

### File: `src/app/library/resources/publications/_server/actions.ts`
- Remove `BASE_URL` constant
- Remove `FOLDER` constant

## 8.5 — Delete Old R2 Objects

Create a cleanup script at `scripts/cleanup-old-r2-objects.ts`:

```bash
pnpm tsx scripts/cleanup-old-r2-objects.ts [--dry-run]
```

### Logic:
1. Load the migration log from Step 3 (`scripts/migration-logs/r2-migration-*.json`)
2. For each successfully copied entry:
   - `HeadObjectCommand` on the old key — confirm it still exists
   - `DeleteObjectCommand` on the old key
   - Log the deletion
3. Report: `{ total, deleted, alreadyGone, errors }`

### Safety:
- **Dry run first** — always run with `--dry-run` before actual deletion
- **Only delete objects listed in the migration log** — never blindly delete entire prefixes
- **Batch deletes** — use `DeleteObjectsCommand` (up to 1000 objects per request) for efficiency
- **Do NOT delete orphaned files** — those were moved to `*/orphaned/` subfolder; review them manually

### Wait period:
Run this script **at least 1 week** after Steps 4-5 are deployed to production. This gives time to:
- Detect any missed references
- Receive user reports of broken images/links
- Roll back if needed (old files still exist)

## 8.6 — Final R2 Bucket Audit

After cleanup, list all remaining objects and verify the folder structure matches the expected hierarchy:

```bash
pnpm tsx scripts/audit-r2-bucket.ts
```

This script:
1. `ListObjectsV2Command` with no prefix (list everything)
2. Groups objects by top-level folder
3. Reports unexpected objects (not under registry/, human-resource/, admissions/, library/)
4. Saves full object listing to `scripts/migration-logs/r2-audit-{timestamp}.json`

### Expected output:
```
registry/students/photos/       1,200 objects
registry/students/documents/      450 objects
registry/terms/publications/       35 objects
human-resource/employees/photos/  120 objects
admissions/applicants/documents/  800 objects
library/question-papers/          150 objects
library/publications/              75 objects
---
Total: 2,830 objects
Unexpected: 0 objects
```

## 8.7 — Documentation Update

Update the following files to reflect the new storage architecture:
- `README.md` — Add R2 section describing the folder hierarchy and env vars
- `.github/copilot-instructions.md` — Add storage guidelines for future development

### Addition to copilot-instructions.md:

```markdown
### R2 Storage
- **Path Builders**: Always use `StoragePaths` from `@/core/integrations/storage` for R2 keys
- **URL Resolution**: Always use `getPublicUrl(key)` — never hardcode the R2 domain
- **Upload**: Use `uploadFile(file, key)` — never construct keys manually
- **DB Storage**: Store R2 keys (not full URLs) in `fileUrl` / `storageKey` / `photoKey` columns
- **New Modules**: Add a new path builder to `StoragePaths` when adding file storage to a new feature
```

## Summary

| Action | Files |
|--------|-------|
| Remove deprecated wrappers | `src/core/integrations/storage.ts` |
| Remove dead constants/functions | 4 actions files |
| Delete old R2 objects | Via cleanup script |
| Audit R2 bucket | Via audit script |
| Update documentation | `README.md`, copilot-instructions |

## Post-Migration Metrics

Track these metrics after the full migration:

| Metric | Before | After |
|--------|--------|-------|
| R2 HEAD requests per student photo load | 1–4 | 0 |
| R2 HEAD requests per employee photo load | 1–4 | 0 |
| Hardcoded R2 URLs in codebase | 9 files | 0 files |
| Different folder naming patterns | 7 | 1 (standardized) |
| `formatFileSize` implementations | 6 | 1 |
| DB queries per photo load | 0 | 1 (indexed, <1ms) |
| Time to resolve student photo URL | ~200-800ms (network) | ~1ms (DB) |
