# 001 — Current State Deepdive

## Objective
Make activity logging as specific and operation-accurate as possible across the codebase, avoiding generic labels.

## Files deeply analyzed
- `src/app/admin/activity-tracker/_lib/activity-catalog.ts`
- `src/app/admin/activity-tracker/_lib/activity-types.ts`
- `src/core/platform/BaseService.ts`
- `src/core/platform/BaseRepository.ts`
- `src/core/database/schema/auditLogs.ts`
- representative feature services/actions/repositories across registry, admin, admissions, lms, library, academic, timetable, finance

## Main findings
1. `activityType` is stored for all current rows in `audit_logs` (no nulls in sampled DB).
2. `TABLE_OPERATION_MAP` and `resolveTableActivity` are effectively not used in write flow — they exist only as a reference map but are never called during audited writes.
3. Several events are too generic or semantically incorrect for operation-level visibility.
4. There is one emitted activity type value not present in the catalog, causing drift (`program_structure_update`).
5. Many modules have `deleteRoles` configured but no `delete` key in `activityTypes` — causing deletes to be audited with `null` activity type.
6. Some catalog entries (`sponsorship_assigned`, `sponsorship_updated`, `application_status_changed`) are defined but never actually emitted in code.

## Confirmed high-impact issues

### Semantically wrong reuse (delete/status logged as update)
- Task delete/status changes logged as `task_updated`.
- Notification delete logged as `notification_updated`.
- Sponsor delete logged as `sponsor_updated`.
- Certificate reprints: `certificate_reprint` used for create, update, AND delete.

### Non-cataloged string emitted
- `program_structure_update` (students service) — NOT in the catalog.

### Missing `delete` activity type in `BaseServiceConfig` (audited as `null`)
These modules have `deleteRoles` configured but no `delete` key in their `activityTypes` config. `BaseService.delete()` calls `buildAuditOptions(session, 'delete')` which returns `activityType: undefined`, so the audit row gets `null` activity type:
- **Venues** (`src/app/timetable/venues/_server/service.ts`)
- **Venue Types** (`src/app/timetable/venue-types/_server/service.ts`)
- **Applications** (`src/app/admissions/applications/_server/service.ts`)
- **Applicant Documents** (`src/app/admissions/applicants/documents/_server/service.ts`)
- **Bank Deposits** (`src/app/admissions/applicants/payments/_server/service.ts`)
- **Feedback Categories** (`src/app/academic/feedback/categories/_server/service.ts`)
- **Feedback Cycles** (`src/app/academic/feedback/cycles/_server/service.ts`)
- **Feedback Questions** (`src/app/academic/feedback/questions/_server/service.ts`)
- **Academic Modules** (`src/app/academic/modules/_server/service.ts`)
- **Library Book Copies** (`src/app/library/book-copies/_server/service.ts`)
- **Library Fines** (`src/app/library/fines/_server/service.ts`)

### Graduation dates delete — no audit at all
`deleteGraduation()` in `src/app/registry/graduation/dates/_server/service.ts` calls `this.repository.delete(id)` without passing audit options, so the delete is completely unaudited.

### Cataloged but never emitted (dead catalog entries)
- `sponsorship_assigned` — the `SponsorService.createSponsoredStudent()` calls the repository without passing `AuditOptions`.
- `sponsorship_updated` — the `SponsorService.updateSponsoredStudent()` calls the repository without passing `AuditOptions`.
- `application_status_changed` — cataloged but no code path emits this type.

### Library loans — misleading reuse
`renewLoan()` in `src/app/library/loans/_server/service.ts` emits `book_loan_created` instead of a dedicated renewal type. A loan renewal is semantically different from a new loan.

## LMS audit status (CORRECTED)
The plan originally identified `'assignment'` and `'quiz'` as being emitted as audit `activityType` values. **This is incorrect.** These strings are `lmsAssessments.activityType` DB column values (`pgEnum`), NOT audit types. LMS assessment auditing goes through `AssessmentService` which correctly uses `assessment_created`, `assessment_updated`, and `assessment_deleted` from its `BaseServiceConfig`. No LMS-specific audit changes are needed — the existing `assessment_*` types are semantically correct.

## Typing gaps in platform layer
- `AuditOptions.activityType` is typed as `string`, not `ActivityType`.
- `BaseServiceConfig.activityTypes` uses `string` for create/update/delete values.
- The `resolve*ActivityType` helper functions in registry students service return `string`, not `ActivityType`.
- These prevent compile-time enforcement of catalog-valid types.

## Systemic gap: no fallback resolver in write path
`TABLE_OPERATION_MAP` maps `tableName:OPERATION` → `ActivityType` for most tables, but this mapping is never used in `BaseRepository.writeAuditLog()`. When a service fails to provide an explicit `activityType`, the audit row gets `null` instead of auto-resolving from the map. Wiring this as a fallback would provide a systemic safety net.

## Why this matters
Without intent-level activity types, operations like publish vs edit vs delete are collapsed into broad buckets, reducing audit trust, forensic usefulness, and manager analytics quality.
