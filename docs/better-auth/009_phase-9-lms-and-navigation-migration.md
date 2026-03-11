# Phase 9: LMS Credentials & Navigation Config Migration

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 8 complete. Read `000_overview.md` first.

This phase migrates all LMS credential reads from session to the new `lms_credentials` table and updates navigation configs to use the permission-based visibility model.

## 9.1 Migrate LMS Credential Reads (~15 files)

Replace `session.user.lmsUserId` / `session.user.lmsToken` with on-demand reads from `lms_credentials` table.

### Create LMS Credentials Helper

File: `src/app/auth/auth-providers/_server/lms-credentials.ts`

```ts
export async function getLmsCredentials(userId: string) {
  return db.query.lmsCredentials.findFirst({
    where: eq(lmsCredentials.userId, userId),
  });
}
```

### Files Requiring Migration

| File | What to change |
|------|---------------|
| `src/core/integrations/moodle.ts` | Replace `session.user.lmsUserId`/`lmsToken` with `getLmsCredentials()` call |
| `src/app/lms/students/_server/repository.ts` | Replace session-based LMS credential access |
| `src/app/lms/students/_server/actions.ts` | Fetch LMS credentials from table instead of session |
| `src/app/lms/courses/_server/actions.ts` | Fetch LMS credentials from table instead of session |
| `src/app/lms/quizzes/_server/actions.ts` | Fetch LMS credentials from table instead of session |
| `src/app/lms/auth/_components/LmsAuthGuard.tsx` | Check LMS credentials from table |
| `src/app/lms/auth/_server/actions.ts` | Read/write LMS credentials via `lms_credentials` table |
| `src/app/admin/users/_server/repository.ts` | Update user LMS credential handling to use separate table |
| `src/app/admin/users/_components/Form.tsx` | LMS credential fields now read/write from `lms_credentials` |

### Migration Pattern

**Before:**
```ts
const session = await auth();
const lmsUserId = session.user.lmsUserId;
const lmsToken = session.user.lmsToken;
```

**After:**
```ts
const session = await getSession();
const creds = await getLmsCredentials(session.user.id);
const lmsUserId = creds?.lmsUserId;
const lmsToken = creds?.lmsToken;
```

## 9.2 Update Navigation Configs for Sub-Item Permissions

### Update NavItem Type

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

### Update Dashboard Shell

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

### Update Module Configs

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

- [ ] LMS credentials helper created in `src/app/auth/auth-providers/_server/lms-credentials.ts`
- [ ] All ~15 files migrated from session-based LMS credential access to table reads
- [ ] `NavItem` type supports `permissions` field
- [ ] Dashboard shell checks both roles and permissions for nav visibility
- [ ] All module configs updated: `isVisible` position checks → `permissions` field
- [ ] Admin sees all navigation items (bypass via role check)
- [ ] Users without presets see role-gated items but not permission-gated sub-items
- [ ] No `session.user.lmsUserId` or `session.user.lmsToken` references remain
- [ ] `pnpm tsc --noEmit` passes
