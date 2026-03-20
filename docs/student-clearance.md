# Student Clearance Redesign Plan

## Objective

Completely remove Library from student clearance workflows so Finance is the only non-academic department that can clear students.

Approved scope for this redesign:

- Remove Library from both registration clearance and graduation clearance.
- Keep historical Library clearance records for audit/history purposes.
- Remove all clearance-specific Library access, navigation, auto-approval capability, and student-facing references.

## Target State

After this redesign:

- Registration clearance requires Finance only.
- Graduation clearance requires Finance and Academic only.
- No new Library clearance rows are created for any student clearance request.
- Existing approved and rejected Library clearance rows remain in the database as historical data but do not participate in active clearance status, pending counters, approval workflows, or access decisions.
- Existing pending Library clearance rows are deleted via a one-time migration; they represent unanswered requests to a department that no longer participates in clearance.
- Students who were rejected by Library are migrated into `blocked_students` with `byDepartment = 'registry'` and the original rejection reason.
- Library users no longer see or manage any clearance-specific screens, badges, or auto-approval rules.

## Current Footprint

The current clearance model is shared across multiple flows, so this change is broader than a single page or role update.

Primary touchpoints already tied to Library:

- Registration request clearance creation and reset logic.
- Graduation request clearance creation logic.
- Clearance detail pages and accordion views that hardcode department arrays.
- Student portal clearance timelines and overall status helpers.
- Registry navigation roles and pending notification entry points.
- Auto-approval service permissions and department selection UI.
- Permission preset grants for Library clearance access.

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

If a student is already present in `blocked_students`, skip the insert. This migration covers all requests regardless of whether the registration/graduation request is open or closed.

### 5. `library` stays in the `dashboard_users` DB enum

Because the Library module itself is not removed, the `library` value must remain in the `dashboard_users` enum. Clearance workflows reference the enum at query time; filtering is done in application code, not via enum removal.

## Implementation Plan

## Phase 1: Define the new business rules

Document and apply these rules consistently across repository, service, UI, and portal layers:

- Registration clearance is Finance-only.
- Graduation clearance is Finance plus Academic.
- Library has no approval, rejection, view, routing, or configuration role in clearance.
- Legacy approved/rejected Library rows are historical only and never required for completion.
- Pending Library rows will be deleted by the data migration.

Deliverables:

- A shared constant (e.g. `REGISTRATION_CLEARANCE_DEPTS = ['finance']` and `GRADUATION_CLEARANCE_DEPTS = ['finance', 'academic']`) placed in a location that both server and UI layers can import from.
- Removal of any code path that hardcodes `library` as an active clearance department.

## Phase 2: Status aggregation and workflow gating

**This phase MUST be completed before Phases 3 and 4.** Until status evaluation is restricted to required departments, any existing Library-rejected rows will block open requests the moment row-creation stops.

Current risk:

- Shared status helpers currently evaluate all related clearance rows.
- Detail pages and student portal views currently hardcode arrays that include Library.
- Preserved Library rows would keep old requests pending or display misleading waiting states.
- `findPreviousClearedRequest` checks `allApproved` across ALL clearances including historical Library rows. Students with a Library rejection permanently fail this check, forcing them through Finance clearance on every additional module request in the same term — even though Finance already cleared them.

Required changes:

- Replace all "evaluate every related clearance row" logic with "evaluate required departments for this flow only".
- **Fix `findPreviousClearedRequest`**: filter clearances to only `REGISTRATION_CLEARANCE_DEPTS` before evaluating `allApproved`. Restores the skip-clearance optimisation for Finance-cleared students.
- Update the `allAutoApproved` check inside `createWithModules` to evaluate against required departments only.
- Update request detail tabs and proof-of-clearance gating to use the new required department sets.
- Update student portal clearance timelines to render only active departments.
- Update department-message views so legacy Library rejections do not appear as active blockers.

Expected result:

- Registration status is driven only by Finance.
- Graduation status is driven only by Finance and Academic.
- Old Library rows do not affect approval state, pending badges, skip-clearance logic, or student messaging.

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

- `GraduationRequestRepository.create`: change the loop `for (const department of ['finance', 'library'])` to iterate only `['finance']`. Academic clearance is handled separately by `processAcademicClearance` and is not affected.
- Any detail, summary, or approval code that assumes the clearance set is Finance plus Library plus Academic.

Expected result:

- New graduation requests create operational clearance rows for Finance and Academic only.
- Legacy Library rows remain historical and do not affect graduation approval state.

## Phase 5: Remove Library clearance operations and access

Remove Library from all clearance-specific access paths while leaving the Library module itself intact.

Areas to update:

- Registry navigation entries for registration clearance and auto-approvals (`roles` arrays).
- Any route-level role lists that include Library.
- Permission preset grants that give Library staff read, approve, or reject access for registration or graduation clearance.
- Any page-level `dept` query parameter handling that still accepts `library`.

Expected result:

- Library staff cannot access clearance queues or clearance detail tabs through supported navigation.
- Library-specific clearance grants are removed from permission presets.
- Direct links using `dept=library` no longer resolve to an active department selection.

## Phase 6: Auto-approval redesign

The auto-approval feature currently treats Finance and Library as valid departments. That must be narrowed to Finance only for clearance.

Required changes:

- Remove Library from auto-approval service authorization shortcuts (`session?.user?.role === 'library'` checks in `get`, `findAll`, `create`, `update`, `delete`).
- Remove Library from create, update, delete, and bulk-import department validation.
- Remove Library from auto-approval form options and bulk import selectors.
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

For any student with at least one `rejected` Library clearance row (registration or graduation), insert one `blocked_students` record with `by_department = 'registry'` and the most recent rejection message. Skip students already blocked.

