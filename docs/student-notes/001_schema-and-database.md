# Step 001: Schema & Database

## Introduction

This is the first step. It creates the database tables, enum, relations, and barrel exports for the student notes feature. After this step, the migration can be generated and the schema will be available for the server layer.

## Context

- Follow the pattern from `src/app/admissions/applications/_schema/applicationNotes.ts`
- Attachments are linked to notes (1:N relationship) per user's choice
- The `note_visibility` enum is new; `userRoles` enum already exists
- Schema files must NOT import from `@/core/database` — use specific module paths

## Requirements

### 1. Visibility Enum

Create a new `pgEnum` for note visibility in the `studentNotes.ts` schema file:

| Value | Label (UI) | Meaning |
|-------|-----------|---------|
| `role` | Same Role | Visible to all users with the same role as the creator |
| `self` | Only Me | Visible only to the note creator |
| `everyone` | Everyone | Visible to all dashboard users |

### 2. `studentNotes` Table

File: `src/app/registry/student-notes/_schema/studentNotes.ts`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `text` | PK, default `nanoid()` | |
| `stdNo` | `integer` | FK → `students.stdNo`, cascade delete, not null | |
| `content` | `text` | not null | Stores HTML from RichTextField |
| `visibility` | `noteVisibility` enum | not null, default `'role'` | |
| `creatorRole` | `userRoles` enum | not null | Snapshot of creator's role at creation time |
| `createdBy` | `text` | FK → `users.id`, on delete set null | |
| `createdAt` | `timestamp` | default `now()` | |
| `updatedAt` | `timestamp` | default `now()`, `$onUpdate` | |

**Indexes:**

| Name | Column(s) |
|------|----------|
| `idx_student_notes_std_no` | `stdNo` |
| `idx_student_notes_created_by` | `createdBy` |

### 3. `studentNoteAttachments` Table

File: `src/app/registry/student-notes/_schema/studentNoteAttachments.ts`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `text` | PK, default `nanoid()` | |
| `noteId` | `text` | FK → `studentNotes.id`, cascade delete, not null | Linked to parent note |
| `fileName` | `text` | not null | Original file name |
| `fileKey` | `text` | not null | R2 storage key |
| `fileSize` | `integer` | | Size in bytes |
| `mimeType` | `text` | | MIME type string |
| `createdAt` | `timestamp` | default `now()` | |

**Indexes:**

| Name | Column(s) |
|------|----------|
| `idx_student_note_attachments_note` | `noteId` |

### 4. Relations

File: `src/app/registry/student-notes/_schema/relations.ts`

| Source Table | Relation | Target | FK Column |
|-------------|----------|--------|-----------|
| `studentNotes` | one → `users` | `createdByUser` | `createdBy` |
| `studentNotes` | many → `studentNoteAttachments` | `attachments` | `noteId` |
| `studentNoteAttachments` | one → `studentNotes` | `note` | `noteId` |

Cross-module relations to add in the students schema relations (or reference):
- `students` → many `studentNotes` via `stdNo`

### 5. Barrel Exports

Update `src/app/registry/_database/index.ts` to re-export:
- `studentNotes` and `noteVisibility` from `../student-notes/_schema/studentNotes`
- `studentNoteAttachments` from `../student-notes/_schema/studentNoteAttachments`

### 6. Core Database Registration

Add imports of the new schemas in `src/core/database/index.ts`.

### 7. Migration

Run `pnpm db:generate` to create the migration SQL file.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/registry/student-notes/_schema/studentNotes.ts` | Notes table + visibility enum |
| `src/app/registry/student-notes/_schema/studentNoteAttachments.ts` | Attachments table |
| `src/app/registry/student-notes/_schema/relations.ts` | Drizzle relations |

## Validation Criteria

1. `pnpm db:generate` produces a migration without errors
2. `pnpm tsc --noEmit` passes with no type errors
3. New tables appear in the generated SQL with correct columns, types, and constraints
4. Cascade deletes are set: note deletion removes attachments, student deletion removes notes
5. The `note_visibility` enum has values `['role', 'self', 'everyone']`

## Notes

- The `creatorRole` column uses the existing `userRoles` enum. This captures the creator's role at note creation time so visibility filtering remains correct even if the user's role changes later.
- Attachments inherit their visibility from the parent note — they don't have their own visibility column.
- The `noteVisibility` enum is defined in the `studentNotes.ts` file alongside the table.
