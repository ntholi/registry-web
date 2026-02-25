# 003 — Implementation, Validation, and Rollout

## Phase 1: Type safety and central source of truth
1. Expose activity type union as shared source imported by platform layer.
2. Change `AuditOptions.activityType` from `string` to catalog-driven `ActivityType`.
3. Change `BaseServiceConfig.activityTypes` values from `string` to `ActivityType`.
4. Update `resolve*ActivityType` functions in registry students service to return `ActivityType` instead of `string`.
5. Add compile-time guard utility for activity type literals.

## Phase 2: Enforced fallback in platform write path
1. Wire `TABLE_OPERATION_MAP` (via `resolveTableActivity`) into `BaseRepository.writeAuditLog()` as a fallback when `audit.activityType` is `null`/`undefined`.
2. When explicit `activityType` is missing, auto-resolve from `resolveTableActivity(tableName, operation)`.
3. This provides a systemic safety net — even if a service forgets the `delete` key in config, the audit row still gets a meaningful type.
4. Ensure fallback does not override explicit types (explicit always wins).
5. Add all missing table entries to `TABLE_OPERATION_MAP` for new activity types introduced in this plan.

## Phase 3: Add missing `delete` keys to `BaseServiceConfig` (targeted fix)
For every service that has `deleteRoles` configured but no `delete` activity type, add the `delete` key:
1. **Timetable**: Venues → `venue_deleted`, Venue Types → `venue_type_deleted`.
2. **Admissions**: Applications → `application_deleted`, Documents → `applicant_document_deleted`, Payments → `deposit_deleted`.
3. **Academic Feedback**: Categories → `feedback_category_deleted`, Cycles → `feedback_cycle_deleted`, Questions → `feedback_question_deleted`.
4. **Library**: Book Copies → `book_copy_deleted`, Fines → `fine_deleted`.
5. **Graduation Dates**: Wire audit options into `deleteGraduation()` with `graduation_date_deleted`.

## Phase 4: Module remediation (action-intent specificity)
1. **Tasks service**: Split generic `task_updated` into intent-specific types (`task_deleted`, `task_status_changed`, `task_assignees_changed`, `task_students_changed`, `task_due_date_changed`, `task_priority_changed`).
2. **Notifications service**: Introduce `notification_deleted` and recipient/visibility-specific events.
3. **Registry students service**: Replace non-cataloged `program_structure_update` with `student_program_structure_changed`.
4. **Finance sponsors service**: Replace `sponsor_updated` in delete path with `sponsor_deleted`. Wire `AuditOptions` into `createSponsoredStudent()` (→ `sponsorship_assigned`) and `updateSponsoredStudent()` (→ `sponsorship_updated`). Add `sponsorship_deleted` if applicable.
5. **Certificate reprints service**: Split `certificate_reprint` into `certificate_reprint_created`, `certificate_reprint_updated`, `certificate_reprint_deleted`.
6. **Library loans service**: Replace `book_loan_created` in `renewLoan()` with `book_loan_renewed`.
7. **Admissions**: Wire `application_status_changed` into the correct code path where application status is updated (currently cataloged but never emitted).

## Phase 5: Catalog/map sync and dead-code removal
1. Update activity catalog with all new events:
   - `task_deleted`, `task_status_changed`, `task_assignees_changed`, `task_students_changed`, `task_due_date_changed`, `task_priority_changed`
   - `notification_deleted`, `notification_recipients_changed`, `notification_visibility_changed`
   - `student_program_structure_changed`
   - `sponsor_deleted`, `sponsorship_deleted`
   - `certificate_reprint_created`, `certificate_reprint_updated`, `certificate_reprint_deleted`
   - `graduation_date_deleted`
   - `venue_deleted`, `venue_type_deleted`
   - `application_deleted`, `applicant_document_deleted`, `deposit_deleted`
   - `feedback_category_deleted`, `feedback_cycle_deleted`, `feedback_question_deleted`
   - `book_copy_deleted`, `fine_deleted`, `book_loan_renewed`
2. Remove obsolete entries: `certificate_reprint` (replaced by operation-specific variants).
3. Update `TABLE_OPERATION_MAP` with new entries matching all new catalog types.
4. Update `DEPARTMENT_ACTIVITIES` groupings if any new departments are introduced.

## Phase 6: Validation and rollout
1. Run typecheck/lint clean.
2. Validate analytics pages still resolve labels and department grouping.
3. Add smoke checks for key operations to assert correct activity type emission.

## Validation checklist
- Every write operation emits a catalog-valid activity type.
- No feature emits non-cataloged types.
- Delete paths never reuse update labels.
- Intent-specific operations map to intent-specific activity types.
- Metadata includes `changedFields` where update operations occur.
- Every service with `deleteRoles` also has `delete` in `activityTypes`.
- Dead catalog entries are either wired into code or removed.
- `TABLE_OPERATION_MAP` covers all tables that have audit-enabled writes.

