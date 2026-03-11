# Phase 3: Authorization Layer Replacement

Status: maintain this phase document together with `better-auth-documentation.md`.

If this file conflicts with `better-auth-documentation.md`, use `better-auth-documentation.md` as the authoritative source.

## 3.1 Replace `withAuth` → `withPermission`

Delete: `src/core/platform/withAuth.ts`

Create: `src/core/platform/withPermission.ts`

New `withPermission` behavior:
1. Gets session via `auth.api.getSession({ headers: await headers() })`
2. Supports:
   - `'all'` — no auth required
   - `'auth'` — authenticated user required
   - `'dashboard'` — checks if user role is a dashboard-level role (preserves existing `dashboardUsers` concept using a hardcoded role list instead of the dropped enum)
   - permission object requirement
3. Merges role defaults + per-user overrides from `user_permissions`
4. `admin` role bypasses checks
5. Uses React `cache()` to deduplicate permission resolution per request

The `cache()` wrapper must be included from the start. Multiple `withPermission` calls in the same request (common in pages that call several server actions) would otherwise trigger N+1 permission lookups against `user_permissions`.

Signature concept:
```ts
import { cache } from 'react';

type PermissionRequirement = {
  [resource: string]: string[];
};

const DASHBOARD_ROLES = [
  'finance', 'registry', 'library', 'resource', 'academic',
  'marketing', 'student_services', 'admin', 'leap', 'human_resource',
] as const;

const getSessionWithPermissions = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const overrides = await loadUserPermissions(session.user.id);
  return { session, overrides };
});

async function withPermission<T>(
  fn: (session: Session) => Promise<T>,
  requirement: 'all' | 'auth' | 'dashboard' | PermissionRequirement
): Promise<T>;
```

## 3.2 Update `BaseService`

File: `src/core/platform/BaseService.ts`

- Replace `Session` import from `next-auth` to `@/core/auth`
- Replace `withAuth` calls with `withPermission`
- Move from role arrays to permission requirements
- Update `buildAuditOptions()` to use the Better Auth `Session` type for extracting `userId` and `role` (the field names are the same but the type source changes)

### Before/After Type Changes

Before (Auth.js):
```ts
type Role = UserRole | 'all' | 'auth' | 'dashboard';
type AuthConfig = Role[] | AccessCheckFunction;

interface BaseServiceConfig {
  byIdRoles?: AuthConfig;
  findAllRoles?: AuthConfig;
  createRoles?: AuthConfig;
  // ...
}
```

After (Better Auth):
```ts
type PermissionRequirement = { [resource: string]: string[] };
type AuthRequirement = 'all' | 'auth' | 'dashboard' | PermissionRequirement;
type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = AuthRequirement | AccessCheckFunction;

interface BaseServiceConfig {
  byIdAuth?: AuthConfig;
  findAllAuth?: AuthConfig;
  createAuth?: AuthConfig;
  // ...
}
```

The `'dashboard'` shorthand is preserved so that the ~25 services currently using `['dashboard']` can migrate to `'dashboard'` with minimal changes. Permission-based auth config is the preferred direction for new code.

## 3.3 Update All Server Actions (~30+ files)

Patterns:
- `withAuth(fn, ['registry', 'admin'])` → `withPermission(fn, { student: ['edit'] })`
- `withAuth(fn, ['dashboard'])` → `withPermission(fn, 'dashboard')`
- `withAuth(fn, ['all'])` → `withPermission(fn, 'all')`
- `withAuth(fn, ['auth'])` → `withPermission(fn, 'auth')`

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

Note: client-side permission checks remain only for UI visibility. Server actions remain the source of truth.

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

## 3.6 Migrate LMS Credential Reads (15+ files)

Currently, `session.user.lmsUserId` and `session.user.lmsToken` are populated from the `users` table on every session callback. After Phase 2, these fields move to the `lms_credentials` table.

**Replacement**: Create or use a server action/repository method that queries `lms_credentials` by user ID on demand.

Files requiring migration:

- `src/core/integrations/moodle.ts` — currently receives lmsUserId/lmsToken as parameters; callers must pass from `lms_credentials` instead of session
- `src/app/lms/students/_server/repository.ts` — reads from users table columns
- `src/app/lms/students/_server/actions.ts` — passes session lmsUserId/lmsToken
- `src/app/lms/courses/_server/actions.ts` — passes session lmsUserId/lmsToken
- `src/app/lms/quizzes/_server/actions.ts` — passes session lmsUserId
- `src/app/lms/auth/_components/LmsAuthGuard.tsx` — reads session.user.lmsUserId/lmsToken for display
- `src/app/lms/auth/_server/actions.ts` — writes to users table lmsUserId/lmsToken
- `src/app/admin/users/_server/repository.ts` — reads lmsUserId from users
- `src/app/admin/users/_components/Form.tsx` — displays/edits lmsUserId/lmsToken fields

Migration pattern: Each LMS action should fetch credentials from `lms_credentials` at the start of the action, rather than reading from the session.

## 3.7 Migrate Position Field Reads (40+ files)

Currently, `session.user.position` is used throughout the codebase for business logic beyond just auth checks (e.g., determining what UI tabs to show, what term settings are accessible, whether a user can manage feedback cycles).

After Phase 2, the `position` column is removed from `users` and existing position values are converted to `user_permissions` rows via presets.

**Migration strategy**: Replace `session.user.position` checks with permission-based checks using `withPermission` or `authClient.admin.hasPermission()`. Each position check maps to a specific permission:

