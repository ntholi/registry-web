# Phase 4: Permission Preset Management UI

> Estimated Implementation Time: 6 to 10 hours

**Prerequisites**: Phase 3 complete. Read `000_steering-document.md` first.

## Overview

This phase builds two UI features:

1. **Permission Preset CRUD** — dedicated admin page at `/admin/permission-presets`
2. **User Form Update** — preset dropdown + read-only permission matrix on user edit form

## 4.1 Permission Preset Feature Module

### File Structure

```
src/app/admin/permission-presets/
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _components/
│   ├── Form.tsx
│   └── PermissionMatrix.tsx
├── _lib/
│   └── types.ts
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/page.tsx
└── layout.tsx
```

### Types

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

### Repository

File: `src/app/admin/permission-presets/_server/repository.ts`

Extends `BaseRepository` for `permissionPresets` table. Additional methods:

- `findByIdWithPermissions(id: string)` — joins `preset_permissions` to get full preset + permissions
- `findByRole(role: string)` — returns presets filtered by role
- `createWithPermissions(data, permissions[])` — transaction: insert preset + permission rows
- `updateWithPermissions(id, data, permissions[])` — transaction: update preset, delete old permissions, insert new
- `deleteById(id)` — cascade deletes permissions via FK

### Service

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

### Actions

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

### PermissionMatrix Component (Shared)

File: `src/app/admin/permission-presets/_components/PermissionMatrix.tsx`

A reusable matrix component showing resources as rows and actions as columns.

**Props:**

```ts
type PermissionMatrixProps = {
  permissions: { resource: string; action: string }[];
  onChange?: (permissions: { resource: string; action: string }[]) => void;
  readOnly?: boolean;
};
```

**Layout:**
- Rows: resources (grouped by module using the resource catalog from `permissions.ts`)
- Columns: actions (read, create, update, delete, manage, approve)
- Cells: Mantine `Checkbox` (or `Indicator` icon when readOnly)
- Resource grouping headers for visual clarity:
  - **Academic**: lecturers, assessments, semester-modules, modules, school-structures, feedback-*, gradebook, timetable, venues
  - **Registry**: students, registration, student-statuses, documents, terms-settings, graduation, certificate-reprints
  - **Admissions**: applicants, applications, admissions-payments, admissions-documents, entry-requirements
  - **Finance**: sponsors
  - **Admin**: users, tasks, activity-tracker
  - **Library**: library

**When `readOnly=true`:**
- Checkboxes become non-interactive visual indicators
- Color-coded: granted permissions shown with a filled icon/badge

**When `readOnly=false` (editable):**
- Checkboxes toggle permissions on/off
- `onChange` fires with the updated permission set

### Preset Form Component

File: `src/app/admin/permission-presets/_components/Form.tsx`

Uses the `Form` component from `@/shared/ui/adease/`:

```ts
function PermissionPresetForm({ preset }: { preset?: ExistingPreset }) {
  // Fields:
  // - Name (TextInput)
  // - Role (Select from DASHBOARD_ROLES)
  // - Description (Textarea, optional)
  // - PermissionMatrix (editable, onChange updates form state)
}
```

### List Page

File: `src/app/admin/permission-presets/page.tsx`

Standard `ListLayout` showing all presets. Each item shows:
- Preset name
- Role badge
- Permission count

### Detail Page

File: `src/app/admin/permission-presets/[id]/page.tsx`

Uses `DetailsView` + `DetailsViewHeader` + `DetailsViewBody`:
- Name, role, description fields
- Read-only `PermissionMatrix` showing all granted permissions
- Edit and Delete buttons

### Edit Page

File: `src/app/admin/permission-presets/[id]/edit/page.tsx`

Uses the preset Form component with existing data pre-filled.

### New Page

File: `src/app/admin/permission-presets/new/page.tsx`

Uses the preset Form component for creating a new preset.

### Layout

File: `src/app/admin/permission-presets/layout.tsx`

Standard layout with children slot.

## 4.2 Update User Form

File: `src/app/admin/users/_components/Form.tsx`

### Changes

1. **Remove** the `position` field (Select for `userPositions`)
2. **Add** a `presetId` field (Select dropdown)
3. **Add** a read-only `PermissionMatrix` showing the selected preset's permissions
4. **Update** the Zod schema to replace `position` with `presetId`

### Preset Dropdown Behavior

- Only show presets matching the selected role
- When the user changes the role, reset the preset dropdown and filter options
- Show preset name + permission count in the dropdown items
- Null option: "No preset (role-only access)"
- When a preset is selected, the read-only matrix below updates to show its permissions

### Updated Form Schema

```ts
const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1),
  presetId: z.string().nullable().optional(),
  schoolIds: z.array(z.string()).optional(),
  lmsUserId: z.number().nullable().optional(),
  lmsToken: z.string().nullable().optional(),
});
```

### Server Action Update

File: `src/app/admin/users/_server/actions.ts`

Update the `updateUser` action to handle `presetId` assignment.

### UI Details

```
┌─────────────────────────────────────────┐
│  User Form                              │
│                                         │
│  Name:     [John Doe                 ]  │
│  Role:     [Academic              ▾  ]  │
│  Preset:   [Academic Manager      ▾  ]  │
│                                         │
│  ┌─ Permissions (from preset) ──────┐   │
│  │                                  │   │
│  │  [Read-only PermissionMatrix]    │   │
│  │                                  │   │
│  │  ℹ To modify permissions,        │   │
│  │    edit the preset directly.     │   │
│  │    → Manage Presets              │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  Schools:  [School A] [School B] [+]    │
│                                         │
│  [Save]                                 │
└─────────────────────────────────────────┘
```

## 4.3 Update User Detail Page

File: `src/app/admin/users/[id]/page.tsx`

- Remove `position` display
- Add preset name display (with link to the preset detail page)
- Optionally show a collapsed permission summary

## 4.4 Add Navigation Entry

File: `src/app/admin/admin.config.ts`

Add "Permission Presets" as a child nav item under the Admin section:

```ts
{
  label: 'Permission Presets',
  href: '/admin/permission-presets',
  roles: ['admin'],
  icon: IconShield,
}
```

## Exit Criteria

- [ ] Permission Preset CRUD feature module complete (repository, service, actions, pages)
- [ ] `PermissionMatrix` component works in both editable and read-only modes
- [ ] Preset list page shows all presets with name, role, permission count
- [ ] Preset detail page shows read-only permission matrix
- [ ] Preset create/edit pages have working permission matrix with checkboxes
- [ ] User form has preset dropdown filtered by role
- [ ] User form shows read-only permission matrix for selected preset
- [ ] User form no longer shows `position` field
- [ ] User detail page shows assigned preset name
- [ ] "Permission Presets" nav item appears for admin users
- [ ] Creating a preset with permissions works end-to-end
- [ ] Assigning a preset to a user works end-to-end
- [ ] Changing a user's role resets the preset dropdown
- [ ] `pnpm tsc --noEmit` passes
