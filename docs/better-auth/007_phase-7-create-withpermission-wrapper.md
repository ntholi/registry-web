# Phase 7: Create withPermission Wrapper

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 6 complete. Read `000_overview.md` first.

This phase creates the new `withPermission` wrapper (replacing `withAuth`) and migrates `requireSessionUserId`. The BaseService update happens in Phase 8.

## 7.1 Create `withPermission` Wrapper

Delete: `src/core/platform/withAuth.ts`

Create: `src/core/platform/withPermission.ts`

### Behavior

1. Gets session via `auth.api.getSession({ headers: await headers() })`
2. Supports these requirement types:
   - `'all'` — no auth required
   - `'auth'` — authenticated user required
   - `'dashboard'` — user role must be in `DASHBOARD_ROLES`
   - `PermissionRequirement` — checks user's preset permissions
   - `AccessCheckFunction` — custom function for complex logic
3. Admin role bypasses ALL checks (existing behavior preserved)
4. Uses React `cache()` to deduplicate preset permission loading per request

### Implementation Concept

```ts
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth, type Session } from '@/core/auth';
import {
  DASHBOARD_ROLES,
  type AuthRequirement,
  type PermissionRequirement,
  type DashboardRole,
} from '@/core/auth/permissions';
import { unauthorized, forbidden } from 'next/navigation';

type AccessCheckFunction = (session: Session) => Promise<boolean>;

const getSessionWithPermissions = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const permissions: { resource: string; action: string }[] = session.permissions ?? [];

  return { session, permissions };
});

function hasPermission(
  permissions: { resource: string; action: string }[],
  requirement: PermissionRequirement
): boolean {
  for (const [resource, actions] of Object.entries(requirement)) {
    for (const action of actions) {
      if (!permissions.some((p) => p.resource === resource && p.action === action)) {
        return false;
      }
    }
  }
  return true;
}

export async function withPermission<T>(
  fn: (session: Session | null) => Promise<T>,
  requirement: AuthRequirement | AccessCheckFunction,
): Promise<T> {
  if (requirement === 'all') {
    const result = await getSessionWithPermissions();
    return fn(result?.session ?? null);
  }

  const result = await getSessionWithPermissions();
  if (!result) {
    unauthorized();
  }

  const { session, permissions } = result;

  if (requirement === 'auth') {
    return fn(session);
  }

  // Admin bypass
  if (session.user.role === 'admin') {
    return fn(session);
  }

  if (requirement === 'dashboard') {
    const isDashboard = (DASHBOARD_ROLES as readonly string[]).includes(session.user.role);
    if (!isDashboard) {
      forbidden();
    }
    return fn(session);
  }

  if (typeof requirement === 'function') {
    const allowed = await requirement(session);
    if (!allowed) {
      forbidden();
    }
    return fn(session);
  }

  // Permission requirement check
  if (!hasPermission(permissions, requirement)) {
    forbidden();
  }

  return fn(session);
}
```

**Key points:**
- Permissions come from the `customSession` plugin (embedded in session, cached in cookie)
- `cache()` ensures that multiple `withPermission` calls in the same request share one session lookup
- NO direct DB query for permissions — they are already in the session object from `customSession`
- Admin bypass preserved (matches current behavior)
- `'dashboard'` shorthand preserved for the ~25 services using it
- `AccessCheckFunction` still supported for complex cases during transition

### Exposing Session Helper

Also export a helper for pages/components that need session data:

```ts
export async function getSession() {
  const result = await getSessionWithPermissions();
  return result?.session ?? null;
}

export async function getSessionPermissions() {
  const result = await getSessionWithPermissions();
  if (!result) return null;
  return { session: result.session, permissions: result.permissions };
}
```

### Migrate `requireSessionUserId`

The current `withAuth.ts` exports `requireSessionUserId()` which is used in ~4 service files (~10 call sites):
- `src/app/human-resource/employees/_server/service.ts`
- `src/app/academic/schools/structures/_server/service.ts`
- `src/app/registry/terms/settings/_server/service.ts`
- `src/app/registry/students/_server/service.ts`

Move this helper to the new `withPermission.ts` module with updated typing:

```ts
export function requireSessionUserId(session: Session | null | undefined): string {
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}
```

All consumers must update their import path from `@/core/platform/withAuth` to `@/core/platform/withPermission`.

## Exit Criteria

- [ ] `withPermission` wrapper created — reads permissions from `customSession` (no DB query)
- [ ] `cache()` deduplicates session lookup per request
- [ ] `getSession()` and `getSessionPermissions()` helpers exported
- [ ] `requireSessionUserId()` migrated to `withPermission.ts` with updated `Session` type
- [ ] `withAuth` deleted from `src/core/platform/withAuth.ts`
- [ ] `pnpm tsc --noEmit` passes