| Position Check | Permission Equivalent |
|---|---|
| `position === 'manager'` | `{ report: ['generate'] }` or specific permission the check gates |
| `position === 'program_leader'` | `{ grade: ['approve'] }` or relevant permission |
| `position === 'year_leader'` | `{ student: ['edit'] }` or relevant permission |
| `position === 'lecturer'` | `{ grade: ['edit'] }` or relevant permission |

Key files requiring migration (non-exhaustive):

- `src/app/registry/students/_server/service.ts` — position-based access logic
- `src/app/registry/students/_components/StudentTabs.tsx` — position-based tab visibility
- `src/app/registry/terms/settings/_server/` — 10+ lines of position checks
- `src/app/academic/feedback/cycles/_server/service.ts` — manager check
- `src/app/academic/schools/structures/[id]/page.tsx` — position-based UI
- `src/app/admin/activity-tracker/_server/service.ts` — position-based filtering
- `src/app/admin/tasks/_server/service.ts` — position-based access
- `src/app/reports/reports.config.ts` — position-based report visibility
- (and ~30 additional files)

## 3.8 Migrate Apply Portal Auth (8 files)

The apply portal (`src/app/apply/`) uses standard Auth.js session patterns for the applicant flow.

Client-side migrations (useSession/signOut):
- `src/app/apply/_lib/useApplicant.ts` → `authClient.useSession()`
- `src/app/apply/_components/ApplyHero.tsx` → `authClient.useSession()`
- `src/app/apply/_components/ApplyHeader.tsx` → `authClient.useSession()` + `authClient.signOut()`
- `src/app/apply/restricted/page.tsx` → `authClient.useSession()`
- `src/app/apply/profile/_components/ProfileView.tsx` → `authClient.useSession()`

Server-side migrations (auth()):
- `src/app/apply/new/page.tsx` → `auth.api.getSession({ headers: await headers() })`
- `src/app/apply/welcome/page.tsx` → `auth.api.getSession({ headers: await headers() })`
- `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts` → Better Auth session

## 3.9 Migrate Login Page and GoogleSignInForm

### Login Page

`src/app/auth/login/page.tsx` uses `auth()` from Auth.js for session check and redirect. Replace with:

```ts
import { auth } from '@/core/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: await headers() });
```

### Account Setup Page

`src/app/auth/account-setup/page.tsx` uses `useSession()` from `next-auth/react`. Replace with `authClient.useSession()`.

### GoogleSignInForm

`src/shared/ui/GoogleSignInForm.tsx` is a server component using Auth.js `signIn('google', { redirectTo })`. Better Auth requires a different pattern.

The replacement must be a **module-level exported server action** (per project rules: never use inline `'use server'` declarations or dynamic imports). Create a dedicated server action file or add the action to an existing one:

File: `src/shared/ui/google-sign-in-action.ts` (or add to the component file as a top-level export)

```ts
'use server';

import { auth } from '@/core/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signInWithGoogle(redirectTo: string) {
  const result = await auth.api.signInSocial({
    body: { provider: 'google', callbackURL: redirectTo },
    headers: await headers(),
  });
  if (result.url) redirect(result.url);
}
```

Then `GoogleSignInForm.tsx` calls `signInWithGoogle(redirectTo)` from its form action.

### Root Page

`src/app/page.tsx` uses `dashboardUsers` enum for role-based routing. Replace with a hardcoded role list after the enum is dropped.

## 3.10 Scope Guardrails

This phase should only cover:

- authorization parity needed to replace `withAuth`
- session API migration on server and client
- required UI permission checks already depended on by the app
- removal of `stdNo` from the session payload
- migration of `lmsUserId`/`lmsToken` reads to `lms_credentials` table
- migration of `position` checks to permission-based checks
- migration of apply portal auth patterns
- migration of login page, account-setup, GoogleSignInForm, and root page auth

This phase should not expand into optional hardening or performance work that is not required for functional parity.

## 3.11 Files Referencing `next-auth` (migration inventory)

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
- `src/app/auth/login/page.tsx`
- `src/app/page.tsx`
- `src/app/reports/reports.config.ts`
- `src/shared/ui/GoogleSignInForm.tsx`
- `src/app/apply/new/page.tsx`
- `src/app/apply/welcome/page.tsx`
- `src/app/apply/[id]/(wizard)/qualifications/_server/actions.ts`
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
- `src/app/student-portal/_shared/Navbar.tsx`
- `src/app/apply/_lib/useApplicant.ts`
- `src/app/apply/_components/ApplyHero.tsx`
- `src/app/apply/_components/ApplyHeader.tsx`
- `src/app/apply/restricted/page.tsx`
- `src/app/apply/profile/_components/ProfileView.tsx`
- `src/app/admin/activity-tracker/page.tsx`
- `src/app/admin/tasks/_components/TaskForm.tsx`
- `src/app/admissions/applicants/[id]/_components/ApplicantHeader.tsx`
- `src/app/academic/feedback/cycles/_components/Form.tsx`
- `src/app/academic/assessments/layout.tsx`
- `src/app/academic/gradebook/_components/ModuleDetailsCard.tsx`

LMS credential migration (session → lms_credentials table):
- `src/core/integrations/moodle.ts`
- `src/app/lms/students/_server/repository.ts`
- `src/app/lms/students/_server/actions.ts`
- `src/app/lms/courses/_server/actions.ts`
- `src/app/lms/quizzes/_server/actions.ts`
- `src/app/lms/auth/_components/LmsAuthGuard.tsx`
- `src/app/lms/auth/_server/actions.ts`
- `src/app/admin/users/_server/repository.ts`
- `src/app/admin/users/_components/Form.tsx`
