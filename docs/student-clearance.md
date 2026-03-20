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
- Existing Library clearance rows remain in the database as historical data but do not participate in active clearance status, pending counters, approval workflows, or access decisions.
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

### 3. Preserve historical Library records without blocking workflows

Historical Library rows should remain queryable for audits and old request history, but they must be treated as legacy rows only.

Recommended behavior:

- Keep them stored unchanged.
- Exclude them from active status aggregation.
- Exclude them from pending counts and workflow gating.
- Hide them from current operational clearance UIs unless a dedicated historical view is later required.

## Implementation Plan

## Phase 1: Define the new business rules

Document and apply these rules consistently across repository, service, UI, and portal layers:

- Registration clearance is Finance-only.
- Graduation clearance is Finance plus Academic.
- Library has no approval, rejection, view, routing, or configuration role in clearance.
- Legacy Library rows are historical only and never required for completion.

Deliverables:

- Shared constants or narrowly scoped flow-specific department lists for registration and graduation.
- Removal of any code path that hardcodes `library` as an active clearance department.

## Phase 2: Registration clearance flow

Refactor registration request creation and update logic so Library clearance rows are no longer created or recreated.

Areas to update:

- Request creation logic that currently seeds Finance and Library rows.
- Request update logic that currently ensures both Finance and Library mappings exist.
- Any approval finalization logic or count logic that assumes two departments.

Expected result:

- New registration requests create one operational clearance row: Finance.
- Existing registration requests with historical Library rows continue to work because required-department evaluation only checks Finance.

## Phase 3: Graduation clearance flow

Refactor graduation clearance generation so the non-academic clearance requirement is Finance only.

Areas to update:

- Graduation request creation routines.
- Payment-backed graduation request creation routines.
- Any detail, summary, or approval code that assumes the clearance set is Finance plus Library plus Academic.

Expected result:

- New graduation requests create operational clearance rows for Finance and Academic only.
- Legacy Library rows remain historical and do not affect graduation approval state.

## Phase 4: Status aggregation and workflow gating

This is the highest-risk area and must be handled before UI cleanup is considered complete.

Current risk:

- Shared status helpers currently evaluate all related clearance rows.
- Detail pages and student portal views currently hardcode arrays that include Library.
- Preserved Library rows would keep old requests pending or display misleading waiting states.

Required changes:

- Replace all “evaluate every related clearance row” logic with “evaluate required departments for this flow only”.
- Update request detail tabs and proof-of-clearance gating to use the new required department sets.
- Update student portal clearance timelines to render only active departments.
- Update department-message views so legacy Library rejections do not appear as active blockers.

Expected result:

- Registration status is driven only by Finance.
- Graduation status is driven only by Finance and Academic.
- Old Library rows do not affect approval state, pending badges, or student messaging.

## Phase 5: Remove Library clearance operations and access

Remove Library from all clearance-specific access paths while leaving the Library module itself intact.

Areas to update:

- Registry navigation entries for registration clearance and auto-approvals.
- Any route-level role lists that include Library.
- Permission preset grants that give Library staff read, approve, or reject access for registration clearance or graduation clearance.
- Any page-level `dept` query parameter handling that still accepts `library`.

Expected result:

- Library staff cannot access clearance queues or clearance detail tabs through supported navigation.
- Library-specific clearance grants are removed from permission presets.
- Direct links using `dept=library` no longer resolve to an active department selection.

## Phase 6: Auto-approval redesign

The auto-approval feature currently treats Finance and Library as valid departments. That must be narrowed to Finance only for clearance.

Required changes:

- Remove Library from auto-approval service authorization shortcuts.
- Remove Library from create, update, delete, and bulk-import department validation.
- Remove Library from auto-approval form options and bulk import selectors.
- Review repository filtering and list logic so Finance remains the only operational clearance department.

Expected result:

- Auto-approvals can only be created and managed for Finance clearance.
- Existing Library auto-approval rules remain historical data or are ignored operationally, depending on repository filtering.

## Phase 7: Historical data handling

Because history must be retained, the rollout needs an explicit compatibility strategy.

