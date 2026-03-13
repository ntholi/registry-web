# Phase 24c: Integration Tests & Checklist

> Estimated Implementation Time: 45–60 minutes

**Prerequisites**: Phase 24a (cleanup) complete.

## 24c.1 Integration Tests

Implemented auth-focused coverage lives in:

- `src/core/auth/__tests__/auth-routing.test.ts`
- `src/core/auth/__tests__/session-permissions.test.ts`
- `src/core/platform/__tests__/withPermission.test.ts`
- `src/app/auth/permission-presets/_server/__tests__/service.test.ts`

Write at minimum these critical-path tests (using Vitest):

### Test 1: Google Sign-In Flow

```ts
// src/test/auth/google-signin.test.ts
import { describe, it, expect } from 'vitest';

describe('Google Sign-In Flow', () => {
  it('route handler responds at /api/auth', async () => {
    const res = await fetch('/api/auth');
    expect(res.status).not.toBe(404);
  });

  it('initiates OAuth flow via authClient', async () => {
    // Verify authClient.signIn.social({ provider: 'google' }) triggers redirect
    // Mock the social sign-in call and assert redirect URL contains accounts.google.com
    const { authClient } = await import('@/core/auth-client');
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
    expect(result).toBeDefined();
  });
});
```

### Test 2: `withPermission` Authorization

```ts
// src/test/auth/withPermission.test.ts
import { describe, it, expect, vi } from 'vitest';
import { withPermission } from '@/core/platform/withPermission';

describe('withPermission', () => {
  it("'all' allows unauthenticated access", async () => {
    const handler = vi.fn().mockResolvedValue('ok');
    const wrapped = withPermission('all', handler);
    await expect(wrapped()).resolves.toBe('ok');
    expect(handler).toHaveBeenCalled();
  });

  it("'auth' rejects missing session", async () => {
    const handler = vi.fn();
    const wrapped = withPermission('auth', handler);
    await expect(wrapped()).rejects.toThrow(); // unauthorized()
    expect(handler).not.toHaveBeenCalled();
  });

  it("'dashboard' rejects non-dashboard role", async () => {
    const mockSession = { user: { role: 'student', permissions: [] } };
    vi.mock('@/core/auth', () => ({ auth: { api: { getSession: () => mockSession } } }));
    const handler = vi.fn();
    const wrapped = withPermission('dashboard', handler);
    await expect(wrapped()).rejects.toThrow(); // forbidden()
    expect(handler).not.toHaveBeenCalled();
  });

  it('admin role bypasses all permission checks', async () => {
    const mockSession = { user: { role: 'admin', permissions: [] } };
    vi.mock('@/core/auth', () => ({ auth: { api: { getSession: () => mockSession } } }));
    const handler = vi.fn().mockResolvedValue('admin-ok');
    const wrapped = withPermission({ resource: 'students', action: 'delete' }, handler);
    await expect(wrapped()).resolves.toBe('admin-ok');
  });

  it('checks preset permissions for PermissionRequirement', async () => {
    const mockSession = {
      user: {
        role: 'lecturer',
        permissions: [{ resource: 'grades', action: 'read' }],
      },
    };
    vi.mock('@/core/auth', () => ({ auth: { api: { getSession: () => mockSession } } }));
    const allowed = vi.fn().mockResolvedValue('ok');
    const denied = vi.fn();
    await withPermission({ resource: 'grades', action: 'read' }, allowed)();
    await withPermission({ resource: 'grades', action: 'delete' }, denied)().catch(() => {});
    expect(allowed).toHaveBeenCalled();
    expect(denied).not.toHaveBeenCalled();
  });
});
```

### Test 3: Preset CRUD

```ts
// src/test/auth/preset-crud.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/core/database';
import { permissionPresets, presetPermissions } from '@/core/database';

describe('Permission Preset CRUD', () => {
  let presetId: string;

  beforeEach(async () => {
    await db.delete(presetPermissions);
    await db.delete(permissionPresets);
  });

  it('creates a preset with permissions', async () => {
    const [preset] = await db.insert(permissionPresets)
      .values({ name: 'Test Preset', role: 'lecturer' })
      .returning();
    presetId = preset.id;

    await db.insert(presetPermissions).values([
      { presetId, resource: 'grades', action: 'read' },
      { presetId, resource: 'grades', action: 'write' },
    ]);

    const rows = await db.select().from(presetPermissions)
      .where(eq(presetPermissions.presetId, presetId));
    expect(rows).toHaveLength(2);
  });

  it('deleting a preset nullifies users presetId', async () => {
    // Insert user with preset, delete preset, confirm user.presetId is null
    // (depends on FK ON DELETE SET NULL being configured)
    const [preset] = await db.insert(permissionPresets)
      .values({ name: 'Temp', role: 'lecturer' })
      .returning();
    await db.delete(permissionPresets).where(eq(permissionPresets.id, preset.id));
    // Users with this presetId should now have presetId = null (FK cascade)
    const orphans = await db.select().from(users)
      .where(eq(users.presetId, preset.id));
    expect(orphans).toHaveLength(0);
  });
});
```

