# 002 — Gap Matrix (Precision and Accuracy)

## Taxonomy drift
### Emitted but not cataloged
- `program_structure_update`

### Cataloged but never emitted (dead entries)
- `sponsorship_assigned` — repository calls lack `AuditOptions`
- `sponsorship_updated` — repository calls lack `AuditOptions`
- `application_status_changed` — no code path emits this

## Structural precision gaps
1. `BaseRepository.AuditOptions.activityType` is typed as `string`, not catalog-enforced type.
2. `BaseService` only maps create/update/delete, insufficient for action-intent events.
3. `BaseServiceConfig.activityTypes` uses `string` for create/update/delete values, not `ActivityType`.
4. The `resolve*ActivityType` functions in registry students service return `string`, not `ActivityType`.
5. `TABLE_OPERATION_MAP` exists but is never wired into the audit write path as a fallback.
6. Many services have `deleteRoles` configured but no `delete` key in `activityTypes`, causing deletes to log with `null` activity type.
7. Some feature repositories perform custom transactions without standardized semantic activity typing (e.g., sponsorship operations).

## Feature-specific pain points

### Tasks
- `task_updated` overused for status change, assignment changes, and delete.

### Notifications
- Delete path uses `notification_updated` instead of dedicated delete event.

### Finance
- `SponsorService.delete()` emits `sponsor_updated` instead of `sponsor_deleted`.
- `SponsorService.createSponsoredStudent()` and `updateSponsoredStudent()` pass no `AuditOptions` to the repository, so `sponsorship_assigned`/`sponsorship_updated` are never emitted.
- No `sponsor_deleted` or `sponsorship_deleted` catalog entries exist.

### Certificate Reprints
- `certificate_reprint` is used for create, update, AND delete operations — all three are indistinguishable in analytics.

### Graduation Dates
- `graduation_date_deleted` does not exist in the catalog. Deletion is not audited at all (no `AuditOptions` passed).

### Students
- `program_structure_update` is not cataloged and should be normalized.

### Timetable
- Venues and venue types have `deleteRoles` configured but no `delete` in `activityTypes` — deletes audited with `null` type.
- No `venue_deleted` or `venue_type_deleted` in catalog.

### Admissions
- Applications, applicant documents, and bank deposits have `deleteRoles` but no `delete` in `activityTypes` — deletes audited with `null` type.
- `application_status_changed` is cataloged but never emitted.
- No `application_deleted`, `applicant_document_deleted`, or `deposit_deleted` in catalog.

### Academic Feedback
- Feedback categories, cycles, and questions have `deleteRoles` but no `delete` in `activityTypes` — deletes audited with `null` type.
- No `feedback_category_deleted`, `feedback_cycle_deleted`, or `feedback_question_deleted` in catalog.

### Academic Modules
- No delete activity type; if module deletion is allowed it goes untyped.

### Library
- Book copies and fines have no delete activity type.
- `renewLoan()` reuses `book_loan_created` instead of a dedicated `book_loan_renewed` type.

## Root cause summary
The codebase has strong audit infrastructure, but:
1. Semantic event classification is partially decentralized and not type-constrained end-to-end.
2. `BaseService` doesn't enforce that `delete` activity types are provided when `deleteRoles` exist.
3. `TABLE_OPERATION_MAP` exists as a safety net but is never used in the write path.

## Fine-grained taxonomy proposal

### Naming principles
- Action-based and operation-intent specific.
- Stable identifiers in snake_case.
- Keep department ownership explicit.
- Avoid generic nouns as standalone activity types.

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

### Finance
- `sponsor_created` (keep)
- `sponsor_updated` (keep)
- `sponsor_deleted` (new, replaces misuse of `sponsor_updated` in delete path)
- `sponsorship_assigned` (keep — wire into `createSponsoredStudent()`)
- `sponsorship_updated` (keep — wire into `updateSponsoredStudent()`)
- `sponsorship_deleted` (new, if sponsorships can be deleted)

### Certificate Reprints
- `certificate_reprint_created` (new, replaces generic `certificate_reprint` for insert)
- `certificate_reprint_updated` (new, replaces generic `certificate_reprint` for update)
- `certificate_reprint_deleted` (new, replaces generic `certificate_reprint` for delete)

### Graduation Dates
- `graduation_date_created` (keep)
- `graduation_date_updated` (keep)
- `graduation_date_deleted` (new — currently unaudited entirely)

### Timetable
- `venue_deleted` (new)
- `venue_type_deleted` (new)

### Admissions
- `application_deleted` (new)
- `applicant_document_deleted` (new)
- `deposit_deleted` (new)
- `application_status_changed` — already cataloged, needs to be wired into the correct code path

### Academic Feedback
- `feedback_category_deleted` (new)
- `feedback_cycle_deleted` (new)
- `feedback_question_deleted` (new)

### Academic Modules
- `module_deleted` (already in catalog under registry department — verify if academic `modules` table should use the same key or a separate `academic_module_deleted`)

### Library
- `book_copy_deleted` (new)
- `fine_deleted` (new)
- `book_loan_renewed` (new, replaces `book_loan_created` in `renewLoan()`)

### Metadata standard
Recommended normalized metadata keys:
- `changedFields: string[]`
- `fromStatus: string | null`
- `toStatus: string | null`
- `sourceModule: string`
- `reason: string | null`

This preserves concise activity type identifiers while improving forensic explainability.
