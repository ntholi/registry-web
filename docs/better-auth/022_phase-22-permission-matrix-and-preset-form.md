# Phase 22: Permission Matrix & Preset Form

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 21 complete. Read `000_overview.md` first.

This phase builds the shared PermissionMatrix component and the Preset Form component.

## 22.1 PermissionMatrix Component (Shared)

File: `src/shared/ui/PermissionMatrix.tsx`

A reusable matrix component showing resources as rows and actions as columns.

The matrix should mirror the explicit action vocabulary only. Do not render a generic `manage` column.
The matrix must use code-defined values only. No free-text permissions.

**Props:**

```ts
type PermissionMatrixProps = {
  permissions: PermissionGrant[];
  onChange?: (permissions: PermissionGrant[]) => void;
  readOnly?: boolean;
};
```

**Layout:**
- Rows: `PERMISSION_RESOURCE_GROUPS`
- Columns: `ACTIONS`
- Cells: Mantine `Checkbox` (or `Indicator` icon when readOnly)
- Groups come from shared constants. Do not duplicate resource lists in the component.

**When `readOnly=true`:**
- Checkboxes become non-interactive visual indicators
- Color-coded: granted permissions shown with a filled icon/badge

**When `readOnly=false` (editable):**
- Checkboxes toggle permissions on/off
- `onChange` fires with the updated permission set
- Only render valid resource/action pairs from shared constants

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

Do not allow typing resources or actions manually. Admins only select from code-defined options.

## Exit Criteria

- [ ] Shared `PermissionMatrix` component works in both editable and read-only modes
- [ ] Preset Form component uses `Form` from adease with editable matrix
- [ ] Matrix rows and columns come from shared permission constants
- [ ] No free-text resource or action input exists
- [ ] Preset list page shows all presets with name, role, permission count
- [ ] Preset detail page shows read-only permission matrix
- [ ] Preset create/edit pages have working permission matrix with checkboxes
- [ ] Creating a preset with permissions works end-to-end
- [ ] `pnpm tsc --noEmit` passes
