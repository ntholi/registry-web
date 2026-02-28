# Step 3: R2 Migration Script

> **Priority:** Critical (data migration, must be zero-loss)  
> **Risk:** Medium (touches live data; mitigated by copy-first strategy)  
> **Estimated effort:** 3–4 hours (scripting + dry run + execution)

---

## Objective

Copy all existing R2 objects from old paths to new standardized paths, update database references, and backfill the new `photoKey` / `storageKey` columns. No data is deleted in this step.

## 3.1 — Migration Script Location

Create the script at:
```
scripts/migrate-r2-storage.ts
```

This is a standalone Node.js script run via `tsx` — NOT a Drizzle migration, NOT a server action.

```bash
pnpm tsx scripts/migrate-r2-storage.ts [--dry-run] [--phase photos|documents|all]
```

## 3.2 — Script Architecture

```
┌──────────────────────────────────────────┐
│           migrate-r2-storage.ts          │
├──────────────────────────────────────────┤
│ 1. Connect to R2 (S3Client)             │
│ 2. Connect to DB (Drizzle)              │
│ 3. For each migration phase:            │
│    a. List objects at old prefix         │
│    b. CopyObject to new key             │
│    c. HEAD new key to verify            │
│    d. Update DB record                  │
│    e. Log result to migration-log.json  │
│ 4. Print summary report                 │
└──────────────────────────────────────────┘
```

## 3.3 — Phase 1: Student Photos

**Old pattern:** `photos/{stdNo}.{ext}`  
**New pattern:** `registry/students/photos/{stdNo}.jpg`

### Logic:
1. `ListObjectsV2Command` with prefix `photos/` (exclude `photos/employees/`)
2. For each object:
   - Extract `stdNo` from the key (e.g., `photos/901234.jpg` → `901234`)
   - Validate that `stdNo` exists in the `students` table
   - `CopyObjectCommand` from `photos/{stdNo}.{ext}` → `registry/students/photos/{stdNo}.jpg`
   - `HeadObjectCommand` on the new key to verify copy succeeded
   - `UPDATE students SET photo_key = 'registry/students/photos/{stdNo}.jpg' WHERE std_no = {stdNo}`
   - Log: `{ oldKey, newKey, stdNo, status: 'copied' | 'failed', timestamp }`

### Edge cases:
- **Multiple extensions for same student** (e.g., `901234.jpg` AND `901234.png`): Use the newest one by `LastModified`; log the duplicate
- **Orphaned photos** (no matching student): Log but don't delete; copy to `registry/students/photos/orphaned/{original-name}`
- **Already in new location**: Skip copy, just update DB

## 3.4 — Phase 2: Employee Photos

**Old pattern:** `photos/employees/{empNo}.{ext}`  
**New pattern:** `human-resource/employees/photos/{empNo}.jpg`

### Logic:
Same as Phase 1 but:
1. `ListObjectsV2Command` with prefix `photos/employees/`
2. Validate against `employees` table
3. `UPDATE employees SET photo_key = '...' WHERE emp_no = {empNo}`

## 3.5 — Phase 3: Admissions Documents

**Old pattern:** `documents/admissions/{nanoid}.{ext}`  
**New pattern:** `admissions/applicants/documents/{applicantId}/{nanoid}.{ext}`

### Logic:
1. Query all `documents` rows where `fileUrl LIKE '%documents/admissions%'`
2. Join with `applicant_documents` to get `applicantId`
3. For each:
   - Extract `fileName` from old URL
   - New key: `admissions/applicants/documents/{applicantId}/{fileName}`
   - `CopyObjectCommand` old → new
   - `HeadObjectCommand` to verify
   - `UPDATE documents SET file_url = '{newKey}' WHERE id = '{docId}'`

### Edge case:
- **Documents not linked to any applicant** (153 orphaned records): These have no `applicantId` from the join. Log as orphaned; copy to `admissions/applicants/documents/_orphaned/{docId}/{fileName}` using the document's own `id` as the folder key. Update `documents.fileUrl` to the orphaned key so `getPublicUrl()` can still resolve them.
- **`documents.fileUrl` is NULL**: Skip the record entirely, log as warning (do NOT attempt REPLACE on NULL values). Add `WHERE file_url IS NOT NULL` to all UPDATE queries in the migration script.

## 3.6 — Phase 4: Student Documents (Registry)

**Old pattern:** `documents/registry/students/{stdNo}/{nanoid}.{ext}`  
**New pattern:** `registry/students/documents/{stdNo}/{nanoid}.{ext}`

### Logic:
1. Query `documents` joined with `student_documents` where `fileUrl` contains `documents/registry/students`
2. **IMPORTANT**: Filter `WHERE file_url IS NOT NULL` in all queries — the `fileUrl` column is nullable
3. For each:
   - Build new key: `registry/students/documents/{stdNo}/{fileName}`
   - Copy, verify, update `documents.fileUrl`

