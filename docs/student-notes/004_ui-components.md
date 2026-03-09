# Step 004: UI Components

## Introduction

Steps 001-003 set up the database, server layer, and activity logging. This step creates the client-side components that render inside the "Notes" tab on the student detail page. The UI includes a note creation form (with `RichTextField`), note display cards with inline editing, and attachment upload/display within each note.

## Context

- Follow the admissions `NotesSection.tsx` pattern for the overall structure
- Use `RichTextField` from `@/shared/ui/adease/` for rich text input (toolbar='normal')
- Use `TypographyStylesProvider` from Mantine for rendering HTML content safely
- Use Mantine `Dropzone` for file uploads
- Use TanStack Query (`useQuery`, `useMutation`) for data fetching and mutations
- All components are client components (`'use client'`)
- Follow the `DocumentsView` pattern for the tab container (accepts `stdNo` + `isActive` props)

## Requirements

### 1. `NotesView` — Tab Container

File: `src/app/registry/students/_components/notes/NotesView.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `stdNo` | `number` | Student number |
| `isActive` | `boolean` | Whether the Notes tab is currently active |

**Behavior:**

- Client component with `'use client'`
- Fetches notes via `useQuery({ queryKey: ['student-notes', stdNo], queryFn: () => getStudentNotes(stdNo), enabled: isActive })`
- Renders `AddNoteForm` at the top
- Below: list of `NoteCard` components, or "No notes yet" empty state
- Loading state: `Center` with `Loader`

**Layout:**

```
┌───────────────────────────────────┐
│  [AddNoteForm]                    │
├───────────────────────────────────┤
│  [NoteCard] (newest first)        │
│  [NoteCard]                       │
│  [NoteCard]                       │
│  ...                              │
└───────────────────────────────────┘
```

### 2. `AddNoteForm` — Note Creation

File: `src/app/registry/students/_components/notes/AddNoteForm.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `stdNo` | `number` | Student number |

**Fields:**

| Field | Component | Default | Description |
|-------|----------|---------|-------------|
| Content | `RichTextField` (toolbar='normal') | empty | Rich text content |
| Visibility | `SegmentedControl` | `'role'` | Options: `{ label: 'My Department', value: 'role' }`, `{ label: 'Only Me', value: 'self' }`, `{ label: 'Everyone', value: 'everyone' }` |

**Behavior:**

- `useMutation` calling `createStudentNote(stdNo, content, visibility)`
- On success: invalidate `['student-notes', stdNo]`, clear form, show success notification
- On error: show error notification
- Submit button: `Button` with `IconSend` icon, disabled when content is empty
- Wrapped in a `Paper` with border for visual grouping

### 3. `NoteCard` — Note Display

File: `src/app/registry/students/_components/notes/NoteCard.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `note` | Note object from query | The note data including attachments and creator info |
| `stdNo` | `number` | Student number (for query invalidation) |
| `currentUserId` | `string` | Current user's ID (for ownership checks) |
| `currentUserRole` | `string` | Current user's role (for admin check) |

**Display Mode:**

- `Paper` with border
- **Header row**: Author name (bold), role `Badge` (variant='light'), relative timestamp via `formatDateTime`, visibility icon/badge
- **Content**: Rendered HTML via Mantine `TypographyStylesProvider` wrapping `div` with `dangerouslySetInnerHTML`
- **Actions** (top-right, only if owner or admin): Edit (`ActionIcon` with `IconEdit`) and Delete (`ActionIcon` with `IconTrash`)
- **Attachments section**: If note has attachments, show `AttachmentList` below content with a `Divider`

**Edit Mode:**

- Triggered by clicking Edit action
- Replaces content display with `RichTextField` (toolbar='normal')
- Shows visibility `SegmentedControl` (pre-filled with current value)
- Save and Cancel buttons
- `useMutation` calling `updateStudentNote(id, content, visibility)`
- On success: invalidate `['student-notes', stdNo]`, exit edit mode

**Delete:**

- Confirmation via Mantine `modals.openConfirmModal` (from `@mantine/modals`)
- `useMutation` calling `deleteStudentNote(id)`
- On success: invalidate `['student-notes', stdNo]`, success notification

### 4. `AttachmentList` — Attachment Display & Upload

File: `src/app/registry/students/_components/notes/AttachmentList.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `noteId` | `string` | Parent note ID |
| `stdNo` | `number` | Student number |
| `attachments` | Attachment array | List of existing attachments |
| `canEdit` | `boolean` | Whether the current user can add/remove attachments |

