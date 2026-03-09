# Step 003: Activity Logging

## Introduction

Steps 001-002 created the database schema and server layer. This step integrates the student notes feature with the activity logging system so all note and attachment operations appear in the student's History tab and the admin activity tracker.

## Context

- Each module owns an `_lib/activities.ts` file exporting a const `ActivityFragment`
- The fragment has a `catalog` (activity type → label + department) and `tableOperationMap` (table:operation → activity type)
- The fragment is imported in `src/app/admin/activity-tracker/_lib/registry.ts`
- Since student notes are a registry sub-feature, activity entries are added to the existing `src/app/registry/_lib/activities.ts` fragment — **not** a separate file

## Requirements

### 1. Add Activity Types to Registry Fragment

File: `src/app/registry/_lib/activities.ts`

Add the following entries to the `catalog`:

| Activity Type | Label | Department |
|--------------|-------|-----------|
| `student_note_created` | Student Note Created | `registry` |
| `student_note_updated` | Student Note Updated | `registry` |
| `student_note_deleted` | Student Note Deleted | `registry` |
| `student_note_attachment_uploaded` | Student Note Attachment Uploaded | `registry` |
| `student_note_attachment_deleted` | Student Note Attachment Deleted | `registry` |

Add the following entries to `tableOperationMap`:

| Key | Value |
|-----|-------|
| `student_notes:INSERT` | `student_note_created` |
| `student_notes:UPDATE` | `student_note_updated` |
| `student_notes:DELETE` | `student_note_deleted` |
| `student_note_attachments:INSERT` | `student_note_attachment_uploaded` |
| `student_note_attachments:DELETE` | `student_note_attachment_deleted` |

### 2. Service Activity Type Config

The service constructor (from Step 002) already configures:

```
activityTypes: {
  create: 'student_note_created',
  update: 'student_note_updated',
  delete: 'student_note_deleted',
}
```

For attachment operations, the service passes `activityType` explicitly via `AuditOptions` when calling repository methods:

- Upload attachment: `activityType: 'student_note_attachment_uploaded'`
- Delete attachment: `activityType: 'student_note_attachment_deleted'`

### 3. Student Tracing

All audit writes must include `stdNo` in `AuditOptions` so activity appears in the student's History tab. The service retrieves `stdNo` from the note's record and passes it through.

## Expected Files

| File | Change Type | Description |
|------|------------|-------------|
| `src/app/registry/_lib/activities.ts` | Modified | Add 5 new activity types to catalog + 5 table operation mappings |

No new files are needed — the registry fragment already exists and is already imported by the activity tracker registry.

## Validation Criteria

1. `pnpm tsc --noEmit` passes
2. The new activity types appear in the admin activity tracker
3. Creating/updating/deleting a note writes an audit log with `stdNo`
4. Uploading/deleting an attachment writes an audit log with `stdNo`
5. Student History tab shows note-related activities

## Notes

- No changes needed to `src/app/admin/activity-tracker/_lib/registry.ts` since it already imports `REGISTRY_ACTIVITIES`.
- The `RegistryActivityType` type automatically picks up the new catalog keys since it's derived from `keyof typeof REGISTRY_ACTIVITIES.catalog`.
