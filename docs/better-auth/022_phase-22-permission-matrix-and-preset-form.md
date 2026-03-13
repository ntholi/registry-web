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

Follows the standard adease `Form` pattern (create-feature skill Step 9). Uses `onSubmit`, `defaultValues`, `title` props:

```tsx
'use client';

import { TextInput, Select, Textarea } from '@mantine/core';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';
import PermissionMatrix from '@/shared/ui/PermissionMatrix';
import { DASHBOARD_ROLES, type PermissionGrant } from '@/core/auth/permissions';
import { presetFormSchema, type PresetFormValues, type PermissionPresetDetail } from '@auth/permission-presets/_lib/types';
import { toTitleCase } from '@/shared/lib/utils/utils';

type Props = {
  onSubmit: (values: PresetFormValues) => Promise<PermissionPresetDetail>;
  defaultValues?: PresetFormValues;
  title?: string;
};

export default function PermissionPresetForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['permission-presets']}
      schema={presetFormSchema}
      defaultValues={defaultValues ?? { permissions: [] }}
      onSuccess={({ id }) => router.push('/admin/permission-presets/' + id)}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <Select
            label='Role'
            searchable
            data={DASHBOARD_ROLES.map((r) => ({ value: r, label: toTitleCase(r) }))}
            {...form.getInputProps('role')}
          />
          <Textarea label='Description' {...form.getInputProps('description')} />
          <PermissionMatrix
            permissions={form.values.permissions ?? []}
            onChange={(permissions) => form.setFieldValue('permissions', permissions)}
          />
        </>
      )}
    </Form>
  );
}
```

Do not allow typing resources or actions manually. Admins only select from code-defined options.

### Integrating PermissionMatrix into Detail Page

After this phase, update `src/app/admin/permission-presets/[id]/page.tsx` (from Phase 21) to include the read-only `PermissionMatrix`:

```tsx
<PermissionMatrix permissions={preset.permissions} readOnly />
```

## Exit Criteria

- [ ] Shared `PermissionMatrix` component works in both editable and read-only modes
- [ ] Preset Form uses adease `Form` with `onSubmit`/`defaultValues`/`title` props
- [ ] Preset Form includes `PermissionMatrix` in editable mode
- [ ] Matrix rows and columns come from shared permission constants
- [ ] No free-text resource or action input exists
- [ ] Detail page shows read-only permission matrix
- [ ] Create/edit pages use the Form component end-to-end
- [ ] Creating a preset with permissions works end-to-end
- [ ] `pnpm tsc --noEmit` passes
