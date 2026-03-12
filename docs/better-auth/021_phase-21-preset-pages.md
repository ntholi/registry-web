# Phase 21: Permission Preset Pages

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 20 complete. Read `000_overview.md` first.

This phase creates the CRUD pages for the permission preset feature module.

The route module stays under `src/app/admin/permission-presets`, but all data reads and writes must import the auth-owned actions from `src/app/auth/permission-presets/_server/actions.ts`.

## 21.1 List Page

File: `src/app/admin/permission-presets/page.tsx`

Standard `ListLayout` showing all presets. Each item shows:
- Preset name
- Role badge
- Permission count

## 21.2 Detail Page

File: `src/app/admin/permission-presets/[id]/page.tsx`

Uses `DetailsView` + `DetailsViewHeader` + `DetailsViewBody`:
- Name, role, description fields
- Read-only shared `PermissionMatrix` showing all granted permissions (component built in Phase 22)
- Edit and Delete buttons

## 21.3 New Page

File: `src/app/admin/permission-presets/new/page.tsx`

Uses the preset Form component (built in Phase 22) for creating a new preset.

## 21.4 Edit Page

File: `src/app/admin/permission-presets/[id]/edit/page.tsx`

Uses the preset Form component with existing data pre-filled.

## 21.5 Layout

File: `src/app/admin/permission-presets/layout.tsx`

Standard layout with children slot.

## Exit Criteria

- [ ] List page shows presets with name, role badge, permission count
- [ ] Detail page shows preset info (read-only matrix deferred to Phase 22)
- [ ] New and Edit pages scaffold ready (Form component deferred to Phase 22)
- [ ] Layout created
- [ ] `pnpm tsc --noEmit` passes
