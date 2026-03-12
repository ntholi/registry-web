# Phase 23: User Form Update & Navigation Entry

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 22 complete. Read `000_overview.md` first.

This phase updates the User form to replace position with preset, updates the User detail page, and adds the navigation entry.

## 23.1 Update User Form

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
┌─────────────────────────────────────────────┐
│  User Form                                  │
│                                             │
│  Name:     [John Doe                     ]  │
│  Role:     [Academic                  ▾  ]  │
│  Preset:   [Academic Manager          ▾  ]  │
│                                             │
│  ┌── Permissions (from preset) ──────────┐  │
│  │                                       │  │
│  │  [Read-only PermissionMatrix]         │  │
│  │                                       │  │
│  │  ℹ To modify permissions,             │  │
│  │    edit the preset directly.          │  │
│  │    → Manage Presets                   │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Schools:  [School A] [School B] [+]        │
│                                             │
│  [Save]                                     │
└─────────────────────────────────────────────┘
```

## 23.2 Update User Detail Page

File: `src/app/admin/users/[id]/page.tsx`

- Remove `position` display
- Add preset name display (with link to the preset detail page)
- Optionally show a collapsed permission summary

## 23.3 Add Navigation Entry

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

- [ ] User form has preset dropdown filtered by role
- [ ] User form shows read-only permission matrix for selected preset
- [ ] User form no longer shows `position` field
- [ ] User detail page shows assigned preset name
- [ ] "Permission Presets" nav item appears for admin users
- [ ] Assigning a preset to a user works end-to-end
- [ ] Changing a user's role resets the preset dropdown
- [ ] `pnpm tsc --noEmit` passes
