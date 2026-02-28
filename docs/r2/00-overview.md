# R2 Storage Migration — Master Plan

> **Status:** Planning  
> **Created:** 2026-02-28  
> **Goal:** Standardize all R2 file storage with a unified folder hierarchy, centralized URL management, DB-tracked photo references, and zero data loss.

---

## Problem Statement

The current R2 storage implementation suffers from:

1. **Inconsistent folder paths** — 7 different naming conventions across modules
2. **Hardcoded public URL** — `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev` appears in 9+ files
3. **No database tracking for photos** — Student/employee photos are discovered via 4 sequential HEAD requests (probing .jpg, .jpeg, .png, .webp)
4. **Duplicated upload/retrieval logic** — Each module implements its own URL construction, file size validation, and extension handling
5. **Mixed storage reference patterns** — Some DB records store `fileName` only, others store full `fileUrl`, others store nothing (photos)
6. **`formatFileSize()` duplicated** — Exists in 3 places instead of using the shared utility

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
│   └── applicants/
│       └── documents/{applicantId}/{nanoid}.{ext}
└── library/
    ├── question-papers/{nanoid}.{ext}
    └── publications/{nanoid}.{ext}
```

## Migration Steps (Summary)

| Step | Document | Description |
|------|----------|-------------|
| 1 | [01-centralize-storage-utility.md](./01-centralize-storage-utility.md) | Create centralized storage utility with env var, path builders, and URL resolver |
| 2 | [02-schema-changes.md](./02-schema-changes.md) | Add `photoKey` to students/employees, standardize `fileUrl` storage format |
| 3 | [03-migration-script.md](./03-migration-script.md) | R2 copy script: old paths → new paths, populate `photoKey` columns |
| 4 | [04-update-upload-code.md](./04-update-upload-code.md) | Update all upload callsites to use new paths and centralized utility |
| 5 | [05-update-retrieval-code.md](./05-update-retrieval-code.md) | Update all URL construction and photo retrieval to use DB + utility |
| 6 | [06-cleanup-and-verification.md](./06-cleanup-and-verification.md) | Verify all new paths, delete old objects, remove dead code |

## Risk Mitigation

- **Zero data loss**: Copy-then-update strategy. Old files are never deleted until new paths are verified with HEAD requests.
- **Rollback**: If anything goes wrong, old paths still exist. The migration script logs all operations for audit.
- **Phased deployment**: Each step can be deployed independently. Steps 1-2 are backwards-compatible.
- **Feature flags**: The old URL construction fallback remains until Step 6 cleanup.
