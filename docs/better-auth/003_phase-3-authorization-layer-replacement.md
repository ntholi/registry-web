# Phase 3: Authorization Layer Replacement

## 3.1 Replace `withAuth` → `withPermission`

Delete: `src/core/platform/withAuth.ts`

Create: `src/core/platform/withPermission.ts`

New `withPermission` behavior:
1. Gets session via `auth.api.getSession({ headers: await headers() })` — this is the REAL security check (not the proxy)
2. Supports:
   - `'all'` — no auth required
   - `'auth'` — authenticated user required
   - permission object requirement
3. Merges role defaults + per-user overrides from `user_permissions`
4. `admin` role bypasses checks

### Permission Caching Strategy
To avoid querying `user_permissions` on every single server action call:
- On first `withPermission` call per request, query user_permissions and cache the result
- Use React's `cache()` function to deduplicate within a single request lifecycle
- This means multiple `withPermission` calls in the same request share one DB query
- Permission changes by admins take effect on the user's next request (acceptable trade-off)

```ts
import { cache } from "react";

const getUserPermissions = cache(async (userId: string) => {
  try {
    return await permissionRepository.findByUserId(userId);
  } catch (error) {
    console.error("[withPermission] Failed to query user_permissions", { userId, error });
    return [];
  }
});
```

Signature concept:
```ts
type PermissionRequirement = {
  [resource: string]: string[];
};

async function withPermission<T>(
  fn: (session: Session) => Promise<T>,
  requirement: 'all' | 'auth' | PermissionRequirement
): Promise<T>;
```

## 3.2 Update `BaseService`

File: `src/core/platform/BaseService.ts`

- Replace `Session` import from `next-auth` to `@/core/auth`
- Replace `withAuth` calls with `withPermission`
- Move from role arrays to permission requirements

## 3.3 Update All Server Actions (~30+ files)

Patterns:
- `withAuth(fn, ['registry', 'admin'])` → `withPermission(fn, { student: ['edit'] })`
- `withAuth(fn, ['dashboard'])` → `withPermission(fn, 'auth')` or specific permissions
- `withAuth(fn, ['all'])` → `withPermission(fn, 'all')`

Key files (non-exhaustive):
- `src/app/academic/lecturers/_server/actions.ts`
- `src/app/registry/students/_server/service.ts`
- `src/app/registry/certificate-reprints/_server/service.ts`
- `src/app/finance/*/_server/actions.ts`
- `src/app/admin/*/_server/actions.ts`
- `src/app/feedback/_server/actions.ts`

## 3.4 Update All Client Components (~35+ files)

Replace:
- `useSession` from `next-auth/react` → `authClient.useSession()`
- `signOut` from `next-auth/react` → `authClient.signOut()`
- `SessionProvider` from `next-auth/react` → remove
- Session type from `next-auth` → `@/core/auth`

Permission checks:
```ts
const { data: hasAccess } = await authClient.admin.hasPermission({
  permissions: { student: ["print_card"] }
});
```

Or role-only synchronous checks:
```ts
authClient.admin.checkRolePermission({
  permissions: { student: ["edit"] },
  role: session.user.role,
});
```

Note: `checkRolePermission` does not include DB per-user overrides.

## 3.5 Replace `stdNo` Session Access with On-Demand Server Action

Currently, `session.user.stdNo` is populated by a DB query in every session callback. This adds latency to every session fetch (including non-student users).

**Replacement**: Create a dedicated server action that queries `stdNo` on-demand only where needed.

File: `src/app/registry/students/_server/actions.ts` (add to existing actions)

```ts
export async function getStudentByUserId(userId: string) {
  return withPermission(async () => {
    return studentRepository.findByUserId(userId);
  }, 'auth');
}
```

Update all components that currently use `session.user.stdNo`:
- `src/app/student-portal/**` — call `getStudentByUserId(session.user.id)` instead
- `src/shared/lib/hooks/use-user-student.tsx` — refactor to use the server action via TanStack Query
- Any other component using `session.user.stdNo`

> **Why?** This eliminates a DB query on every session load for all 12K users, when only ~student role users need `stdNo`. On-demand querying is both faster (for non-students) and cleaner architecturally.

## 3.6 Files Referencing `next-auth` (migration inventory)

Server-side highlights:
- `src/core/platform/withAuth.ts` — delete
- `src/core/platform/BaseService.ts`
- `src/core/auth.ts`
- `src/app/timetable/timetable.config.ts`
- `src/app/registry/students/_server/history/service.ts`
- `src/app/admin/tasks/_server/service.ts`
- `src/app/admin/activity-tracker/_server/service.ts`
- `src/app/academic/schools/structures/[id]/page.tsx`
- `src/app/registry/students/_components/StudentTabs.tsx`
- `src/app/registry/students/_components/academics/SemesterTable.tsx`
- `src/app/dashboard/module-config.types.ts`
- `src/app/dashboard/dashboard.tsx`
- `src/app/auth/auth-providers/_schema/accounts.ts`
- `next-auth.d.ts` — delete
- `src/test/mock.withAuth.ts`

Client-side highlights:
- `src/app/providers.tsx`
- `src/shared/ui/adease/DetailsViewHeader.tsx`
- `src/shared/lib/hooks/use-user-student.tsx`
- `src/shared/lib/hooks/use-user-schools.tsx`
- `src/app/registry/students/_components/**/*`
- `src/app/registry/registration/clearance/_components/ClearanceSwitch.tsx`
- `src/app/registry/graduation/**/*`
- `src/app/registry/clearance/auto-approve/_components/*`
- `src/app/registry/blocked-students/_components/ImportBlockedStudentsDialog.tsx`
- `src/app/lms/auth/_components/LmsAuthGuard.tsx`
- `src/app/dashboard/base/RoleDisplay.tsx`
- `src/app/auth/account-setup/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/shared/ui/GoogleSignInForm.tsx`
- `src/app/student-portal/_shared/Navbar.tsx`
- `src/app/apply/**/*`
- `src/app/admin/activity-tracker/page.tsx`
- `src/app/admin/tasks/_components/TaskForm.tsx`
- `src/app/admissions/applicants/[id]/_components/ApplicantHeader.tsx`
- `src/app/academic/feedback/cycles/_components/Form.tsx`
- `src/app/academic/assessments/layout.tsx`
- `src/app/academic/gradebook/_components/ModuleDetailsCard.tsx`
