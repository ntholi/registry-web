# Phase 23: User Form Update & Navigation Entry

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 22 complete. Read `000_overview.md` first.

This phase updates the User form to replace position with preset, updates the User detail page, and adds the navigation entry.

**Note**: The `position` column is NOT removed from the schema in this phase. Phase 24 handles the schema column drop and cleanup. This phase only removes `position` from the UI.

## 23.1 Update User Form

File: `src/app/admin/users/_components/Form.tsx`

### Changes

1. **Remove** the `position` field (Select for `userPositions`)
2. **Add** a `presetId` field (Select dropdown)
3. **Add** the shared read-only `PermissionMatrix` showing the selected preset's permissions
4. **Update** the Zod schema to replace `position` with `presetId`

### Preset Dropdown Behavior

- Only show presets matching the selected role
- Fetch presets by role using `findPresetsByRole` from `@auth/permission-presets/_server/actions`
- When the user changes the role, reset the preset dropdown and filter options
- Show preset name + permission count in the dropdown items
- Null option: "No preset (role-only access)"
- When a preset is selected, fetch its full permissions and show the read-only matrix below

### Updated Form Schema

```ts
const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(userRoles.enumValues),
  presetId: z.string().nullable().optional(),
  schoolIds: z.array(z.string()).optional(),
  lmsUserId: z.number().nullable().optional(),
  lmsToken: z.string().nullable().optional(),
});
```

### Server Action Update

File: `src/app/admin/users/_server/actions.ts`

Update the `updateUser` action to delegate `presetId` assignment and any LMS credential writes to auth-owned user/auth-provider services. Preset option loading should also come from auth-owned preset actions (`findPresetsByRole`, `getPreset`). Session revocation on preset change happens inside that auth-owned service layer, not in the admin action.

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

- Remove `position` display from `FieldView`
- Add preset name display (with link to the preset detail page at `/admin/permission-presets/{presetId}`)
- Optionally show a collapsed permission summary

## 23.3 Add Navigation Entry

File: `src/app/admin/admin.config.ts`

Add "Permission Presets" as a nav item in the admin dashboard navigation array. Include both `roles` and `permissions` for granular access control:

```ts
{
  label: 'Permission Presets',
  href: '/admin/permission-presets',
  icon: IconShield,
  roles: ['admin'],
  permissions: [{ resource: 'permission-presets', action: 'read' }],
},
```

Place it after the "Users" entry since preset management is closely related to user management.

## Exit Criteria

- [ ] User form has preset dropdown filtered by role (using `findPresetsByRole` from auth actions)
- [ ] User form shows shared read-only permission matrix for selected preset
- [ ] User form no longer shows `position` field (but position column still exists in schema for Phase 24)
- [ ] User detail page shows assigned preset name (with link to preset detail)
- [ ] User detail page no longer shows `position`
- [ ] "Permission Presets" nav item appears for admin users with correct permissions
- [ ] Assigning a preset to a user works end-to-end
- [ ] Changing a user's role resets the preset dropdown
- [ ] Admin action delegates preset and LMS writes to auth-owned server code
- [ ] `pnpm tsc --noEmit` passes
