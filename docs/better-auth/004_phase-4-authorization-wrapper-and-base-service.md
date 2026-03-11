# Phase 4: Authorization Wrapper & BaseService

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 3 complete. Read `000_steering-document.md` first.

This phase creates the new `withPermission` wrapper (replacing `withAuth`) and updates `BaseService` to use the new authorization model. Individual service files are migrated in Phases 5–7.

## 4.1 Create `withPermission` Wrapper

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
  fn: (session: Session) => Promise<T>,
  requirement: AuthRequirement | AccessCheckFunction,
): Promise<T> {
  if (requirement === 'all') {
    const result = await getSessionWithPermissions();
    return fn(result?.session ?? null as unknown as Session);
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

## 4.2 Update `BaseService`

File: `src/core/platform/BaseService.ts`

### Type Changes

**Before:**
```ts
import { type Session } from 'next-auth';

type Role = UserRole | 'all' | 'auth' | 'dashboard';
type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = Role[] | AccessCheckFunction;

interface BaseServiceConfig {
  byIdRoles?: AuthConfig;
  findAllRoles?: AuthConfig;
  createRoles?: AuthConfig;
  updateRoles?: AuthConfig;
  deleteRoles?: AuthConfig;
  countRoles?: AuthConfig;
}
```

**After:**
```ts
import { type Session } from '@/core/auth';
import { type AuthRequirement } from '@/core/auth/permissions';

type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = AuthRequirement | AccessCheckFunction;

interface BaseServiceConfig {
  byIdAuth?: AuthConfig;
  findAllAuth?: AuthConfig;
  createAuth?: AuthConfig;
  updateAuth?: AuthConfig;
  deleteAuth?: AuthConfig;
  countAuth?: AuthConfig;
  activityTypes?: { create?: string; update?: string; delete?: string };
}
```

### Method Changes

Replace `withAuth` calls with `withPermission`:

```ts
async get(id: ID) {
  return withPermission(
    async () => this.repository.findById(id),
    this.config.byIdAuth ?? 'auth',
  );
}

async findAll(page: number, search: string) {
  return withPermission(
    async () => this.repository.findAll(page, search),
    this.config.findAllAuth ?? 'auth',
  );
}

async create(data: Insert) {
  return withPermission(
    async (session) => {
      const audit = this.buildAuditOptions(session, 'create');
      return this.repository.create(data, audit);
    },
    this.config.createAuth ?? 'auth',
  );
}
```

### Migration Note for Existing Services

Existing services use `Role[]` syntax like `['academic', 'leap']`. These must be converted to either:

1. **Permission requirements**: `{ assessments: ['read'] }` — preferred for new code
2. **`'dashboard'` shorthand**: for services that currently use `['dashboard']`
3. **Custom access functions**: for complex logic

**Conversion examples:**

| Before | After |
|--------|-------|
| `byIdRoles: ['academic', 'leap']` | `byIdAuth: { assessments: ['read'] }` |
| `findAllRoles: ['dashboard']` | `findAllAuth: 'dashboard'` |
| `createRoles: ['registry']` | `createAuth: { students: ['create'] }` |
| `deleteRoles: ['admin']` | `deleteAuth: { applications: ['delete'] }` |
| `findAllRoles: canViewCycles` | `findAllAuth: canViewCycles` (custom function preserved) |

## Exit Criteria

- [ ] `withPermission` wrapper created — reads permissions from `customSession` (no DB query)
- [ ] `cache()` deduplicates session lookup per request
- [ ] `getSession()` and `getSessionPermissions()` helpers exported
- [ ] `withAuth` deleted from `src/core/platform/withAuth.ts`
- [ ] `BaseService` updated: new type system (`AuthConfig`, `byIdAuth`/`findAllAuth`/etc.)
- [ ] `BaseService` methods use `withPermission` instead of `withAuth`
- [ ] All `BaseService` type exports updated (`Session` from `@/core/auth`)
- [ ] `pnpm tsc --noEmit` passes (existing services will have type errors — expected, fixed in Phases 5–7)
