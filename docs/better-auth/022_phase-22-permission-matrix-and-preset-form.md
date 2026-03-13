# Phase 22: Permission Matrix & Preset Form

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 21 complete. Read `000_overview.md` first.

This phase builds the shared PermissionMatrix component and the Preset Form component.

## 22.1 PermissionMatrix Component (Shared)

File: `src/shared/ui/PermissionMatrix.tsx`

A reusable matrix component showing resources as rows and actions as columns.

The matrix should mirror the explicit action vocabulary only. Do not render a generic `manage` column.

**Props:**

```ts
type PermissionMatrixProps = {
  permissions: { resource: string; action: string }[];
  onChange?: (permissions: { resource: string; action: string }[]) => void;
  readOnly?: boolean;
};
```

**Layout:**
- Rows: resources grouped from `src/app/auth/permission-presets/_lib/catalog.ts`
- Columns: actions (read, create, update, delete, approve)
- Cells: Mantine `Checkbox` (or `Indicator` icon when readOnly)
- Resource grouping headers for visual clarity:
  - **Academic**: lecturers, assessments, semester-modules, modules, school-structures, feedback-*, gradebook, timetable, venues
  - **Registry**: students, registration, student-statuses, documents, terms-settings, graduation, certificate-reprints
  - **Admissions**: applicants, applications, admissions-payments, admissions-documents, entry-requirements
  - **Finance**: sponsors
  - **Admin**: users, permission-presets, tasks, activity-tracker
  - **Library**: library

**When `readOnly=true`:**
- Checkboxes become non-interactive visual indicators
- Color-coded: granted permissions shown with a filled icon/badge

**When `readOnly=false` (editable):**
- Checkboxes toggle permissions on/off
- `onChange` fires with the updated permission set

## 22.2 Preset Form Component

File: `src/app/admin/permission-presets/_components/Form.tsx`

Uses the `Form` component from `@/shared/ui/adease/`:

```ts
function PermissionPresetForm({ preset }: { preset?: ExistingPreset }) {
  // Fields:
  // - Name (TextInput)
  // - Role (Select from DASHBOARD_ROLES)
  // - Description (Textarea, optional)
  // - Shared PermissionMatrix (editable, onChange updates form state)
}
```

## Exit Criteria

- [ ] Shared `PermissionMatrix` component works in both editable and read-only modes
- [ ] Preset Form component uses `Form` from adease with editable matrix
- [ ] Preset list page shows all presets with name, role, permission count
- [ ] Preset detail page shows read-only permission matrix
- [ ] Preset create/edit pages have working permission matrix with checkboxes
- [ ] Creating a preset with permissions works end-to-end
- [ ] `pnpm tsc --noEmit` passes
