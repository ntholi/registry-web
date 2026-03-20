# Plan 2: Access, Migration, and UI Cleanup

**Phases 5-7 + lint** | **~14 file edits + 1 new migration**

## Phase 5: Remove Library, Resource, and LEAP from clearance operations and access

Remove Library, Resource, and LEAP from all clearance-specific access paths while leaving the Library module itself and Resource/LEAP roles intact for their other functions.

Areas to update:

- Registry navigation entries for registration clearance (``roles`` array): remove ``library``, ``resource``, ``leap`` from ``roles: ['finance', 'library', 'resource', 'leap']`` -> ``roles: ['finance']``.
- Registry navigation entries for auto-approvals (``roles`` array): remove ``library`` and ``resource`` -> ``roles: ['finance', 'admin']``.
- Registry navigation entries for graduation clearance: uses permission-based access (``permissions: [{ resource: 'graduation-clearance', action: 'read' }]``). No role change needed, but the permission grants must be revoked from Library preset.
- Permission preset grants: remove ``registration-clearance`` and ``graduation-clearance`` grants from Library preset. Remove ``auto-approvals`` CRUD from Library and Resource presets.
- **Auto-approval service** (``src/app/registry/clearance/auto-approve/_server/service.ts``): Remove Library from all 6 authorization shortcuts (``session?.user?.role === 'library'`` checks in ``get``, ``findAll``, ``create``, ``update``, ``delete``, ``bulkCreate``). Also remove the ``role === 'library'`` branch in ``findAll`` that scopes results to library department.
- **Auto-approval validation** in ``bulkCreate``: Update ``targetDept !== 'finance' && targetDept !== 'library'`` to just ``targetDept !== 'finance'``.
- **Auto-approval UI**: Remove Library from form options (``{ value: 'library', label: 'Library' }`` in ``Form.tsx`` and ``BulkImportModal.tsx``).
- **Permission migration**: A custom SQL migration must update the existing permission presets in the database to match the catalog changes. Without this, existing Library and Resource users retain their old grants until a preset is manually re-applied.

Expected result:

- Library, Resource, and LEAP staff cannot access clearance queues or clearance detail tabs.
- Library and Resource clearance grants are removed from permission presets.
- Only Finance can access registration clearance. Only Finance and Academic can access graduation clearance.
- Auto-approvals can only be created and managed for Finance clearance.

## Phase 6: Data migration

This phase cleans up the existing database state. Delivered as a custom Drizzle SQL migration (``pnpm db:generate --custom``) so it executes automatically alongside the deployment. All steps in a single migration file.

### 6a -- Delete pending Library clearance rows

Pending Library rows have no audit value and would confuse any future historical view.

```sql
CREATE TEMP TABLE _pending_lib AS
  SELECT id FROM clearance WHERE department = 'library' AND status = 'pending';

DELETE FROM registration_clearance WHERE clearance_id IN (SELECT id FROM _pending_lib);
DELETE FROM graduation_clearance     WHERE clearance_id IN (SELECT id FROM _pending_lib);

DELETE FROM clearance WHERE id IN (SELECT id FROM _pending_lib);

DROP TABLE _pending_lib;
```

### 6b -- Migrate library-rejected students to blocked_students