Recommended approach:

- Do not delete old Library clearance rows.
- Do not create a destructive migration that rewrites history.
- Add read-model filtering so legacy Library rows are ignored for active flows.
- Decide whether legacy Library rows should still appear in admin-facing historical detail pages. Default recommendation: hide them from operational views to avoid confusion.

Optional follow-up, only if needed after rollout:

- Add a small “legacy clearance data exists” note for admins on old requests.
- Add a one-time report that identifies requests containing historical Library rows for verification.

## Phase 8: Cleanup of text, labels, and student messaging

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

- `src/app/registry/registration/requests/_server/requests/repository.ts`
- `src/app/registry/registration/requests/[id]/page.tsx`
- `src/app/registry/registration/requests/_components/ClearanceAccordion.tsx`
- `src/app/student-portal/registration/_components/request/ClearanceStatusView.tsx`
- `src/app/student-portal/registration/_components/request/DepartmentMessagesView.tsx`
- `src/app/student-portal/registration/_lib/status.ts`

### Graduation flow

- `src/app/registry/graduation/clearance/_server/requests/repository.ts`
- `src/app/registry/graduation/requests/[id]/page.tsx`
- `src/app/registry/graduation/requests/_components/GraduationClearanceAccordion.tsx`
- `src/app/student-portal/graduation/_components/request/GraduationClearanceView.tsx`

### Access and navigation

- `src/app/registry/registry.config.ts`
- `src/app/auth/permission-presets/_lib/catalog.ts`
- Any clearance actions/services that still allow Library-specific access paths

### Auto-approvals

- `src/app/registry/clearance/auto-approve/_server/service.ts`
- `src/app/registry/clearance/auto-approve/_components/Form.tsx`
- `src/app/registry/clearance/auto-approve/_components/BulkImportModal.tsx`

## Rollout Order

Recommended execution order:

1. Introduce explicit required-department definitions.
2. Update registration and graduation repositories to stop creating Library rows.
3. Update all status aggregation and gating logic so legacy rows are ignored.
4. Remove Library from clearance UI, navigation, and query-param handling.
5. Remove Library from auto-approval operations.
6. Remove clearance-specific permission grants for Library.
7. Run verification against old requests containing Library rows.

This order prevents a partial state where Library access is removed before old requests can still resolve correctly.

## Validation Checklist

The implementation should not be considered complete until all of the following are verified:

1. New registration requests create Finance clearance only.
2. New graduation requests create Finance and Academic clearance only.
3. Existing requests with old Library rows can still reach approved or rejected states correctly.
4. Student portal registration status no longer waits on Library.
5. Student portal graduation status no longer waits on Library.
6. Registry clearance pages no longer present Library as a selectable or rendered department.
7. Library users no longer have clearance-specific navigation or approval capability.
8. Auto-approval creation and bulk import reject any attempt to target Library.
9. Pending counters and badge counts match the new required-department rules.
10. Historical request data remains available for audit without affecting live workflows.

## Risks and Mitigations

### Risk: historical Library rows keep requests pending

Mitigation:

- Make required department sets explicit and use them everywhere status is computed.

### Risk: direct links or stale UI state still target `library`

Mitigation:

- Remove `library` from query-param handling and default department selection.

### Risk: Library retains hidden access through permission presets

Mitigation:

- Audit and remove clearance-specific grants from Library preset definitions and any role-based fallbacks.

### Risk: auto-approval rules silently continue to affect Library

Mitigation:

- Restrict valid clearance auto-approval departments to Finance only and ignore legacy Library rules operationally.

## Non-Goals

This plan does not propose:

- Removing the Library module itself.
- Deleting historical Library records.
- Redesigning the generic clearance schema unless implementation reveals a hard blocker.
- Changing non-clearance Library features such as loans, fines, or general Library permissions.

## Recommended Outcome

Implement this as a workflow redesign, not a destructive data cleanup. The key technical requirement is to stop treating “all related clearance rows” as the current workflow state. Once the active department set is explicit per flow, Library can be removed cleanly without breaking historical requests.
