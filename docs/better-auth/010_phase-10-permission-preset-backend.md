# Phase 10: Permission Preset Backend & CRUD Pages

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 9 complete. Read `000_steering.md` first.

This phase builds the permission preset feature module backend (repository, service, actions) and the CRUD pages (list, detail, new, edit, layout).

## 10.1 File Structure

```
src/app/admin/permission-presets/
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _components/
│   ├── Form.tsx          (Phase 11)
│   └── PermissionMatrix.tsx  (Phase 11)
├── _lib/
│   └── types.ts
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/page.tsx
└── layout.tsx
```

## 10.2 Types

File: `src/app/admin/permission-presets/_lib/types.ts`

```ts
import { z } from 'zod/v4';
import { RESOURCES, ACTIONS } from '@/core/auth/permissions';

export const presetFormSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string(),
  })),
});

export type PresetFormValues = z.infer<typeof presetFormSchema>;
```

## 10.3 Repository

File: `src/app/admin/permission-presets/_server/repository.ts`

Extends `BaseRepository` for `permissionPresets` table. Additional methods:

- `findByIdWithPermissions(id: string)` — joins `preset_permissions` to get full preset + permissions
- `findByRole(role: string)` — returns presets filtered by role
- `createWithPermissions(data, permissions[])` — transaction: insert preset + permission rows
- `updateWithPermissions(id, data, permissions[])` — transaction: update preset, delete old permissions, insert new
- `deleteById(id)` — cascade deletes permissions via FK

## 10.4 Service

File: `src/app/admin/permission-presets/_server/service.ts`

Extends `BaseService`. All operations gated by `{ users: ['manage'] }` (only admin-level users manage presets).

```ts
class PermissionPresetService extends BaseService<typeof permissionPresets, 'id'> {
  constructor() {
    super(new PermissionPresetRepository(), {
      byIdAuth: { users: ['manage'] },
      findAllAuth: { users: ['manage'] },
      createAuth: { users: ['manage'] },
      updateAuth: { users: ['manage'] },
      deleteAuth: { users: ['manage'] },
    });
  }
}
```

## 10.5 Actions

File: `src/app/admin/permission-presets/_server/actions.ts`

Standard CRUD actions:

```ts
export async function getPreset(id: string) { ... }
export async function findAllPresets(page: number, search: string) { ... }
export async function findPresetsByRole(role: string) { ... }
export async function createPreset(data: PresetFormValues) { ... }
export async function updatePreset(id: string, data: PresetFormValues) { ... }
export async function deletePreset(id: string) { ... }
```

## 10.6 List Page

File: `src/app/admin/permission-presets/page.tsx`

Standard `ListLayout` showing all presets. Each item shows:
- Preset name
- Role badge
- Permission count

## 10.7 Detail Page

File: `src/app/admin/permission-presets/[id]/page.tsx`

Uses `DetailsView` + `DetailsViewHeader` + `DetailsViewBody`:
- Name, role, description fields
- Read-only `PermissionMatrix` showing all granted permissions (component built in Phase 11)
- Edit and Delete buttons

## 10.8 New Page

File: `src/app/admin/permission-presets/new/page.tsx`

Uses the preset Form component (built in Phase 11) for creating a new preset.

## 10.9 Edit Page

File: `src/app/admin/permission-presets/[id]/edit/page.tsx`

Uses the preset Form component with existing data pre-filled.

## 10.10 Layout

File: `src/app/admin/permission-presets/layout.tsx`

Standard layout with children slot.

## Exit Criteria

- [ ] Types defined with Zod schema in `_lib/types.ts`
- [ ] Repository extends `BaseRepository` with custom methods for permissions
- [ ] Service extends `BaseService` with `{ users: ['manage'] }` auth config
- [ ] Standard CRUD actions created including `findPresetsByRole`
- [ ] List page shows presets with name, role badge, permission count
- [ ] Detail page shows preset info (read-only matrix deferred to Phase 11)
- [ ] New and Edit pages scaffold ready (Form component deferred to Phase 11)
- [ ] Layout created
- [ ] `pnpm tsc --noEmit` passes
