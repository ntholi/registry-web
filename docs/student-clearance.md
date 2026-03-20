# Student Clearance Redesign Plan

## Objective

Completely remove Library from student clearance workflows so Finance is the only non-academic department that can clear students.

Approved scope for this redesign:

- Remove Library from both registration clearance and graduation clearance.
- Remove Resource and LEAP roles from clearance access (they are not clearance departments).
- Keep historical Library clearance records for audit/history purposes.
- Remove all clearance-specific Library access, navigation, auto-approval capability, and student-facing references.
- Fix the ClearanceSwitch department-overwrite bug discovered during analysis.

## Target State

After this redesign:

- Registration clearance requires Finance only.
- Graduation clearance requires Finance and Academic only.
- No new Library clearance rows are created for any student clearance request.
- Existing approved and rejected Library clearance rows remain in the database as historical data but do not participate in active clearance status, pending counters, approval workflows, or access decisions.
- Existing pending Library clearance rows are deleted via a one-time migration; they represent unanswered requests to a department that no longer participates in clearance.
- Students who were rejected by Library are migrated into `blocked_students` with `byDepartment = 'registry'` and the original rejection reason.
- Library, Resource, and LEAP users no longer see or manage any clearance-specific screens, badges, or auto-approval rules.
- The `emailSent` column is removed from the clearance table (never implemented).

## Data Summary (from production analysis)

Current clearance row counts by department and status:

| Department | Pending | Approved | Rejected | Total |
|-----------|---------|----------|----------|-------|
| finance | 95 | 12,895 | 78 | 13,068 |
| library | 7 | 13,001 | 1 | 13,009 |
| academic | 336 | 907 | 0 | 1,243 |

Migration impact:
- **7** pending Library clearance rows to delete.
- **1** student with a Library rejection ("Book not returned.") to migrate to `blocked_students`.
- **13,001** approved + **1** rejected Library rows preserved as historical data.

## Current Footprint

The current clearance model is shared across multiple flows, so this change is broader than a single page or role update.

Primary touchpoints already tied to Library:

- Registration request clearance creation and reset logic (`createWithModules`, `updateWithModules`).
- Graduation request clearance creation logic (`create`, `createWithPaymentReceipts`).
- Clearance detail pages and accordion views that hardcode department arrays.
- Student portal clearance timelines and overall status helpers.
- Registry navigation `roles` arrays including `library`, `resource`, and `leap`.
- Auto-approval service permissions and department selection UI.
- Permission preset grants for Library, Resource clearance access.
- `ClearanceSwitch` and `GraduationClearanceSwitch` components that overwrite the clearance `department` column on update (bug).
- `ProofOfClearancePDF` text referencing "library obligations".
- `ClearanceComments` quick-comment chip "Library Fines Owing".
- Three separate status aggregation functions that evaluate ALL clearance rows without filtering by required departments.

## Core Design Decisions

### 1. Keep the shared `clearance` table

Do not redesign the clearance schema as part of this change. The existing shared table is sufficient if the application stops generating Library rows and stops treating historical Library rows as required approvals.

### 2. Redefine required departments in code

The active department set must become explicit per flow:

- Registration: `['finance']`
- Graduation: `['finance', 'academic']`

This must replace any logic that infers required clearance state from all related rows, otherwise historical Library rows will keep requests pending forever.

### 3. Preserve approved and rejected Library records; delete pending ones

Historical Library rows with `approved` or `rejected` status remain queryable for audits and old request history, but must be treated as legacy rows only.

For `pending` Library rows — rows that represent unanswered requests to a department that no longer participates — the data has no audit value and actively misleads. They must be deleted by the migration.

Recommended behavior for `approved`/`rejected` rows:

- Keep them stored unchanged.
- Exclude them from active status aggregation.
- Exclude them from pending counts and workflow gating.
- Hide them from current operational clearance UIs unless a dedicated historical view is later required.

### 4. Migrate library-rejected students to blocked_students

Any student who has at least one `rejected` Library clearance row — in either registration or graduation clearance — must be inserted into `blocked_students` with:

