# Phase 11: Permission Matrix, Preset Form & User Form Update

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 10 complete. Read `000_steering.md` first.

This phase builds the PermissionMatrix component, the Preset Form component, updates the User form to replace position with preset, and adds the navigation entry.

## 11.1 PermissionMatrix Component (Shared)

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

## 11.2 Preset Form Component

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

## 11.3 Update User Form

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

## 11.4 Update User Detail Page

File: `src/app/admin/users/[id]/page.tsx`

- Remove `position` display
- Add preset name display (with link to the preset detail page)
- Optionally show a collapsed permission summary

## 11.5 Add Navigation Entry

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

- [ ] `PermissionMatrix` component works in both editable and read-only modes
- [ ] Preset Form component uses `Form` from adease with editable matrix
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
