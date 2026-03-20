# Plan 1: Core Logic and Flow Changes

**Phases 1-4** | **~12 file edits + 2 new files**

## Phase 1: Define the new business rules and shared utilities

Document and apply these rules consistently across repository, service, UI, and portal layers:

- Registration clearance is Finance-only.
- Graduation clearance is Finance plus Academic.
- Library, Resource, and LEAP have no approval, rejection, view, routing, or configuration role in clearance.
- Legacy approved/rejected Library rows are historical only and never required for completion.
- Pending Library rows will be deleted by the data migration.

Deliverables:

- Shared constants in ``src/app/registry/clearance/_lib/constants.ts``:
    - ``REGISTRATION_CLEARANCE_DEPTS = ['finance'] as const``
    - ``GRADUATION_CLEARANCE_DEPTS = ['finance', 'academic'] as const``
    - ``ClearanceDept`` type derived from the union of both constants for type safety.
- Consolidated status utilities in ``src/app/registry/clearance/_lib/status.ts``:
    - ``getClearanceStatus(clearances, requiredDepts)`` -- filters to required departments, then evaluates.
    - ``getOverallClearanceStatus(clearances, requiredDepts)`` -- for dashboard detail pages.
- Removal of any code path that hardcodes ``library`` as an active clearance department.

## Phase 2: Status aggregation, workflow gating, and bug fixes

**This phase MUST be completed before Phases 3 and 4.** Until status evaluation is restricted to required departments, any existing Library-rejected rows will block open requests the moment row-creation stops.

Current risk:

- Shared status helpers currently evaluate all related clearance rows.
- Detail pages and student portal views currently hardcode arrays that include Library.
- Preserved Library rows would keep old requests pending or display misleading waiting states.
- ``finalizeIfAllApproved`` checks ALL clearance rows to decide whether to finalize registration. Old requests with a Library rejection row will NEVER finalize even after Finance approves.
- ``getStatusFromClearances()`` in graduation repository evaluates all statuses without filtering.

Required changes:

### 2a -- Registration clearance repository (``requests/_server/clearance/repository.ts``)

- **Fix ``finalizeIfAllApproved``** (~line 183): After fetching ``allClearances`` via ``tx.query.registrationClearance.findMany(...)``, filter to only ``REGISTRATION_CLEARANCE_DEPTS`` before the ``every(approved)`` check:
    ```
    const relevantClearances = allClearances.filter(
      c => REGISTRATION_CLEARANCE_DEPTS.includes(c.clearance.department)
    );
    const allApproved = relevantClearances.every(c => c.clearance.status === 'approved');
    ```
- **Fix ``update()`` method** (~line 115): The ``.set(data)`` call passes the entire data object including ``department``. Destructure out ``department`` before passing to SET:
    ```
    const { department: _dept, ...updateData } = data;
    .set(updateData)
    ```
    This is the repository-level guard against the ClearanceSwitch overwrite bug.

### 2b -- Registration requests repository (``requests/_server/requests/repository.ts``)

- **``allAutoApproved`` check** (~line 506): Already evaluates against ``departments`` array. Will be correct once ``departments`` is changed to ``REGISTRATION_CLEARANCE_DEPTS`` in Phase 3. No separate fix needed here.
- **Leave ``findPreviousClearedRequest``** (~line 284): Per decision, this will NOT be filtered. Students will always go through finance clearance even if previously cleared. The skip-clearance optimization stays broken for students with historical library rejections. This is accepted behavior.

### 2c -- Graduation clearance repository (``graduation/clearance/_server/clearance/repository.ts``)

- **Fix ``update()`` method** (~line 65): Same fix as registration -- destructure out ``department`` before ``.set()``:
    ```
    const { department: _dept, ...updateData } = data;
    .set(updateData)
    ```

### 2d -- Graduation requests repository (``graduation/clearance/_server/requests/repository.ts``)

- **Fix ``getStatusFromClearances`` call sites**: The method itself is private and generic (takes ``statuses[]``). The fix must happen at **all call sites** where ``graduationClearances`` are mapped to statuses. Filter ``graduationClearances`` to only ``GRADUATION_CLEARANCE_DEPTS`` **at the query level** -- add a filter to the Drizzle queries that fetch ``graduationClearances``, so library rows never enter the pipeline. Specifically:
    - The ``findByStatus`` method's query that fetches graduation requests with clearances.
    - The ``findAllPaginated`` method similarly.
    - Any other method that fetches ``graduationClearances`` and maps to statuses.

### 2e -- Service-level department validation