For any student with at least one ``rejected`` Library clearance row (registration or graduation), insert one ``blocked_students`` record with ``by_department = 'registry'`` and the most recent rejection message. **Skip students that already have ANY ``blocked_students`` row** (trust prior admin decisions, whether blocked or unblocked).

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
   WHERE bs.std_no = all_rej.std_no
)
ORDER BY all_rej.std_no, all_rej.response_date DESC NULLS LAST;
```

> Current data: only 1 student affected ("Book not returned.").

### 6c -- Drop ``emailSent`` column from clearance table

The ``emailSent`` boolean column was never implemented (no code sets it to ``true``). Remove it as cleanup.

```sql
ALTER TABLE clearance DROP COLUMN IF EXISTS email_sent;
```

Also remove ``emailSent`` from the clearance schema definition in ``src/app/registry/clearance/_schema/clearance.ts``. The schema change and SQL migration must be deployed atomically.

### 6d -- Delete orphaned Library auto-approval records

With Library removed from all auto-approval code paths, existing Library auto-approval records serve no purpose.

```sql
DELETE FROM auto_approvals WHERE department = 'library';
```

> Note: ``by_department`` in ``blocked_students`` is typed as plain ``text``, which accepts ``'registry'`` as a value.

## Phase 7: UI text and label cleanup

With pending rows deleted (Phase 6a) and rejected-student migration done (Phase 6b), the remaining historical Library rows have only ``approved`` or ``rejected`` status.

Historical data approach:

- Do not delete approved or rejected Library clearance rows.
- Read-model filtering established in Plan 1 Phase 2 already excludes these rows from active workflows.
- ClearanceHistory and GraduationClearanceHistory: keep displaying all historical data as-is (no filtering, no legacy badges). Library rows remain visible for audit trail context.

UI text and label cleanup -- remove Library-specific wording so the product language matches the new process:

- ``ClearanceAccordion.tsx`` (registration) -- change hardcoded ``['finance', 'library']`` to ``REGISTRATION_CLEARANCE_DEPTS``.
- ``GraduationClearanceAccordion.tsx`` -- change ``['finance', 'library', 'academic']`` to ``GRADUATION_CLEARANCE_DEPTS``.
- ``ClearanceStatusView.tsx`` (student portal registration) -- already handled in Plan 1 Phase 2h.
- ``GraduationClearanceView.tsx`` (student portal graduation) -- already handled in Plan 1 Phase 2h.
- ``DepartmentMessagesView.tsx`` -- dynamically filters rejected clearances. No hardcoded library reference. Legacy Library rejections will be handled by the Phase 6b migration (rejected students -> blocked_students), so no additional filtering is needed.
- ``ProofOfClearancePDF.tsx`` (student portal graduation) -- fix the **footer text only**: change "All academic, financial, and library obligations have been satisfied" to "All academic and financial obligations have been satisfied". The body text is already generic ("met all university obligations").
- ``ClearanceComments.tsx`` -- remove the ``'Library Fines Owing'`` quick-comment chip from the ``QUICK_COMMENTS`` array.
- Pending/waiting messages shown to students that mention Library -- already handled by Phase 2h (student portal clearance views use constants).

Expected result:

- All operational UI consistently describes Finance as the only clearance department for registration, and Finance plus Academic for graduation.
- No references to Library clearance in student-facing operational views.
- Historical Library data remains visible in history components for audit.

## File Groups (Phases 5-7)

### Access, navigation, permissions, and auto-approvals

- ``src/app/registry/registry.config.ts`` -- remove ``library``, ``resource``, ``leap`` from clearance nav roles
- ``src/app/auth/permission-presets/_lib/catalog.ts`` -- remove clearance grants from Library preset, remove ``auto-approvals`` from Library and Resource presets
- ``src/app/registry/clearance/auto-approve/_server/service.ts`` -- remove Library/Resource role checks from all 6 methods
- ``src/app/registry/clearance/auto-approve/_components/Form.tsx`` -- remove Library department option
- ``src/app/registry/clearance/auto-approve/_components/BulkImportModal.tsx`` -- remove Library department option

### UI text, labels, and history

- ``src/app/registry/registration/requests/_components/ClearanceAccordion.tsx`` -- use ``REGISTRATION_CLEARANCE_DEPTS``
- ``src/app/registry/graduation/requests/_components/GraduationClearanceAccordion.tsx`` -- use ``GRADUATION_CLEARANCE_DEPTS``
- ``src/app/student-portal/graduation/_components/ProofOfClearancePDF.tsx`` -- fix footer text (remove "library obligations")
- ``src/app/registry/_components/ClearanceComments.tsx`` -- remove 'Library Fines Owing' chip

### Schema and migration

- ``src/app/registry/clearance/_schema/clearance.ts`` -- remove ``emailSent`` column
- ``drizzle/<next-num>_library-clearance-cleanup.sql`` (generated via ``pnpm db:generate --custom``)
- Includes: delete pending library clearances, migrate rejected to blocked_students (skip existing), drop emailSent column, delete library auto-approval rules

## Validation Checklist (Phases 5-7)

1. Registry clearance pages no longer present Library as a selectable or rendered department.
2. Library, Resource, and LEAP users no longer have clearance-specific navigation or approval capability.
3. Auto-approval creation and bulk import reject any attempt to target Library.
4. Historical approved/rejected Library data remains in the database and is visible in history views.
5. ``emailSent`` column has been dropped from clearance table (migration verified).
6. Library auto-approval records deleted from database (migration verified).
7. Graduation Proof of Clearance PDF footer no longer mentions "library obligations".
8. "Library Fines Owing" chip is removed from clearance comments.
9. ``pnpm tsc --noEmit`` and ``pnpm lint:fix`` pass with zero errors.
10. ClearanceAccordion and GraduationClearanceAccordion use shared constants.

## Risks (Phases 5-7)

### Risk: direct links or stale UI state still target ``library``

Mitigation: Permission removal blocks access at the auth layer. Navigation removal prevents discovery. Plan 1 Phase 2's filtering prevents Library data from affecting status.

### Risk: Resource/LEAP users retain clearance access

Mitigation: Phase 5 removes these roles from navigation. Phase 5 removes their permission grants.

### Risk: Library retains hidden access through permission presets

Mitigation: Audit and remove clearance-specific grants from Library preset definitions. Permission migration updates existing DB records.

### Risk: auto-approval rules silently continue to affect Library

Mitigation: Restrict valid clearance auto-approval departments to Finance only. Phase 6d migration deletes library auto-approval records from the database.

### Risk: data migration fails on large datasets mid-transaction

Mitigation: The 6a deletion cascades through junction tables; test in staging first. The 6b insert uses a ``NOT EXISTS`` guard so it is safe to re-run.

## Non-Goals

This plan does not propose:

- Removing the Library module itself.
- Deleting approved or rejected historical Library clearance records.
- Redesigning the generic clearance schema.
- Changing non-clearance Library features such as loans, fines, or general Library permissions.
- Removing ``library`` from the ``dashboard_users`` DB enum (Library users still authenticate and use non-clearance features).
- Adding DB CHECK constraints on ``auto_approvals.department``.
- Adding explicit role guards in clearance layouts (relies on navigation/permission removal).
