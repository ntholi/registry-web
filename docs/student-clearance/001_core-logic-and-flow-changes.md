# Plan 1: Core Logic and Flow Changes

**Phases 1–4** | **~2.25 hours** | **~12 file edits + 2 new files**

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
    - `ClearanceDept` type derived from the constants for type safety.
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
- **Fix `getStatusFromClearances()` call site** (graduation request `repository.ts`, ~line 530): the method itself only receives a `statuses[]` array and has no department awareness. The fix must happen at the **call site** — filter the `graduationClearances` array to only `GRADUATION_CLEARANCE_DEPTS` before mapping statuses and passing to `getStatusFromClearances()`. The method itself remains unchanged.
- Swap the duplicated `getClearanceStatus()` calls in `student-portal/registration/_lib/status.ts` and `student-portal/graduation/_lib/status.ts` to use the new consolidated utility from Phase 1 (passing the appropriate required departments constant).
- Swap the duplicated `getOverallClearanceStatus()` in `registration/requests/[id]/page.tsx` and `graduation/requests/[id]/page.tsx` to use the consolidated utility.
- Update request detail tabs and proof-of-clearance gating to use the new required department sets.
- Update student portal clearance timelines to render only active departments.
- **Fix ClearanceSwitch department-overwrite bug**: Update both clearance repository `update()` methods (registration and graduation) to explicitly exclude `department` from the SET clause. Remove `department` from the update payload in `ClearanceSwitch.tsx` and `GraduationClearanceSwitch.tsx`.
- **Add service-level department validation**: In both registration and graduation clearance services, verify that the session user's role matches the clearance row's stored `department` before allowing approve/reject. This prevents cross-department actions via direct API calls (e.g., a finance user approving an academic clearance).
- **Fix graduation clearance detail TabsPanel bug**: In `src/app/registry/graduation/clearance/[id]/page.tsx`, `<TabsPanel value='academics'>` is incorrectly nested inside `<TabsPanel value='finance'>`, preventing the Academics tab from rendering. Move it to be a sibling of the finance panel.

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

## File Groups (Phases 1–4)

### New files to create

- `src/app/registry/clearance/_lib/constants.ts` — `REGISTRATION_CLEARANCE_DEPTS`, `GRADUATION_CLEARANCE_DEPTS`
- `src/app/registry/clearance/_lib/status.ts` — consolidated `getClearanceStatus()`, `getOverallClearanceStatus()`

### Registration flow

- `src/app/registry/registration/requests/_server/requests/repository.ts` — `createWithModules` (dept list), `updateWithModules` (dept loop ~line 844), `findPreviousClearedRequest` (allApproved filter), `allAutoApproved` check
- `src/app/registry/registration/requests/_server/clearance/repository.ts` — `finalizeIfAllApproved` (filter to required depts), `update()` (exclude department from SET)
- `src/app/registry/registration/requests/_server/clearance/service.ts` — add department validation (session role must match clearance.department)
- `src/app/registry/registration/requests/[id]/page.tsx` — swap to consolidated `getOverallClearanceStatus`
- `src/app/registry/registration/clearance/_components/ClearanceSwitch.tsx` — remove `department` from update payload
- `src/app/student-portal/registration/_components/request/ClearanceStatusView.tsx` — use `REGISTRATION_CLEARANCE_DEPTS`
- `src/app/student-portal/registration/_components/request/DepartmentMessagesView.tsx` — filter out Library rejections
- `src/app/student-portal/registration/_lib/status.ts` — swap to consolidated util

### Graduation flow

- `src/app/registry/graduation/clearance/_server/requests/repository.ts` — `create` dept loop (line 37), `createWithPaymentReceipts` dept loop (line 296), `getStatusFromClearances` call site (~line 530, filter `graduationClearances` before mapping)
- `src/app/registry/graduation/clearance/_server/clearance/repository.ts` — `update()` (exclude department from SET)
- `src/app/registry/graduation/clearance/_server/clearance/service.ts` — add department validation (session role must match clearance.department)
- `src/app/registry/graduation/clearance/_components/GraduationClearanceSwitch.tsx` — remove `department` from update payload
- `src/app/registry/graduation/requests/[id]/page.tsx` — swap to consolidated `getOverallClearanceStatus`
- `src/app/student-portal/graduation/_lib/status.ts` — swap to consolidated util

## Validation Checklist (Phases 1–4)

1. New registration requests create Finance clearance only (no Library row).
2. New graduation requests create Finance and Academic clearance only (no Library row).
3. Existing open requests with historical Library rows can reach approved/registered states correctly without Library participation.
4. Student portal registration status no longer waits on Library approval.
5. Student portal graduation status no longer waits on Library approval.
6. `findPreviousClearedRequest` correctly identifies Finance-cleared requests (ignores old Library rejections).
7. `finalizeIfAllApproved` correctly finalizes when Finance is approved (ignores old Library rows).
8. Clearance `department` column is immutable after creation (ClearanceSwitch bug fixed).
9. Service-level validation prevents cross-department approve/reject via direct API call.
10. Graduation clearance detail page Academics tab renders correctly (TabsPanel nesting fixed).
11. `ClearanceSwitch` and `GraduationClearanceSwitch` no longer send `department` in the update payload.
12. `getClearanceStatus` and `getOverallClearanceStatus` are consolidated into single shared utilities.
13. Editing an existing registration request does not recreate a Library clearance row.

## Risks (Phases 1–4)

### Risk: historical Library rows keep requests pending or block finalization

Mitigation: Phase 2 explicitly targets `finalizeIfAllApproved`, `findPreviousClearedRequest`, `getStatusFromClearances`, and all status aggregation helpers. All are updated to filter by required departments only.

### Risk: `updateWithModules` re-creates Library clearance rows when students edit existing registrations

Mitigation: Update the dept loop in the update path to `REGISTRATION_CLEARANCE_DEPTS` in Phase 3. Both the create and update paths must be patched together.

### Risk: `createWithPaymentReceipts` still creates Library clearance rows for graduation

Mitigation: Phase 4 now explicitly lists both `create` and `createWithPaymentReceipts` as targets.

### Risk: ClearanceSwitch overwrites clearance department column

Mitigation: Phase 2 fixes both Switch components to stop sending `department` in update payloads, and fixes both clearance repository `update()` methods to exclude `department` from the SET clause.