- `byDepartment = 'registry'`
- `reason` = the rejection message from their most recent Library rejection (fallback: `'Library clearance rejected'`)
- `status = 'blocked'`

If a student is already present in `blocked_students` with `status = 'blocked'`, skip the insert. If the student exists with `status = 'unblocked'` (admin previously handled them), the migration should still insert a new `blocked` row — this captures the Library rejection as a distinct blocking reason that registry must review. This migration covers all requests regardless of whether the registration/graduation request is open or closed.

### 5. `library` stays in the `dashboard_users` DB enum

Because the Library module itself is not removed, the `library` value must remain in the `dashboard_users` enum. Clearance workflows reference the enum at query time; filtering is done in application code, not via enum removal.

### 6. Consolidate duplicate status utilities

Three separate functions evaluate clearance status by iterating ALL clearance rows without filtering by required departments:

1. `getClearanceStatus()` in `src/app/student-portal/registration/_lib/status.ts`
2. `getClearanceStatus()` in `src/app/student-portal/graduation/_lib/status.ts`
3. `getStatusFromClearances()` in `src/app/registry/graduation/clearance/_server/requests/repository.ts` (line 472)

Additionally, `getOverallClearanceStatus()` is duplicated in both:
- `src/app/registry/registration/requests/[id]/page.tsx`
- `src/app/registry/graduation/requests/[id]/page.tsx`

All five must be updated to filter by required departments. The two `getClearanceStatus` functions and the two `getOverallClearanceStatus` functions should each be consolidated into a single shared utility at `src/app/registry/clearance/_lib/status.ts`.

### 7. Fix ClearanceSwitch department-overwrite bug

Both `ClearanceSwitch` (registration) and `GraduationClearanceSwitch` (graduation) pass `session.user.role as DashboardRole` as the `department` field in the update payload. The repository's `update()` method does `.set(data)` which writes ALL fields — including `department` — to the database.

This means when a user approves a clearance, the row's `department` column is overwritten with the approving user's role. Currently no corruption exists because users are segmented by role (finance sees finance clearances), but if a different role (e.g., admin) approved a clearance, the department would be overwritten.

Fix: The clearance repository's `update()` method must explicitly exclude `department` from the SET clause (department is immutable after creation). The Switch components should stop sending `department` in the update payload.

## Implementation Plan

## Phase 1: Define the new business rules and shared utilities

Document and apply these rules consistently across repository, service, UI, and portal layers:

- Registration clearance is Finance-only.
- Graduation clearance is Finance plus Academic.
- Library, Resource, and LEAP have no approval, rejection, view, routing, or configuration role in clearance.
- Legacy approved/rejected Library rows are historical only and never required for completion.
- Pending Library rows will be deleted by the data migration.

Deliverables:

- Shared constants in `src/app/registry/clearance/_lib/constants.ts`:
    - `REGISTRATION_CLEARANCE_DEPTS = ['finance'] as const`
    - `GRADUATION_CLEARANCE_DEPTS = ['finance', 'academic'] as const`
- Consolidated status utilities in `src/app/registry/clearance/_lib/status.ts`:
    - `getClearanceStatus(clearances, requiredDepts)` — filters to required departments, then evaluates.
    - `getOverallClearanceStatus(clearances, requiredDepts)` — for dashboard detail pages.
- Removal of any code path that hardcodes `library` as an active clearance department.

## Phase 2: Status aggregation, workflow gating, and bug fixes

**This phase MUST be completed before Phases 3 and 4.** Until status evaluation is restricted to required departments, any existing Library-rejected rows will block open requests the moment row-creation stops.

Current risk:

- Shared status helpers currently evaluate all related clearance rows.
- Detail pages and student portal views currently hardcode arrays that include Library.
- Preserved Library rows would keep old requests pending or display misleading waiting states.
- `findPreviousClearedRequest` checks `allApproved` across ALL clearances including historical Library rows. Students with a Library rejection permanently fail this check, forcing them through Finance clearance on every additional module request in the same term — even though Finance already cleared them.
- `finalizeIfAllApproved` checks ALL clearance rows to decide whether to finalize registration. Old requests with a Library rejection row will NEVER finalize even after Finance approves.
- `getStatusFromClearances()` in graduation repository evaluates all statuses without filtering.

