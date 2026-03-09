# Student Notes - Implementation Plan

## Overview

A "Notes" tab on the student detail page allowing any dashboard user to create rich-text notes (with optional file attachments) for a student. Notes use a visibility model: **Same Role** (default), **Only Me**, or **Everyone**. Attachments are linked to their parent note. Creators can edit/delete their own notes; admins can manage all.

## Features Summary

| Feature | Description |
|---------|-------------|
| Rich-text notes | Create notes with formatting via `RichTextField` (toolbar='normal') |
| File attachments | Upload PDF, images, Word, PowerPoint, Excel per note (5 MB max) |
| Visibility control | Same Role (default), Only Me, Everyone |
| Edit / Delete | Creator and admin can edit or delete notes |
| Timeline ordering | Newest notes first, no pinning |
| Cross-role visibility | Notes visible to other dashboard users based on chosen visibility |
| Activity logging | All CRUD operations tracked in student history |

## Implementation Steps

| Step | File | Description |
|------|------|-------------|
| 1 | [001_schema-and-database.md](001_schema-and-database.md) | Database schema, enum, relations, barrel exports, migration |
| 2 | [002_storage-and-server.md](002_storage-and-server.md) | R2 storage path, repository, service, server actions |
| 3 | [003_activity-logging.md](003_activity-logging.md) | Activity fragment and registry integration |
| 4 | [004_ui-components.md](004_ui-components.md) | NotesView, AddNoteForm, NoteCard, attachment upload/display |
| 5 | [005_integration.md](005_integration.md) | StudentTabs integration, permissions, verification |

## Database Entities

```
┌──────────────────────────┐
│       student_notes      │
├──────────────────────────┤
│ id          (PK, text)   │
│ stdNo       (FK→students)│
│ content     (text, HTML) │
│ visibility  (enum)       │
│ creatorRole (enum)       │
│ createdBy   (FK→users)   │
│ createdAt   (timestamp)  │
│ updatedAt   (timestamp)  │
└──────────┬───────────────┘
           │ 1:N
┌──────────▼───────────────────┐
│  student_note_attachments    │
├──────────────────────────────┤
│ id          (PK, text)       │
│ noteId      (FK→student_notes│
│ fileName    (text)           │
│ fileKey     (text, R2 key)   │
│ fileSize    (integer)        │
│ mimeType    (text)           │
│ createdAt   (timestamp)      │
└──────────────────────────────┘

Visibility enum: 'role' | 'self' | 'everyone'
```

## Directory Structure (Final)

```
src/app/registry/student-notes/
├── _schema/
│   ├── studentNotes.ts
│   ├── studentNoteAttachments.ts
│   └── relations.ts
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _lib/
│   └── activities.ts
└── index.ts

src/app/registry/students/_components/notes/
├── NotesView.tsx
├── AddNoteForm.tsx
├── NoteCard.tsx
└── AttachmentList.tsx
```

## Business Rules

| Rule | Detail |
|------|--------|
| Visibility default | `'role'` — visible to all users sharing the creator's role |
| Role snapshot | `creatorRole` is captured at creation time; role changes don't break visibility |
| Ownership | Only the note creator (or admin) can edit/delete |
| Attachments follow note | Deleting a note cascades to its attachments (DB + R2 cleanup) |
| File limits | 5 MB max per file; PDF, images (jpg/png/webp/gif), Word (.doc/.docx), PowerPoint (.ppt/.pptx), Excel (.xls/.xlsx) |
| Ordering | Newest notes first (`createdAt DESC`) |
| Rich text | Content stored as HTML from `RichTextField` |

## Access Control

| Role | View Notes | Create Notes | Edit/Delete Own | Edit/Delete Any |
|------|-----------|-------------|----------------|----------------|
| admin | ✅ | ✅ | ✅ | ✅ |
| registry | ✅ | ✅ | ✅ | ❌ |
| finance | ✅ | ✅ | ✅ | ❌ |
| academic | ✅ | ✅ | ✅ | ❌ |
| library | ✅ | ✅ | ✅ | ❌ |
| marketing | ✅ | ✅ | ✅ | ❌ |
| student_services | ✅ | ✅ | ✅ | ❌ |
| resource | ✅ | ✅ | ✅ | ❌ |
| leap | ✅ | ✅ | ✅ | ❌ |
| human_resource | ✅ | ✅ | ✅ | ❌ |
| user / student / applicant | ❌ | ❌ | ❌ | ❌ |

## Execution Order

Steps must be executed in order (1 → 5). Each step depends on the previous.

## Validation Command

```bash
pnpm tsc --noEmit & pnpm lint:fix
```