- **Registration clearance service** (``requests/_server/clearance/service.ts``): In the ``respond()`` and ``update()`` methods, after fetching the current clearance row, verify that ``session.user.role === current.department`` OR ``session.user.role === 'admin'``. Throw if mismatched. This prevents cross-department approve/reject via direct API calls.
- **Graduation clearance service** (``graduation/clearance/_server/clearance/service.ts``): Same validation in the ``update()`` method.

### 2f -- Student portal status consolidation

- **``src/app/student-portal/registration/_lib/status.ts``**: Replace the local ``getClearanceStatus()`` with the consolidated utility from Phase 1. Pass ``REGISTRATION_CLEARANCE_DEPTS``.
- **``src/app/student-portal/graduation/_lib/status.ts``**: Replace the local ``getClearanceStatus()`` with the consolidated utility. Pass ``GRADUATION_CLEARANCE_DEPTS``. Also update ``getGraduationStatus()`` which calls ``getClearanceStatus()`` internally.

### 2g -- Dashboard detail pages status consolidation

- **``src/app/registry/registration/requests/[id]/page.tsx``**: Replace the local ``getOverallClearanceStatus()`` function and the hardcoded ``departments: DashboardRole[] = ['finance', 'library']`` with the consolidated utility from Phase 1. Also remove ``type ClearanceDept = 'finance' | 'library'`` and the ``deptParam`` handling that accepts ``'library'``.
- **``src/app/registry/graduation/requests/[id]/page.tsx``**: Replace the local ``getOverallClearanceStatus()`` and ``departments: DashboardRole[] = ['finance', 'library', 'academic']`` with the consolidated utility. Also remove ``type ClearanceDept = 'finance' | 'library' | 'academic'`` and update ``deptParam`` handling to only accept ``'finance'`` and ``'academic'``.

### 2h -- Student portal clearance views

- **``src/app/student-portal/registration/_components/request/ClearanceStatusView.tsx``**: Change ``departments = ['finance', 'library']`` to use ``REGISTRATION_CLEARANCE_DEPTS`` constant.
- **``src/app/student-portal/graduation/_components/request/GraduationClearanceView.tsx``**: Change ``departments = ['academic', 'finance', 'library']`` to use ``GRADUATION_CLEARANCE_DEPTS`` constant.

### 2i -- Fix graduation clearance detail TabsPanel bug

- **``src/app/registry/graduation/clearance/[id]/page.tsx``**: ``<TabsPanel value='academics'>`` is incorrectly nested inside ``<TabsPanel value='finance'>``. Move it to be a sibling of the finance panel. This is an existing rendering bug -- the Academics tab does not appear when clicked.

Expected result:

- Registration status is driven only by Finance.
- Graduation status is driven only by Finance and Academic.
- Old Library rows do not affect approval state, pending badges, finalization, or student messaging.
- Clearance ``department`` column cannot be overwritten via update (repository-level guard).
- Cross-department approve/reject blocked at service level (admin exempted).

## Phase 3: Registration clearance flow

Refactor registration request creation and update logic so Library clearance rows are no longer created or recreated.

Areas to update:

- **``createWithModules``** (~line 487): Change ``departments = ['finance', 'library']`` to ``departments = REGISTRATION_CLEARANCE_DEPTS``. Also update the type annotation from ``('finance' | 'library')[]`` to use ``ClearanceDept[]`` or infer from the constant.
- **``updateWithModules``** (~line 644): The loop ``for (const department of ['finance', 'library'] as const)`` must be updated to ``REGISTRATION_CLEARANCE_DEPTS``. This loop runs on every request edit; leaving it unchanged would create new Library rows for students who edit existing registrations.
- The ``allAutoApproved`` check (~line 506) works against the ``departments`` array, so fixing the array in ``createWithModules`` automatically fixes this.

Expected result:

- New registration requests create one operational clearance row: Finance.
- Editing an existing registration request no longer creates or recreates a Library clearance row.
- Existing requests with historical Library rows work correctly because Phase 2 was completed first.

## Phase 4: Graduation clearance flow

Refactor graduation clearance generation so the non-academic clearance requirement is Finance only.

Areas to update:

- **``GraduationRequestRepository.create``** (~line 37): Change ``for (const department of ['finance', 'library'])`` to iterate only ``['finance']``. Academic clearance is handled separately by ``processAcademicClearance`` and is not affected.
- **``GraduationRequestRepository.createWithPaymentReceipts``** (~line 305): Same change -- this second creation method ALSO loops through ``['finance', 'library']`` and must be updated.

Expected result:

- New graduation requests create operational clearance rows for Finance and Academic only.
- Legacy Library rows remain historical and do not affect graduation approval state.

## File Groups (Phases 1-4)

### New files to create