Required changes:

- Replace all "evaluate every related clearance row" logic with "evaluate required departments for this flow only".
- **Fix `findPreviousClearedRequest`** (registration `repository.ts`): filter clearances to only `REGISTRATION_CLEARANCE_DEPTS` before evaluating `allApproved`. Restores the skip-clearance optimisation for Finance-cleared students.
- **Fix `finalizeIfAllApproved`** (registration clearance `repository.ts`): filter clearances to `REGISTRATION_CLEARANCE_DEPTS` before checking if all are approved. Without this, old requests with historical Library rows can never reach 'registered' status.
- Update the `allAutoApproved` check inside `createWithModules` to evaluate against required departments only.
- **Fix `getStatusFromClearances()`** (graduation request `repository.ts`, line 472): filter to `GRADUATION_CLEARANCE_DEPTS` before evaluating.
- Swap the duplicated `getClearanceStatus()` calls in `student-portal/registration/_lib/status.ts` and `student-portal/graduation/_lib/status.ts` to use the new consolidated utility from Phase 1 (passing the appropriate required departments constant).
- Swap the duplicated `getOverallClearanceStatus()` in `registration/requests/[id]/page.tsx` and `graduation/requests/[id]/page.tsx` to use the consolidated utility.
- Update request detail tabs and proof-of-clearance gating to use the new required department sets.
- Update student portal clearance timelines to render only active departments.
- Update department-message views so legacy Library rejections do not appear as active blockers.
- **Fix ClearanceSwitch department-overwrite bug**: Update both clearance repository `update()` methods (registration and graduation) to explicitly exclude `department` from the SET clause. Remove `department` from the update payload in `ClearanceSwitch.tsx` and `GraduationClearanceSwitch.tsx`.

Expected result:

- Registration status is driven only by Finance.
- Graduation status is driven only by Finance and Academic.
- Old Library rows do not affect approval state, pending badges, skip-clearance logic, finalization, or student messaging.
- Clearance `department` column is immutable after creation.

## Phase 3: Registration clearance flow

Refactor registration request creation and update logic so Library clearance rows are no longer created or recreated.

Areas to update:

- `createWithModules`: change `departments = ['finance', 'library']` to `departments = REGISTRATION_CLEARANCE_DEPTS`.
- `updateRequest` method (~line 850): the loop `for (const department of ['finance', 'library'] as const)` that ensures clearance rows exist must be updated to `REGISTRATION_CLEARANCE_DEPTS`. This loop runs on every request edit; leaving it unchanged would create new Library rows for students who edit existing registrations after the code change.
- Any approval finalization logic or count logic that assumes two departments.

Expected result:

- New registration requests create one operational clearance row: Finance.
- Editing an existing registration request no longer creates or recreates a Library clearance row.
- Existing requests with historical Library rows work correctly because Phase 2 was completed first.

## Phase 4: Graduation clearance flow

Refactor graduation clearance generation so the non-academic clearance requirement is Finance only.

Areas to update:

- `GraduationRequestRepository.create` (line 37): change the loop `for (const department of ['finance', 'library'])` to iterate only `['finance']`. Academic clearance is handled separately by `processAcademicClearance` and is not affected.
- `GraduationRequestRepository.createWithPaymentReceipts` (line 296): same change — this second creation method ALSO loops through `['finance', 'library']` and must be updated.
- Any detail, summary, or approval code that assumes the clearance set is Finance plus Library plus Academic.

Expected result:

- New graduation requests create operational clearance rows for Finance and Academic only.
- Legacy Library rows remain historical and do not affect graduation approval state.

## Phase 5: Remove Library, Resource, and LEAP from clearance operations and access

Remove Library, Resource, and LEAP from all clearance-specific access paths while leaving the Library module itself and Resource/LEAP roles intact for their other functions.

Areas to update:

- Registry navigation entries for registration clearance (`roles` array): remove `library`, `resource`, `leap` from `roles: ['finance', 'library', 'resource', 'leap']` → `roles: ['finance']`.
- Registry navigation entries for auto-approvals (`roles` array): remove `library` and `resource` → `roles: ['finance', 'admin']`.
- Registry navigation entries for graduation clearance: ensure only `finance` and `academic` have access.
- Registration clearance `layout.tsx`: verify that role filtering only serves finance.
- Graduation clearance `layout.tsx`: verify that role filtering serves only finance and academic.
- Graduation clearance detail `[id]/page.tsx`: verify tab visibility is correct (currently finance and academic only — confirm no library references).
- Permission preset grants: remove `registration-clearance` and `graduation-clearance` grants from Library preset. Remove `auto-approvals` CRUD from Library and Resource presets.
- Any page-level `dept` query parameter handling that still accepts `library`.

Expected result:

- Library, Resource, and LEAP staff cannot access clearance queues or clearance detail tabs through supported navigation.
- Library and Resource clearance grants are removed from permission presets.
- Only Finance can access registration clearance. Only Finance and Academic can access graduation clearance.
- Direct links using `dept=library` no longer resolve to an active department.

## Phase 6: Auto-approval redesign

The auto-approval feature currently treats Finance and Library as valid departments. That must be narrowed to Finance only for clearance.

Required changes:

- Remove Library from auto-approval service authorization shortcuts (`session?.user?.role === 'library'` checks in `get`, `findAll`, `create`, `update`, `delete`).
- Remove Resource from the same authorization shortcuts if present.
- Remove Library from create, update, delete, and bulk-import department validation.
- Remove Library from auto-approval form options (`{ value: 'library', label: 'Library' }` in `Form.tsx` and `BulkImportModal.tsx`).
- Existing Library auto-approval records in the database are left in place; with Library removed from all code paths, they are silently never applied.

Expected result:

- Auto-approvals can only be created and managed for Finance clearance.
- Existing Library auto-approval rules are silently ignored by the application.

## Phase 7: Data migration

This phase cleans up the existing database state. Delivered as a custom Drizzle SQL migration (`pnpm db:generate --custom`) so it executes automatically alongside the deployment.

### 7a — Delete pending Library clearance rows

Pending Library rows have no audit value and would confuse any future historical view.

```sql
-- Capture pending library clearance ids
CREATE TEMP TABLE _pending_lib AS
  SELECT id FROM clearance WHERE department = 'library' AND status = 'pending';

-- Remove junction records
DELETE FROM registration_clearance WHERE clearance_id IN (SELECT id FROM _pending_lib);
DELETE FROM graduation_clearance     WHERE clearance_id IN (SELECT id FROM _pending_lib);

-- Remove clearance rows
DELETE FROM clearance WHERE id IN (SELECT id FROM _pending_lib);
```

### 7b — Migrate library-rejected students to blocked_students

For any student with at least one `rejected` Library clearance row (registration or graduation), insert one `blocked_students` record with `by_department = 'registry'` and the most recent rejection message. Skip students already blocked (status = 'blocked'). Students with `status = 'unblocked'` (previously handled by admin) still get a new `blocked` row — the Library rejection must be explicitly reviewed.

```sql
INSERT INTO blocked_students (std_no, reason, by_department, status, created_at)
SELECT DISTINCT ON (all_rej.std_no)
  all_rej.std_no,
  COALESCE(all_rej.message, 'Library clearance rejected'),
  'registry',
  'blocked',
  NOW()
FROM (
  SELECT rr.std_no, c.message, c.response_date
    FROM clearance c
    JOIN registration_clearance rc ON rc.clearance_id = c.id
    JOIN registration_requests rr  ON rr.id = rc.registration_request_id
   WHERE c.department = 'library' AND c.status = 'rejected'
  UNION ALL
  SELECT sp.std_no, c.message, c.response_date
    FROM clearance c
    JOIN graduation_clearance gc ON gc.clearance_id = c.id
    JOIN graduation_requests gr   ON gr.id = gc.graduation_request_id
    JOIN student_programs sp      ON sp.id = gr.student_program_id
   WHERE c.department = 'library' AND c.status = 'rejected'
) AS all_rej
WHERE NOT EXISTS (
  SELECT 1 FROM blocked_students bs
   WHERE bs.std_no = all_rej.std_no AND bs.status = 'blocked'
)
ORDER BY all_rej.std_no, all_rej.response_date DESC NULLS LAST;
```