```sql
-- Collect all library rejections from both flows, pick most recent reason per student
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

> Note: `by_department` in `blocked_students` is typed to the `dashboard_users` enum which includes `'registry'` as a valid value.

## Phase 8: Historical data handling

With pending rows deleted (Phase 7a) and rejected-student migration done (Phase 7b), the remaining historical Library rows have only `approved` or `rejected` status.

Approach:

- Do not delete approved or rejected Library clearance rows.
- Read-model filtering established in Phase 2 already excludes these rows from active workflows.
- Admin-facing historical detail pages that load all clearances may still surface Library rows; hide them from operational views by filtering on `department NOT IN ('library')` where displayed, unless a dedicated legacy-history tab is added later.

## Phase 9: Cleanup of text, labels, and student messaging

Remove Library-specific wording so the product language matches the new process.

Areas to update:

- Clearance accordions and timelines.
- Pending/waiting messages shown to students.
- Any comments, labels, or helper text that mention Library clearance as an actionable department.
- Any filters or badges that imply Library is part of the active approval chain.

Expected result:

- All operational UI consistently describes Finance as the only clearance department for registration, and Finance plus Academic for graduation.

## Suggested File Groups

Likely implementation groups to touch during execution:

### Registration flow

- `src/app/registry/registration/requests/_server/requests/repository.ts` — `createWithModules` (dept list), `updateRequest` (dept loop ~line 850), `findPreviousClearedRequest` (allApproved filter), `allAutoApproved` check
- `src/app/registry/registration/requests/[id]/page.tsx`
- `src/app/registry/registration/requests/_components/ClearanceAccordion.tsx`
- `src/app/student-portal/registration/_components/request/ClearanceStatusView.tsx`
- `src/app/student-portal/registration/_components/request/DepartmentMessagesView.tsx`
- `src/app/student-portal/registration/_lib/status.ts`

### Graduation flow

- `src/app/registry/graduation/clearance/_server/requests/repository.ts` — `create` dept loop
- `src/app/registry/graduation/clearance/_server/clearance/repository.ts` — `findByDepartment` dept filtering
- `src/app/registry/graduation/requests/[id]/page.tsx`
- `src/app/registry/graduation/requests/_components/GraduationClearanceAccordion.tsx`
- `src/app/student-portal/graduation/_components/request/GraduationClearanceView.tsx`

### Access and navigation

- `src/app/registry/registry.config.ts`
- `src/app/auth/permission-presets/_lib/catalog.ts`
- Any clearance actions/services that still allow Library-specific access paths

### Auto-approvals

- `src/app/registry/clearance/auto-approve/_server/service.ts`
- `src/app/registry/clearance/auto-approve/_server/repository.ts`
- `src/app/registry/clearance/auto-approve/_components/Form.tsx`
- `src/app/registry/clearance/auto-approve/_components/BulkImportModal.tsx`

### Data migration

- `drizzle/<next-migration-number>_library-clearance-cleanup.sql` (generated via `pnpm db:generate --custom`)

## Rollout Order

Recommended execution order:

1. Introduce explicit required-department constants (`REGISTRATION_CLEARANCE_DEPTS`, `GRADUATION_CLEARANCE_DEPTS`).
2. Fix all status aggregation, workflow gating, and `findPreviousClearedRequest` logic to use required departments only (Phase 2 must land before Phases 3 and 4).
3. Update registration repository to stop creating Library rows in both `createWithModules` and `updateRequest` (Phase 3).
4. Update graduation repository to stop creating Library rows (Phase 4).
5. Remove Library from clearance UI, navigation, and query-param handling (Phase 5).
6. Remove Library from auto-approval operations (Phase 6).
7. Remove clearance-specific permission grants for Library.
8. Run the data migration: delete pending Library rows, create `blocked_students` entries for library-rejected students (Phase 7).
9. Clean up all text, labels, and student-facing messages (Phase 9).
10. Validate against old requests containing Library rows using the checklist below.

This order prevents a partial state where Library access is removed before old requests can still resolve correctly.

## Validation Checklist

The implementation should not be considered complete until all of the following are verified:

1. New registration requests create Finance clearance only.
2. New graduation requests create Finance and Academic clearance only.
3. Existing requests with old Library rows can reach approved or rejected states correctly without Library participation.
4. Student portal registration status no longer waits on Library.
5. Student portal graduation status no longer waits on Library.
6. Registry clearance pages no longer present Library as a selectable or rendered department.
7. Library users no longer have clearance-specific navigation or approval capability.
8. Auto-approval creation and bulk import reject any attempt to target Library.
9. Pending counters and badge counts match the new required-department rules.
10. Historical approved/rejected request data remains available for audit without affecting live workflows.
11. `findPreviousClearedRequest` correctly skips clearance for students who Finance already cleared this term, even if they have historical Library rejections.
12. Editing an existing registration request does not create a new Library clearance row.
13. All pending Library clearance rows have been deleted from the database (migration 7a verified).
14. All students with Library rejections appear in `blocked_students` with `by_department = 'registry'` (migration 7b verified).
15. The data migration ran without errors and no pending Library rows remain.

## Risks and Mitigations

### Risk: historical Library rows keep requests pending

Mitigation:

- Make required department sets explicit and use them everywhere status is computed.

### Risk: `findPreviousClearedRequest` breaks skip-clearance for students with Library rejections

Mitigation:

- Fix the method to only evaluate clearances for required departments (Finance for registration) before calling `allApproved`. Covered explicitly in Phase 2.

### Risk: `updateRequest` re-creates Library clearance rows when students edit existing registrations

Mitigation:

- Update the dept loop in the update path to `REGISTRATION_CLEARANCE_DEPTS` in Phase 3. Both the create and update paths must be patched together.

### Risk: direct links or stale UI state still target `library`

Mitigation:

- Remove `library` from query-param handling and default department selection.

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
