# 001 — Current State Deepdive

## Objective
Make activity logging as specific and operation-accurate as possible across the codebase, avoiding generic labels.

## Files deeply analyzed
- `src/app/admin/activity-tracker/_lib/activity-catalog.ts`
- `src/app/admin/activity-tracker/_lib/activity-types.ts`
- `src/core/platform/BaseService.ts`
- `src/core/platform/BaseRepository.ts`
- `src/core/database/schema/auditLogs.ts`
- representative feature services/actions/repositories across registry, admin, admissions, lms, library, academic

## Main findings
1. `activityType` is stored for all current rows in `audit_logs` (no nulls in sampled DB).
2. `TABLE_OPERATION_MAP` and `resolveTableActivity` are effectively not used in write flow.
3. Several events are too generic or semantically incorrect for operation-level visibility.
4. There are emitted activity type values not present in the catalog, causing drift.
5. Some modules bypass effective semantic auditing patterns (especially admissions applicant submodules).

## Confirmed high-impact issues
- Generic LMS labels: `assignment`, `quiz`.
- Semantically wrong reuse:
  - task delete/status changes logged as `task_updated`.
  - notification delete logged as `notification_updated`.
- Missing in catalog but emitted:
  - `assignment`
  - `quiz`
  - `program_structure_update`

## Production data signal (sampled)
Top volume currently clusters around marks/clearance/student progression events. This means fine-grain improvements should preserve those existing categories while fixing low-volume but high-value operational specificity in admin/admissions/lms.

## Why this matters
Without intent-level activity types, operations like publish vs edit vs delete are collapsed into broad buckets, reducing audit trust, forensic usefulness, and manager analytics quality.