## Query checks (recommended)
1. Non-cataloged activity types:
```sql
select distinct activity_type
from audit_logs
where activity_type is not null
except
select unnest(array[
	-- generated list from catalog keys
]);
```

2. NULL activity types (should be zero after fallback is wired):
```sql
select table_name, operation, count(*)
from audit_logs
where activity_type is null
group by 1,2
order by count(*) desc;
```

3. Generic overuse detection:
```sql
select table_name, activity_type, count(*)
from audit_logs
group by 1,2
order by count(*) desc;
```

4. Expected intent distribution per module:
```sql
select activity_type, count(*)
from audit_logs
where changed_at >= now() - interval '30 days'
group by 1
order by 2 desc;
```

## Migration strategy
- Stepwise migration by module to avoid noisy analytics jumps.
- Keep backward-compatible labels during transition where needed.

### Concrete backfill strategy
Use the `operation` column in `audit_logs` to retroactively correct historical activity types where `operation` disagrees with the activity type:
```sql
-- Fix task deletes logged as task_updated
UPDATE audit_logs SET activity_type = 'task_deleted'
WHERE table_name = 'tasks' AND operation = 'DELETE' AND activity_type = 'task_updated';

-- Fix notification deletes logged as notification_updated
UPDATE audit_logs SET activity_type = 'notification_deleted'
WHERE table_name = 'notifications' AND operation = 'DELETE' AND activity_type = 'notification_updated';

-- Fix sponsor deletes logged as sponsor_updated
UPDATE audit_logs SET activity_type = 'sponsor_deleted'
WHERE table_name = 'sponsors' AND operation = 'DELETE' AND activity_type = 'sponsor_updated';

-- Fix certificate_reprint generic usage
UPDATE audit_logs SET activity_type = 'certificate_reprint_created'
WHERE table_name = 'certificate_reprints' AND operation = 'INSERT' AND activity_type = 'certificate_reprint';

UPDATE audit_logs SET activity_type = 'certificate_reprint_updated'
WHERE table_name = 'certificate_reprints' AND operation = 'UPDATE' AND activity_type = 'certificate_reprint';

UPDATE audit_logs SET activity_type = 'certificate_reprint_deleted'
WHERE table_name = 'certificate_reprints' AND operation = 'DELETE' AND activity_type = 'certificate_reprint';

-- Fix non-cataloged program_structure_update
UPDATE audit_logs SET activity_type = 'student_program_structure_changed'
WHERE activity_type = 'program_structure_update';

-- Backfill NULL activity types using operation column
UPDATE audit_logs SET activity_type = 'venue_deleted'
WHERE table_name = 'venues' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'venue_type_deleted'
WHERE table_name = 'venue_types' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'application_deleted'
WHERE table_name = 'applications' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'feedback_category_deleted'
WHERE table_name = 'feedback_categories' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'feedback_cycle_deleted'
WHERE table_name = 'feedback_cycles' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'feedback_question_deleted'
WHERE table_name = 'feedback_questions' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'graduation_date_deleted'
WHERE table_name = 'graduation_dates' AND operation = 'DELETE' AND activity_type IS NULL;
```
Run backfill AFTER new types are added to the catalog to avoid analytics breakage.

## Risk controls
- Protect fallback resolver with deterministic tests.
- Keep `TABLE_OPERATION_MAP` as the single source of truth for fallback mapping.
- For high-volume tables, avoid expensive per-row logic inside write path.
- Explicit `activityType` always takes precedence over fallback resolution.

## Non-goals
- No redesign of activity tracker UI in this plan.
- No changes to unrelated domain business logic.
- No LMS-specific audit changes (LMS already uses correct `assessment_*` types via `AssessmentService`).

## Done criteria
- Catalog and emitted events are 1:1 aligned (no dead entries, no uncataloged emissions).
- Task/notification delete and status transitions are distinguishable in analytics.
- Finance sponsor delete emits `sponsor_deleted`, not `sponsor_updated`.
- Sponsorship operations (`sponsorship_assigned`, `sponsorship_updated`) are actually emitted.
- Certificate reprints emit operation-specific types.
- `AuditOptions.activityType`, `BaseServiceConfig.activityTypes`, and `resolve*ActivityType` functions all use `ActivityType` union, not `string`.
- Every service with `deleteRoles` also has a matching `delete` activity type in config.
- `TABLE_OPERATION_MAP` is wired as a fallback in `BaseRepository.writeAuditLog()`.
- All 9 newly identified delete gaps are fixed (venues, venue types, applications, documents, deposits, feedback ×3, graduation dates).
- Library `renewLoan()` uses `book_loan_renewed`.
- Historical backfill script has been run to correct misclassified and NULL-typed rows.
