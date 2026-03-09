# Step 002: Storage & Server Layer

## Introduction

Step 001 created the database schema and migration. This step adds the R2 storage path builder for note attachments and creates the full server stack: repository, service, and server actions.

## Context

- Repository extends `BaseRepository` and adds custom methods for visibility-filtered queries
- Service extends `BaseService` with `withAuth` wrapping and audit options
- Actions are `'use server'` functions that delegate to the service
- Attachments are uploaded to R2 via `uploadFile()` using a path from `StoragePaths`
- Visibility filtering is done in the repository with a single query — no multiple DB calls

## Requirements

### 1. R2 Storage Path Builder

File: `src/core/integrations/storage-utils.ts`

Add to the `StoragePaths` object:

| Key | Signature | Path Pattern |
|-----|-----------|-------------|
| `studentNoteAttachment` | `(stdNo: number, fileName: string) => string` | `registry/students/notes/{stdNo}/{fileName}` |

### 2. Repository

File: `src/app/registry/student-notes/_server/repository.ts`

Extends `BaseRepository<typeof studentNotes, 'id'>`.

**Custom Methods:**

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `findByStudent` | `stdNo: number, userId: string, userRole: string` | Notes array with `createdByUser` and `attachments` | Single DB query with visibility filter. Include notes where: `visibility = 'everyone'` OR (`visibility = 'role'` AND `creatorRole = userRole`) OR (`visibility = 'self'` AND `createdBy = userId`). Join `users` for creator name. Order by `createdAt DESC`. Include related attachments. |
| `findNoteById` | `id: string` | Note with `createdByUser` and `attachments` or null | Get a single note with its relations |
| `createAttachment` | `data: typeof studentNoteAttachments.$inferInsert` | Attachment record | Insert into `studentNoteAttachments` |
| `deleteAttachments` | `noteId: string` | `void` | Delete all attachments for a note (used during note deletion for R2 cleanup) |
| `findAttachmentById` | `id: string` | Attachment or null | Fetch single attachment (for ownership/deletion) |
| `deleteAttachment` | `id: string` | `void` | Delete single attachment from DB |

**Visibility Filter Logic (SQL):**

```
WHERE stdNo = :stdNo
  AND (
    visibility = 'everyone'
    OR (visibility = 'role' AND creatorRole = :userRole)
    OR (visibility = 'self' AND createdBy = :userId)
  )
ORDER BY createdAt DESC
```

This must be a **single query** — no sequential DB calls.

**Audit**: Enabled with `stdNo` tracing on all mutations.

### 3. Service

File: `src/app/registry/student-notes/_server/service.ts`

Extends `BaseService<typeof studentNotes, 'id'>`.

**Constructor Config:**

```
{
  byIdRoles: ['dashboard'],
  findAllRoles: ['dashboard'],
  createRoles: ['dashboard'],
  updateRoles: ['dashboard'],
  deleteRoles: ['dashboard'],
  activityTypes: {
    create: 'student_note_created',
    update: 'student_note_updated',
    delete: 'student_note_deleted',
  },
}
```

**Custom Methods:**

| Method | Auth Roles | Description |
|--------|-----------|-------------|
| `getByStudent(stdNo)` | `['dashboard']` | Calls `repo.findByStudent()` with session user's `id` and `role` |
| `createNote(stdNo, content, visibility)` | `['dashboard']` | Creates note with `creatorRole` = session user's role, `createdBy` = session user's id |
| `updateNote(id, content, visibility)` | `['dashboard']` | Ownership check: only creator or admin can update. Throws if not owner. |
| `deleteNote(id)` | `['dashboard']` | Ownership check. Fetches attachments first, deletes R2 files, then deletes note (cascade handles DB). |
| `uploadAttachment(stdNo, noteId, file: FormData, fileName, mimeType)` | `['dashboard']` | Ownership check on parent note. Upload to R2 via `StoragePaths.studentNoteAttachment`. Create attachment record. |
| `deleteAttachment(id)` | `['dashboard']` | Ownership check via parent note. Delete R2 file, then delete DB record. |

**Ownership Check Pattern:**

```
1. Fetch note by ID
2. If note.createdBy !== session.user.id AND session.user.role !== 'admin':
   throw new Error('Not authorized')
```

**Export**: `export const studentNotesService = serviceWrapper(StudentNotesService, 'StudentNotesService');`

### 4. Server Actions

File: `src/app/registry/student-notes/_server/actions.ts`

All functions prefixed with `'use server'`.

| Action | Signature | Delegates To |
|--------|-----------|-------------|
| `getStudentNotes` | `(stdNo: number)` | `studentNotesService.getByStudent(stdNo)` |
| `createStudentNote` | `(stdNo: number, content: string, visibility: NoteVisibility)` | `studentNotesService.createNote(...)` |
| `updateStudentNote` | `(id: string, content: string, visibility: NoteVisibility)` | `studentNotesService.updateNote(...)` |
| `deleteStudentNote` | `(id: string)` | `studentNotesService.deleteNote(id)` |
| `uploadNoteAttachment` | `(stdNo: number, noteId: string, formData: FormData)` | `studentNotesService.uploadAttachment(...)` |
| `deleteNoteAttachment` | `(id: string)` | `studentNotesService.deleteAttachment(id)` |

**FormData Handling**: The `uploadNoteAttachment` action extracts `file`, reads `fileName` and `mimeType` from the File object, then delegates to the service.

### 5. Module Index

File: `src/app/registry/student-notes/index.ts`

Re-export actions for cross-module use:

```
export { getStudentNotes, createStudentNote, ... } from './_server/actions';
```

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/registry/student-notes/_server/repository.ts` | DB access with visibility-filtered queries |
| `src/app/registry/student-notes/_server/service.ts` | Business logic, auth, ownership checks |
| `src/app/registry/student-notes/_server/actions.ts` | Server action exports |
| `src/app/registry/student-notes/index.ts` | Barrel re-exports |

**Modified:**
| File | Change |
|------|--------|
| `src/core/integrations/storage-utils.ts` | Add `studentNoteAttachment` path builder |

## Validation Criteria

1. `pnpm tsc --noEmit` passes with no type errors
2. Visibility filtering works in a single DB query (no sequential calls)
3. Ownership checks prevent non-creators (except admin) from editing/deleting
4. R2 files are cleaned up when attachments or notes are deleted
5. Audit logs are written for all mutations with `stdNo` tracing
6. Attachment upload enforces 5 MB file size limit in the service layer

## Notes

- The 5 MB file size limit should be validated in the service layer before uploading to R2. Throw an error if exceeded.
- Accepted MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- The `creatorRole` is always captured from `session.user.role` at creation time, not from the note data.
- R2 cleanup errors during deletion should be caught and logged, not thrown — to prevent orphaned DB records.