> Current data: only 1 student affected ("Book not returned.").

### 7c — Drop `emailSent` column from clearance table

The `emailSent` boolean column was never implemented (no code sets it to `true`). Remove it as cleanup.

```sql
ALTER TABLE clearance DROP COLUMN IF EXISTS email_sent;
```

Also remove `emailSent` from the clearance schema definition in `src/app/registry/clearance/_schema/clearance.ts`.

> Note: `by_department` in `blocked_students` is typed as plain `text`, which accepts `'registry'` as a value.

## Phase 8: Historical data handling

With pending rows deleted (Phase 7a) and rejected-student migration done (Phase 7b), the remaining historical Library rows have only `approved` or `rejected` status.

Approach:

- Do not delete approved or rejected Library clearance rows.
- Read-model filtering established in Phase 2 already excludes these rows from active workflows.
- Admin-facing historical detail pages that load all clearances may still surface Library rows; hide them from operational views by filtering on `department NOT IN ('library')` where displayed, unless a dedicated legacy-history tab is added later.

## Phase 9: Cleanup of text, labels, and student messaging

Remove Library-specific wording so the product language matches the new process.

Areas to update:

- `ClearanceAccordion.tsx` (registration) — change hardcoded `['finance', 'library']` to `REGISTRATION_CLEARANCE_DEPTS`.
- `GraduationClearanceAccordion.tsx` — change `['finance', 'library', 'academic']` to `GRADUATION_CLEARANCE_DEPTS`.
- `ClearanceStatusView.tsx` (student portal registration) — change `['finance', 'library']` to `REGISTRATION_CLEARANCE_DEPTS`.
- `GraduationClearanceView.tsx` (student portal graduation) — change `['academic', 'finance', 'library']` to `GRADUATION_CLEARANCE_DEPTS`.
- `DepartmentMessagesView.tsx` — verify it dynamically filters rejected clearances (no hardcoded library reference), but ensure legacy Library rejections are hidden from active views.
- `ProofOfClearancePDF.tsx` (student portal graduation) — change text from "All academic, financial, and library obligations have been satisfied" to "All academic and financial obligations have been satisfied".
- `ClearanceComments.tsx` — remove the `'Library Fines Owing'` quick-comment chip from the `QUICK_COMMENTS` array.
- Pending/waiting messages shown to students that mention Library.
- Any filters or badges that imply Library is part of the active approval chain.

Expected result:

- All operational UI consistently describes Finance as the only clearance department for registration, and Finance plus Academic for graduation.
- No references to Library clearance in student-facing or admin-facing operational views.

## Suggested File Groups

### New files to create

- `src/app/registry/clearance/_lib/constants.ts` — `REGISTRATION_CLEARANCE_DEPTS`, `GRADUATION_CLEARANCE_DEPTS`
- `src/app/registry/clearance/_lib/status.ts` — consolidated `getClearanceStatus()`, `getOverallClearanceStatus()`

### Registration flow

- `src/app/registry/registration/requests/_server/requests/repository.ts` — `createWithModules` (dept list), `updateWithModules` (dept loop ~line 844), `findPreviousClearedRequest` (allApproved filter), `allAutoApproved` check
- `src/app/registry/registration/requests/_server/clearance/repository.ts` — `finalizeIfAllApproved` (filter to required depts), `update()` (exclude department from SET)
- `src/app/registry/registration/requests/[id]/page.tsx` — swap to consolidated `getOverallClearanceStatus`
- `src/app/registry/registration/requests/_components/ClearanceAccordion.tsx` — use `REGISTRATION_CLEARANCE_DEPTS`
- `src/app/registry/registration/clearance/_components/ClearanceSwitch.tsx` — remove `department` from update payload
- `src/app/student-portal/registration/_components/request/ClearanceStatusView.tsx` — use `REGISTRATION_CLEARANCE_DEPTS`
- `src/app/student-portal/registration/_components/request/DepartmentMessagesView.tsx` — filter out Library rejections
- `src/app/student-portal/registration/_lib/status.ts` — swap to consolidated util