### Special note:
Some student documents store only `fileName` in `documents.fileUrl` (not a full URL). The script must handle both patterns:
- If `fileUrl` starts with `http` → extract the key from the URL path
- If `fileUrl` is just a filename → the old key is `documents/registry/students/{stdNo}/{fileUrl}`

## 3.7 — Phase 5: Term Publication Attachments

**Old pattern:** `documents/{termCode}/publications/{type}/{fileName}`  
**New pattern:** `registry/terms/publications/{termCode}/{type}/{fileName}`

### Logic:
1. Query all `publication_attachments` rows
2. For each:
   - Old key from `getAttachmentFolder(termCode, type)` + `/` + `fileName`
   - New key: `registry/terms/publications/{termCode}/{type}/{fileName}`
   - Copy, verify
   - `UPDATE publication_attachments SET storage_key = '{newKey}' WHERE id = '{id}'`

## 3.8 — Phase 6: Library Resources

**Old pattern:** `library/question-papers/{nanoid}.{ext}` and `library/publications/{nanoid}.{ext}`  
**New pattern:** Same paths (already well-structured)

### Logic:
These paths are already clean — **no file moving needed**. Only need to:
1. Strip the base URL from `documents.fileUrl` for all library documents
2. `UPDATE documents SET file_url = REPLACE(file_url, '{BASE_URL}/', '') WHERE file_url LIKE '{BASE_URL}/library/%' AND file_url IS NOT NULL`

> **NULL GUARD**: All bulk UPDATE statements MUST include `AND file_url IS NOT NULL` to prevent operating on NULL values. The `documents.fileUrl` column is nullable.

## 3.9 — Migration Log Format

The script writes a detailed JSON log for auditability:

```json
{
  "startedAt": "2026-02-28T10:00:00Z",
  "completedAt": "2026-02-28T10:15:00Z",
  "phases": {
    "studentPhotos": {
      "total": 1500,
      "copied": 1498,
      "skipped": 0,
      "failed": 2,
      "orphaned": 3,
      "duplicates": 1
    },
    "employeePhotos": { ... },
    "admissionsDocuments": { ... },
    "studentDocuments": { ... },
    "termPublications": { ... },
    "libraryResources": { ... }
  },
  "failures": [
    { "oldKey": "...", "newKey": "...", "error": "...", "timestamp": "..." }
  ],
  "orphaned": [
    { "key": "...", "movedTo": "...", "reason": "no matching DB record" }
  ]
}
```

Output file: `scripts/migration-logs/r2-migration-{timestamp}.json`

## 3.10 — Dry Run Mode

When `--dry-run` is passed:
- All logic executes EXCEPT the actual `CopyObject`, `HeadObject`, and DB `UPDATE` commands
- Logs show what WOULD happen
- Use this to validate the plan before running for real

```bash
# Dry run (safe, read-only)
pnpm tsx scripts/migrate-r2-storage.ts --dry-run

# Run specific phase only
pnpm tsx scripts/migrate-r2-storage.ts --phase photos --dry-run

# Full migration
pnpm tsx scripts/migrate-r2-storage.ts --phase all
```

## 3.11 — Concurrency & Rate Limiting

- Process files in batches of **10 concurrent copies** using `Promise.allSettled`
- Add a 100ms delay between batches to avoid R2 rate limits
- The S3 `CopyObject` API is server-side (no data transfer through our server), so bandwidth is not a concern

## 3.12 — Idempotency

The script must be safely re-runnable:
- Before copying, check if the new key already exists via `HeadObjectCommand`
- If it exists AND has the same `ContentLength`, skip the copy
- DB updates use `SET ... WHERE` (idempotent)
- Log skip events for transparency

## Pre-Execution Checklist

- [ ] Database backup taken (`pg_dump`)
- [ ] R2 bucket snapshot/backup (list all objects and save to JSON)
- [ ] Dry run completed with 0 failures
- [ ] Reviewed dry-run log for unexpected orphans or duplicates
- [ ] Tested on a staging bucket with a subset of data
- [ ] Production deployment window communicated (if needed)

## Post-Execution Checklist

- [ ] Migration log reviewed — all phases report 0 failures
- [ ] Spot-check 10 random files per phase in the new paths (HEAD request)
- [ ] Verify `students.photo_key` is populated for students who had photos
- [ ] Verify `employees.photo_key` is populated for employees who had photos
- [ ] Verify `documents.file_url` values no longer contain the full base URL
- [ ] Verify `publication_attachments.storage_key` is populated
- [ ] **Do NOT delete old files yet** — that happens in Step 6

## Files Created

| File | Purpose |
|------|---------|
| `scripts/migrate-r2-storage.ts` | Main migration script |
| `scripts/migration-logs/` | Directory for migration logs |