- ``src/app/registry/clearance/_lib/constants.ts`` -- ``REGISTRATION_CLEARANCE_DEPTS``, ``GRADUATION_CLEARANCE_DEPTS``, ``ClearanceDept``
- ``src/app/registry/clearance/_lib/status.ts`` -- consolidated ``getClearanceStatus()``, ``getOverallClearanceStatus()``

### Registration flow

- ``src/app/registry/registration/requests/_server/requests/repository.ts`` -- ``createWithModules`` (dept array ~L487), ``updateWithModules`` (dept loop ~L644)
- ``src/app/registry/registration/requests/_server/clearance/repository.ts`` -- ``finalizeIfAllApproved`` (filter to required depts ~L183), ``update()`` (exclude department from SET ~L115)
- ``src/app/registry/registration/requests/_server/clearance/service.ts`` -- add department validation in ``respond()`` and ``update()`` (admin bypasses)
- ``src/app/registry/registration/requests/[id]/page.tsx`` -- swap to consolidated ``getOverallClearanceStatus``, remove library from dept types
- ``src/app/student-portal/registration/_components/request/ClearanceStatusView.tsx`` -- use ``REGISTRATION_CLEARANCE_DEPTS``
- ``src/app/student-portal/registration/_lib/status.ts`` -- swap to consolidated util

### Graduation flow

- ``src/app/registry/graduation/clearance/_server/requests/repository.ts`` -- ``create`` dept loop (~L37), ``createWithPaymentReceipts`` dept loop (~L305), filter ``graduationClearances`` to required depts at query level for status calculation
- ``src/app/registry/graduation/clearance/_server/clearance/repository.ts`` -- ``update()`` (exclude department from SET ~L65)
- ``src/app/registry/graduation/clearance/_server/clearance/service.ts`` -- add department validation in ``update()`` (admin bypasses)
- ``src/app/registry/graduation/clearance/[id]/page.tsx`` -- fix TabsPanel nesting bug (move academics outside finance panel)
- ``src/app/registry/graduation/requests/[id]/page.tsx`` -- swap to consolidated ``getOverallClearanceStatus``, remove library from dept types
- ``src/app/student-portal/graduation/_components/request/GraduationClearanceView.tsx`` -- use ``GRADUATION_CLEARANCE_DEPTS``
- ``src/app/student-portal/graduation/_lib/status.ts`` -- swap to consolidated util

## Validation Checklist (Phases 1-4)

1. New registration requests create Finance clearance only (no Library row).
2. New graduation requests create Finance and Academic clearance only (no Library row).
3. Existing open requests with historical Library rows can reach approved/registered states correctly without Library participation.
4. Student portal registration status no longer waits on Library approval.
5. Student portal graduation status no longer waits on Library approval.
6. ``finalizeIfAllApproved`` correctly finalizes when Finance is approved (ignores old Library rows).
7. Clearance ``department`` column cannot be overwritten through the update path (repository-level guard in both repos).
8. Service-level validation prevents cross-department approve/reject via direct API call (admin exempted).
9. Graduation clearance detail page Academics tab renders correctly (TabsPanel nesting fixed).
10. ``getClearanceStatus`` and ``getOverallClearanceStatus`` are consolidated into single shared utilities.
11. Editing an existing registration request does not recreate a Library clearance row.
12. Dashboard detail pages no longer include library in department arrays.
13. Student portal views no longer render empty Library timeline items.

## Risks (Phases 1-4)

### Risk: historical Library rows keep requests pending or block finalization

Mitigation: Phase 2 explicitly targets ``finalizeIfAllApproved`` and all status aggregation helpers. Registration clearance is filtered to ``REGISTRATION_CLEARANCE_DEPTS``. Graduation clearances are filtered at the query level before entering ``getStatusFromClearances``.

### Risk: ``updateWithModules`` re-creates Library clearance rows when students edit existing registrations

Mitigation: Phase 3 updates the dept loop in the update path to ``REGISTRATION_CLEARANCE_DEPTS``. Both the create and update paths are patched together.

### Risk: ``createWithPaymentReceipts`` still creates Library clearance rows for graduation

Mitigation: Phase 4 explicitly lists both ``create`` and ``createWithPaymentReceipts`` as targets.

### Risk: ClearanceSwitch overwrites clearance department column

Mitigation: Phase 2 fixes both clearance repository ``update()`` methods to exclude ``department`` from the SET clause (repository-level guard). No client-side changes to ClearanceSwitch payloads.

### Risk: ``findPreviousClearedRequest`` stays broken for students with library rejections

Accepted risk: Students with historical library rejections will always go through finance clearance rather than being auto-skipped. This is acceptable behavior -- the optimization only helps students who were previously fully cleared.