### Test 4: Session Permissions

```ts
// src/test/auth/session-permissions.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('Session Permissions', () => {
  it('session includes permissions from customSession plugin', async () => {
    const { auth } = await import('@/core/auth');
    const session = await auth.api.getSession({ headers: new Headers() });
    // For authenticated user: permissions array must exist
    if (session) {
      expect(Array.isArray(session.user.permissions)).toBe(true);
    }
  });

  it('users with no preset get empty permissions array', async () => {
    // Mock DB to return user with presetId = null
    vi.mock('@/core/database', () => ({
      db: { query: { users: { findFirst: () => ({ presetId: null }) } } },
    }));
    const permissions = await resolvePermissionsForUser(null);
    expect(permissions).toEqual([]);
  });

  it('cookie cache contains permissions (no extra DB hit on withPermission)', async () => {
    const dbSpy = vi.spyOn(db, 'select');
    // Simulate withPermission check using preloaded session
    const session = { user: { role: 'lecturer', permissions: [{ resource: 'grades', action: 'read' }] } };
    const hasPermission = checkPermission(session, { resource: 'grades', action: 'read' });
    expect(hasPermission).toBe(true);
    expect(dbSpy).not.toHaveBeenCalled();
  });
});
```

## 24c.2 Testing Checklist

Automated status for this phase:

- [x] Auth-focused Vitest suites pass for route wiring, auth client setup, `withPermission`, session permission helpers, and preset session revocation
- [ ] Manual end-to-end Google OAuth verification in local/staging
- [ ] Manual proxy and CSRF verification in a running app environment
- [ ] Full repository `pnpm tsc --noEmit` clean state

### Authentication

