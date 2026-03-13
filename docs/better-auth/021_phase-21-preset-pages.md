# Phase 21: Permission Preset Pages

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 20 complete. Read `000_overview.md` first.

This phase creates the CRUD pages for the permission preset feature module.

**Ownership**: The schema, repository, service, and actions live in `src/app/auth/permission-presets/` (auth-owned). The admin UI pages in `src/app/admin/permission-presets/` import and consume those auth-owned actions — they do NOT duplicate server logic.

### File Structure

```
src/app/admin/permission-presets/
├── _components/
│   └── Form.tsx          # Built in Phase 22
├── new/
│   └── page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/
│       └── page.tsx
├── layout.tsx
└── page.tsx
```

## 21.1 Activity Logging

Add permission preset activity entries to `src/app/admin/_lib/activities.ts`.

The existing service already calls `this.buildAuditOptions(session, 'create|update|delete')`, but the service constructor does NOT declare `activityTypes`. Add `activityTypes` to the service config in `src/app/auth/permission-presets/_server/service.ts`:

```ts
activityTypes: {
  create: 'preset_created',
  update: 'preset_updated',
  delete: 'preset_deleted',
},
```

Add matching entries to `src/app/admin/_lib/activities.ts`:

```ts
preset_created: { label: 'Permission Preset Created', department: 'admin' },
preset_updated: { label: 'Permission Preset Updated', department: 'admin' },
preset_deleted: { label: 'Permission Preset Deleted', department: 'admin' },
```

And add to `tableOperationMap`:

```ts
'permission_presets:INSERT': 'preset_created',
'permission_presets:UPDATE': 'preset_updated',
'permission_presets:DELETE': 'preset_deleted',
```

## 21.2 Layout (ListLayout Pattern)

File: `src/app/admin/permission-presets/layout.tsx`

Follows the standard `ListLayout` pattern from the create-feature skill (Step 10):

```tsx
'use client';

import type { PropsWithChildren } from 'react';
import { Badge, Group, Text } from '@mantine/core';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { findAllPresets } from '@auth/permission-presets/_server/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/permission-presets'}
      queryKey={['permission-presets']}
      getData={findAllPresets}
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/permission-presets/new' />,
      ]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.name}
          description={
            <Group gap="xs">
              <Badge size="xs" variant="light">{toTitleCase(it.role)}</Badge>
              <Text size="xs" c="dimmed">{it.permissionCount} permissions</Text>
            </Group>
          }
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
```

## 21.3 Index Page (Empty State)

File: `src/app/admin/permission-presets/page.tsx`

```tsx
import { NothingSelected } from '@/shared/ui/adease';

export default function Page() {
  return <NothingSelected title='Permission Presets' />;
}
```

## 21.4 Detail Page

File: `src/app/admin/permission-presets/[id]/page.tsx`

Uses `DetailsView` + `DetailsViewHeader` + `DetailsViewBody` (create-feature skill Step 13):

```tsx
import { notFound } from 'next/navigation';
import { Badge } from '@mantine/core';
import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/shared/ui/adease';
import { getRoleColor } from '@/shared/lib/utils/colors';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { deletePreset, getPreset } from '@auth/permission-presets/_server/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PresetDetails({ params }: Props) {
  const { id } = await params;
  const preset = await getPreset(id);

  if (!preset) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Permission Preset'}
        queryKey={['permission-presets']}
        handleDelete={async () => {
          'use server';
          await deletePreset(id);
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{preset.name}</FieldView>
        <FieldView label='Role'>
          <Badge color={getRoleColor(preset.role)} variant='light'>
            {toTitleCase(preset.role)}
          </Badge>
        </FieldView>
        <FieldView label='Description'>{preset.description}</FieldView>
        <FieldView label='Permissions'>{preset.permissionCount} granted</FieldView>
        {/* Read-only PermissionMatrix added in Phase 22 */}
      </DetailsViewBody>
    </DetailsView>
  );
}
```

## 21.5 New Page

File: `src/app/admin/permission-presets/new/page.tsx`

```tsx
import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createPreset } from '@auth/permission-presets/_server/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Permission Preset'} onSubmit={createPreset} />
    </Box>
  );
}
```

## 21.6 Edit Page

File: `src/app/admin/permission-presets/[id]/edit/page.tsx`

```tsx
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getPreset, updatePreset } from '@auth/permission-presets/_server/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const preset = await getPreset(id);
  if (!preset) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Permission Preset'}
        defaultValues={preset}
        onSubmit={async (values) => {
          'use server';
          return await updatePreset(id, values);
        }}
      />
    </Box>
  );
}
```

## Exit Criteria

- [ ] Activity types added to service config and admin activities fragment
- [ ] Layout uses `ListLayout` with `getData={findAllPresets}`, `queryKey`, `renderItem`, `NewLink`
- [ ] Index page shows `NothingSelected`
- [ ] Detail page uses `DetailsView`/`DetailsViewHeader`/`DetailsViewBody`/`FieldView` pattern
- [ ] New page uses `Form` with `onSubmit={createPreset}` (Form built in Phase 22)
- [ ] Edit page loads preset, passes `defaultValues` and wraps `updatePreset` in `onSubmit`
- [ ] All pages import auth-owned actions, no server logic duplication
- [ ] `pnpm tsc --noEmit` passes
