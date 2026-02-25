# 002 — Gap Matrix (Precision and Accuracy)

## Taxonomy drift
### Emitted but not cataloged
- `assignment`
- `quiz`
- `program_structure_update`

### Cataloged but weakly/rarely emitted via explicit app writes
Many catalog entries are valid but are not consistently emitted by explicit operation intent, especially where modules rely on generic update labels.

## Structural precision gaps
1. `BaseRepository.AuditOptions.activityType` is typed as `string`, not catalog-enforced type.
2. `BaseService` only maps create/update/delete, insufficient for action-intent events.
3. Fallback table/operation mapping exists but is not wired into audit write path.
4. Some feature repositories perform custom transactions without standardized semantic activity typing.

## Feature-specific pain points
### LMS
- `assignment` and `quiz` are too broad; do not identify create/publish/update/delete intent.

### Tasks
- `task_updated` overused for status change, assignment changes, and delete.

### Notifications
- delete path uses `notification_updated` instead of dedicated delete event.

### Students
- `program_structure_update` is not cataloged and should be normalized.

### Admissions applicant sub-features
- weaker alignment with BaseRepository semantic audit patterns, limiting consistent intent-level activity typing.

## Root cause summary
The codebase has strong audit infrastructure, but semantic event classification is partially decentralized and not type-constrained end-to-end.

## Fine-grained taxonomy proposal

### Naming principles
- Action-based and operation-intent specific.
- Stable identifiers in snake_case.
- Keep department ownership explicit.
- Avoid generic nouns as standalone activity types.

### LMS
- `lms_assignment_created`
- `lms_assignment_published`
- `lms_assignment_updated`
- `lms_assignment_deleted`
- `lms_quiz_created`
- `lms_quiz_published`
- `lms_quiz_updated`
- `lms_quiz_deleted`

Replace generic:
- `assignment` -> `lms_assignment_*`
- `quiz` -> `lms_quiz_*`

### Tasks
- `task_created` (keep)
- `task_deleted` (new)
- `task_status_changed` (new)
- `task_assignees_changed` (new)
- `task_students_changed` (new)
- `task_due_date_changed` (new)
- `task_priority_changed` (new)

### Notifications
- `notification_created` (keep)
- `notification_updated` (keep for generic metadata changes)
- `notification_deleted` (new)
- `notification_recipients_changed` (new)
- `notification_visibility_changed` (new)

### Registry students
- `student_program_structure_changed` (new, replaces non-cataloged `program_structure_update`)
- `student_user_linked` (new)
- `student_user_unlinked` (new)

### Admissions applicant records/documents
- `applicant_academic_record_created`
- `applicant_academic_record_updated`
- `applicant_academic_record_deleted`
- `applicant_document_uploaded`
- `applicant_document_verified`
- `applicant_document_rejected`
- `applicant_document_deleted`

### Metadata standard
Recommended normalized metadata keys:
- `changedFields: string[]`
- `fromStatus: string | null`
- `toStatus: string | null`
- `sourceModule: string`
- `reason: string | null`

This preserves concise activity type identifiers while improving forensic explainability.