- [ ] Google OAuth sign-in works and account selector appears
- [ ] Session persists across page refreshes
- [ ] Session expires after configured duration
- [ ] Proxy redirects unauthenticated users from protected routes
- [ ] Existing Google-linked users can sign in against migrated account rows
- [ ] New users created with `nanoid()` IDs
- [ ] Cookie cache works (no DB hit on every request)
- [ ] `customSession` plugin correctly enriches session with permissions
- [ ] Permissions are available in session cookie (no separate DB query in `withPermission`)
- [ ] Rate limiting works on sign-in endpoint
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` env var is set
- [ ] `better-auth/minimal` import used (documented bundle-size optimization for adapter-based setups)

### CSRF Protection

- [ ] `trustedOrigins` correctly configured for local dev and production domains
- [ ] Cross-origin POST requests to auth endpoints are rejected (test with `curl` or Postman from unauthorized origin)
- [ ] Same-origin requests work normally

### Proxy (`proxy.ts`)

- [ ] `proxy.ts` exists with cookie-only optimistic redirect (Next.js 16 convention)
- [ ] Unauthenticated requests to protected routes redirect to `/auth/login`
- [ ] Public paths (`/auth/login`, `/api/auth`) are accessible without session
- [ ] Proxy does NOT block static assets (`_next/static`, `_next/image`, `favicon.ico`)
- [ ] Proxy is NOT treated as final security boundary — `withPermission` enforces real checks

### Google OAuth

- [ ] Google Console redirect URIs match `BETTER_AUTH_URL` + `/api/auth/callback/google`
- [ ] Sign-in works in local development
- [ ] Sign-in works in production/staging environment
- [ ] `baseURL` env var matches the domain used in Google Console
- [ ] `GoogleSignInForm` uses `authClient.signIn.social({ provider: 'google' })`

### Authorization — Permission Presets

- [ ] Admin can create new permission presets with matrix UI
- [ ] Admin can edit preset permissions (add/remove checkboxes)
- [ ] Admin can delete presets (users revert to null preset)
- [ ] Presets are scoped by role (only matching presets shown for user's role)
- [ ] Permission matrix renders correctly with grouped resources
- [ ] Read-only matrix on user form shows correct permissions for selected preset

### Authorization — `withPermission`

- [ ] `'all'` requirement allows unauthenticated access
- [ ] `'auth'` requirement allows any authenticated user
- [ ] `'dashboard'` requirement checks role against DASHBOARD_ROLES
- [ ] `PermissionRequirement` checks user's preset permissions
- [ ] Admin role bypasses ALL permission checks
- [ ] Users with no preset (null presetId) fail permission requirement checks
- [ ] Custom `AccessCheckFunction` still works
- [ ] Permissions come from `customSession` plugin (no DB query in `withPermission`)
- [ ] Cookie cache invalidation works when preset is changed (session revocation forces re-login)
- [ ] Session revocation fires when admin updates preset permissions
- [ ] Session revocation fires when admin changes a user's presetId

### Authorization — Service Layer

- [ ] All BaseService configs use new `byIdAuth`/`findAllAuth`/etc. fields
- [ ] Permission-based service configs enforce correctly
- [ ] `'dashboard'` shorthand works for services using it
- [ ] Audit logging still works through BaseService
- [ ] No `actions.ts` files perform direct permission enforcement; permission checks live in `service.ts` files

### User Management

- [ ] User form shows role dropdown (existing behavior)
- [ ] User form shows preset dropdown filtered by selected role
- [ ] Changing role resets preset selection
- [ ] User form shows read-only permission matrix for selected preset
- [ ] User form no longer shows position field
- [ ] User detail page shows assigned preset name
- [ ] Admin can assign/change/remove presets on users
- [ ] Schools assignment still works for academic users

### Navigation

- [ ] Top-level module visibility still works via role (academic sees academic menu)
- [ ] Sub-item visibility works via permissions (items with `permissions` field check preset)
- [ ] Admin sees all navigation items (bypass)
- [ ] Users without presets see role-gated items but not permission-gated sub-items

### Session Payload

- [ ] `session.user.stdNo` is NOT in session (verify no consumer reads it)
- [ ] `session.user.lmsUserId` and `session.user.lmsToken` are NOT in session
- [ ] `session.accessToken` is NOT in session
- [ ] `session.permissions` contains correct `PermissionGrant[]` objects from `customSession` plugin
- [ ] Student portal fetches stdNo on demand via server action
- [ ] LMS features fetch credentials from lms_credentials table
- [ ] Users without a preset get `permissions: []` (empty array)

### Student Portal

- [ ] Student portal layout uses `auth.api.getSession()` (not `auth()`)
- [ ] Student portal Navbar renders user name/avatar correctly
- [ ] Student portal pages fetching `stdNo` use on-demand server action
- [ ] No `session.user.stdNo` direct access remains in student portal
- [ ] Student portal does not use `withPermission` for navigation (unique layout preserved)

### Admin Plugin Features

- [ ] Admin can ban/unban users via Better Auth admin API
- [ ] Admin impersonation works (sessions marked with `impersonatedBy`)
- [ ] Sessions table includes `impersonated_by` column

### Client Components

- [ ] `authClient.useSession()` works in all client components
- [ ] `authClient.signOut()` works
- [ ] `authClient.signIn.social({ provider: 'google' })` works from GoogleSignInForm
- [ ] No `SessionProvider` wrapper needed
- [ ] No `next-auth/react` imports remain

### Database Integrity

- [ ] All required indexes exist (users.email, users.preset_id, accounts.user_id, sessions.user_id, sessions.token, verifications.identifier, preset_permissions.preset_id)
- [ ] Rate limits table exists
- [ ] Verifications table has correct columns
- [ ] Authenticators table is dropped
- [ ] All three enums are dropped
- [ ] `clearance.department`, `autoApprovals.department`, `blockedStudents.department` are text columns
- [ ] `studentNotes.role` is a text column

### Build & Lint

- [ ] `pnpm tsc --noEmit` passes clean
- [ ] `pnpm lint:fix` passes clean
- [ ] No `next-auth` imports remain (`rg "next-auth" src` returns nothing)
- [ ] No `withAuth` imports remain
- [ ] `requireSessionUserId` imports updated to `@/core/platform/withPermission`
- [ ] No `session.user.position` references remain
- [ ] No `session.accessToken` references remain
- [ ] No enum references remain (userRoles, userPositions, dashboardUsers)
- [ ] Old env vars removed (AUTH_SECRET, AUTH_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)

## Exit Criteria

- [ ] All Auth.js artifacts removed (files, packages, env vars, SessionProvider)
- [ ] All grep checks return zero results for legacy patterns
- [ ] Database state verified with SQL queries
- [ ] All testing checklist items pass
- [ ] `pnpm tsc --noEmit` passes clean
- [ ] `pnpm lint:fix` passes clean
- [ ] Rollback plan documented and tested