### Graduation flow

- `src/app/registry/graduation/clearance/_server/requests/repository.ts` — `create` dept loop (line 37), `createWithPaymentReceipts` dept loop (line 296), `getStatusFromClearances` (line 472)
- `src/app/registry/graduation/clearance/_server/clearance/repository.ts` — `update()` (exclude department from SET)
- `src/app/registry/graduation/clearance/_components/GraduationClearanceSwitch.tsx` — remove `department` from update payload
- `src/app/registry/graduation/requests/[id]/page.tsx` — swap to consolidated `getOverallClearanceStatus`
- `src/app/registry/graduation/requests/_components/GraduationClearanceAccordion.tsx` — use `GRADUATION_CLEARANCE_DEPTS`
- `src/app/student-portal/graduation/_components/request/GraduationClearanceView.tsx` — use `GRADUATION_CLEARANCE_DEPTS`
- `src/app/student-portal/graduation/_components/ProofOfClearancePDF.tsx` — remove "library obligations" text
- `src/app/student-portal/graduation/_lib/status.ts` — swap to consolidated util

### Access, navigation, and permissions

- `src/app/registry/registry.config.ts` — remove `library`, `resource`, `leap` from clearance nav roles
- `src/app/auth/permission-presets/_lib/catalog.ts` — remove clearance grants from Library preset, remove `auto-approvals` from Library and Resource presets
- `src/app/registry/registration/clearance/layout.tsx` — verify finance-only access
- `src/app/registry/graduation/clearance/layout.tsx` — verify finance/academic-only access
- `src/app/registry/graduation/clearance/[id]/page.tsx` — verify tab visibility

### Auto-approvals

- `src/app/registry/clearance/auto-approve/_server/service.ts` — remove Library/Resource role checks
- `src/app/registry/clearance/auto-approve/_components/Form.tsx` — remove Library department option
- `src/app/registry/clearance/auto-approve/_components/BulkImportModal.tsx` — remove Library department option

### Shared/cleanup

- `src/app/registry/_components/ClearanceComments.tsx` — remove 'Library Fines Owing' chip
- `src/app/registry/clearance/_schema/clearance.ts` — remove `emailSent` column

### Data migration

- `drizzle/<next-migration-number>_library-clearance-cleanup.sql` (generated via `pnpm db:generate --custom`)

## Rollout Order

Recommended execution order:

1. Create shared constants and consolidated status utilities (Phase 1).
2. Fix all status aggregation, workflow gating, `findPreviousClearedRequest`, `finalizeIfAllApproved`, ClearanceSwitch bug, and `getStatusFromClearances` to use required departments only (Phase 2 must land before Phases 3 and 4).
3. Update registration repository to stop creating Library rows in both `createWithModules` and `updateWithModules` (Phase 3).
4. Update graduation repository to stop creating Library rows in both `create` and `createWithPaymentReceipts` (Phase 4).
5. Remove Library, Resource, and LEAP from clearance UI, navigation, and query-param handling (Phase 5).
6. Remove Library and Resource from auto-approval operations (Phase 6).
7. Remove clearance-specific permission grants for Library and Resource.
8. Run the data migration: delete pending Library rows, create `blocked_students` entries, drop `emailSent` column (Phase 7).
9. Clean up all text, labels, PDF content, quick-comment chips, and student-facing messages (Phase 9).
10. Validate against old requests containing Library rows using the checklist below.

This order prevents a partial state where Library access is removed before old requests can still resolve correctly.

## Validation Checklist

The implementation should not be considered complete until all of the following are verified:

1. New registration requests create Finance clearance only.
2. New graduation requests create Finance and Academic clearance only.
3. Existing requests with old Library rows can reach approved or registered states correctly without Library participation.
4. Student portal registration status no longer waits on Library.
5. Student portal graduation status no longer waits on Library.
6. Registry clearance pages no longer present Library as a selectable or rendered department.
7. Library, Resource, and LEAP users no longer have clearance-specific navigation or approval capability.
8. Auto-approval creation and bulk import reject any attempt to target Library.
9. Pending counters and badge counts match the new required-department rules.
10. Historical approved/rejected request data remains available for audit without affecting live workflows.
11. `findPreviousClearedRequest` correctly skips clearance for students who Finance already cleared this term, even if they have historical Library rejections.
12. `finalizeIfAllApproved` correctly finalizes registration when Finance approves, ignoring historical Library rows.
13. Editing an existing registration request does not create a new Library clearance row.
14. All pending Library clearance rows have been deleted from the database (migration 7a verified).
15. All students with Library rejections appear in `blocked_students` with `by_department = 'registry'` (migration 7b verified).
16. The `emailSent` column has been dropped from the clearance table (migration 7c verified).
17. The data migration ran without errors and no pending Library rows remain.
18. `ClearanceSwitch` and `GraduationClearanceSwitch` no longer send `department` in the update payload.
19. Graduation Proof of Clearance PDF no longer mentions "library obligations".
20. "Library Fines Owing" chip is removed from clearance comments.
21. `getClearanceStatus` and `getOverallClearanceStatus` are consolidated into single shared utilities.

## Risks and Mitigations

### Risk: historical Library rows keep requests pending or block finalization

Mitigation:

- Phase 2 explicitly targets `finalizeIfAllApproved`, `findPreviousClearedRequest`, `getStatusFromClearances`, and all status aggregation helpers. All are updated to filter by required departments only.

### Risk: `updateWithModules` re-creates Library clearance rows when students edit existing registrations

Mitigation:

- Update the dept loop in the update path to `REGISTRATION_CLEARANCE_DEPTS` in Phase 3. Both the create and update paths must be patched together.

### Risk: `createWithPaymentReceipts` still creates Library clearance rows for graduation

Mitigation:

- Phase 4 now explicitly lists both `create` and `createWithPaymentReceipts` as targets.

### Risk: direct links or stale UI state still target `library`

Mitigation:

- Permission removal blocks access at the auth layer. Navigation removal prevents discovery. Phase 2's filtering prevents Library data from affecting status.

### Risk: ClearanceSwitch overwrites clearance department column

Mitigation:

- Phase 2 fixes both Switch components to stop sending `department` in update payloads, and fixes both clearance repository `update()` methods to exclude `department` from the SET clause.

### Risk: Resource/LEAP users retain clearance access

Mitigation:

- Phase 5 removes these roles from navigation. Phase 5 removes their permission grants. The `withPermission('dashboard')` check remains but prevents access when grants are revoked.

### Risk: Library retains hidden access through permission presets

Mitigation:

- Audit and remove clearance-specific grants from Library preset definitions and any role-based fallbacks.

### Risk: auto-approval rules silently continue to affect Library

Mitigation:

- Restrict valid clearance auto-approval departments to Finance only; Library auto-approval records in the DB are never applied once Library is removed from service code.

### Risk: data migration fails on large datasets mid-transaction

Mitigation:

- The 7a deletion cascades through junction tables; test in a staging environment before production. The 7b insert uses `ON CONFLICT DO NOTHING` and a `NOT EXISTS` guard so it is safe to re-run.

## Non-Goals

This plan does not propose:

- Removing the Library module itself.
- Deleting approved or rejected historical Library clearance records.
- Redesigning the generic clearance schema unless implementation reveals a hard blocker.
- Changing non-clearance Library features such as loans, fines, or general Library permissions.
- Removing `library` from the `dashboard_users` DB enum (Library users still authenticate and use non-clearance features).

## Recommended Outcome

Implement this as a workflow redesign, not a destructive data cleanup. The key technical requirement is to stop treating “all related clearance rows” as the current workflow state. Once the active department set is explicit per flow, Library can be removed cleanly without breaking historical requests.