**Upload Section** (only if `canEdit`):

- Mantine `Dropzone` with:
  - `maxSize`: 5 MB (`5 * 1024 * 1024`)
  - `accept`: PDF, images (jpeg, png, webp, gif), Word (doc, docx), PowerPoint (ppt, pptx), Excel (xls, xlsx)
- On drop: call `uploadNoteAttachment(stdNo, noteId, formData)` for each file
- Show upload progress/loading state
- Invalidate `['student-notes', stdNo]` on success

**Display:**

- `SimpleGrid` (cols: `{ base: 1, sm: 2, md: 3 }`) of attachment items
- Each attachment item shows:
  - File type icon (use Tabler icons: `IconFileTypePdf`, `IconPhoto`, `IconFileTypeDoc`, `IconFileTypePpt`, `IconFileTypeXls`, `IconFile` as fallback)
  - File name (truncated if long)
  - File size (formatted: KB/MB)
  - Download link (`Anchor` with `href={getPublicUrl(fileKey)}` and `target="_blank"`)
  - Delete button (only if `canEdit`): `ActionIcon` with `IconTrash`, calls `deleteNoteAttachment(id)` after confirmation
- Image attachments: show small thumbnail preview using `Image` component with `getPublicUrl(fileKey)`

## Component Hierarchy

```
NotesView
├── AddNoteForm
│   ├── RichTextField (toolbar='normal')
│   ├── SegmentedControl (visibility)
│   └── Button (submit)
└── NoteCard[] (map over notes)
    ├── Header (author, role badge, timestamp, visibility)
    ├── TypographyStylesProvider (HTML content)
    ├── Edit/Delete actions (owner/admin)
    └── AttachmentList
        ├── Dropzone (upload, if canEdit)
        └── SimpleGrid (attachment items)
```

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/registry/students/_components/notes/NotesView.tsx` | Tab container, data fetching |
| `src/app/registry/students/_components/notes/AddNoteForm.tsx` | Note creation form with RichTextField |
| `src/app/registry/students/_components/notes/NoteCard.tsx` | Note display with edit/delete |
| `src/app/registry/students/_components/notes/AttachmentList.tsx` | Attachment upload and display for a note |

## Validation Criteria

1. `pnpm tsc --noEmit` passes
2. Notes render with formatted HTML content
3. Visibility selector defaults to "My Department"
4. Edit mode replaces content with `RichTextField`
5. Delete shows confirmation modal
6. File upload respects 5 MB size limit and accepted types
7. Image attachments show thumbnail previews
8. Non-owner users don't see edit/delete actions
9. Empty state shows "No notes yet" message
10. Query invalidation refreshes the list after mutations

## Notes

- Use `formatDateTime(note.createdAt, 'relative')` for relative timestamps if available, otherwise `formatDateTime(note.createdAt, 'long')`.
- Use `getPublicUrl()` from `@/core/integrations/storage-utils` for attachment URLs.
- The visibility badge/icon should use different colors: `role` → blue, `self` → red, `everyone` → green (or use Tabler icons: `IconUsers`, `IconLock`, `IconWorld`).
- File size formatting helper: `(bytes: number) => bytes < 1024 * 1024 ? \`${(bytes / 1024).toFixed(1)} KB\` : \`${(bytes / (1024 * 1024)).toFixed(1)} MB\``
- Avoid `useEffect` for data fetching — all data comes from `useQuery`.
