# Phase 19: Navigation Config Migration

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 18 complete. Read `000_overview.md` first.

This phase updates navigation configs to use the permission-based visibility model.

## 19.1 Update NavItem Type

File: `src/app/dashboard/module-config.types.ts`

Add `permissions` field:

```ts
import type { Resource, Action } from '@/core/auth/permissions';

export type NavItem = {
  label: string | React.ReactNode;
  href?: string | ((department: string) => string);
  roles?: UserRole[];
  permissions?: { resource: Resource; action: Action }[];
  isVisible?: (session: Session | null) => boolean;
  children?: NavItem[];
};
```

## 19.2 Update Dashboard Shell

File: `src/app/dashboard/dashboard.tsx`

Update `isItemVisible` to check permissions when `item.permissions` is defined. Permissions are available directly from the session via the `customSession` plugin:

```ts
function isItemVisible(
  item: NavItem,
  session: Session | null,
  userPermissions: { resource: string; action: string }[]
): boolean {
  if (item.isVisible && !item.isVisible(session)) return false;

  if (item.roles && !item.roles.includes(session?.user?.role)) return false;

  if (item.permissions) {
    if (session?.user?.role === 'admin') return true;
    return item.permissions.every(({ resource, action }) =>
      userPermissions.some((p) => p.resource === resource && p.action === action)
    );
  }

  return true;
}
```

The dashboard shell (a server component) loads permissions once and passes them through the nav tree.

## 19.3 Update Module Configs

Replace `isVisible` position checks with `permissions` field on sub-items:

**Example — academic.config.ts:**

```ts
// Before
{
  label: 'Lecturers',
  href: '/academic/lecturers',
  roles: ['academic'],
  isVisible: (session) => {
    const position = session?.user?.position;
    return !!(position && ['manager', 'admin', 'program_leader'].includes(position));
  },
}

// After
{
  label: 'Lecturers',
  href: '/academic/lecturers',
  roles: ['academic'],
  permissions: [{ resource: 'lecturers', action: 'read' }],
}
```

Top-level module visibility (`roles` field) stays unchanged.

### Module Config Files to Update

- `src/app/academic/academic.config.ts`
- `src/app/registry/registry.config.ts`
- `src/app/admin/admin.config.ts`
- `src/app/timetable/timetable.config.ts`
- `src/app/finance/finance.config.ts` (if exists)
- `src/app/admissions/admissions.config.ts` (if exists)
- `src/app/library/library.config.ts` (if exists)
- `src/app/lms/lms.config.ts` (if exists)

## Exit Criteria

- [ ] `NavItem` type supports `permissions` field
- [ ] Dashboard shell checks both roles and permissions for nav visibility
- [ ] All module configs updated: `isVisible` position checks → `permissions` field
- [ ] Admin sees all navigation items (bypass via role check)
- [ ] Users without presets see role-gated items but not permission-gated sub-items
- [ ] `pnpm tsc --noEmit` passes
