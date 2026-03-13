# Phase 24: Cleanup, Verification & Testing

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phases 1–23 complete. Read `000_overview.md` first.

## 24.1 Remove Auth.js Artifacts

### Delete Files

- `next-auth.d.ts`
- `src/core/auth.legacy.ts` (the renamed old Auth.js config)
- `src/core/platform/withAuth.ts` (already deleted in Phase 7, verify)
- `src/app/auth/auth-providers/_schema/authenticators.ts` (already deleted in Phase 3, verify)
- `src/app/api/auth/[...nextauth]/route.ts` (already deleted in Phase 6, verify)
- Any test mocks for withAuth (e.g., `src/test/mock.withAuth.ts`)

### Clean Up `src/core/auth.ts` Legacy Re-exports

After deleting `src/core/auth.legacy.ts`, update `src/core/auth.ts` to remove all legacy NextAuth re-exports:

- Remove `import { handlers, auth as legacyAuth, signIn, signOut } from './auth.legacy'`
- Remove `export const auth = legacyAuth`
- Remove `export { handlers, legacyAuth, signIn, signOut }`
- Rename `betterAuthServer` to `auth` so downstream code uses `auth` directly
- Update `src/app/api/auth/[...all]/route.ts` to import `auth` (instead of `betterAuthServer`)

### Remove from Relations

- Remove `authenticatorsRelations` from `src/app/auth/auth-providers/_schema/relations.ts`

### Remove Packages

```bash
pnpm remove next-auth @auth/drizzle-adapter
```

### Remove SessionProvider

- Remove `SessionProvider` wrapper from `src/app/providers.tsx` (already done in Phase 15, verify)
- Remove `next-auth/react` import from providers

### Grep Verification

```bash
rg "next-auth" src
rg "from 'next-auth'" src
rg "@auth/drizzle-adapter" src
rg "withAuth" src
rg "requireSessionUserId.*withAuth" src
rg "session.user.position" src
rg "session.user.stdNo" src
rg "session.user.lmsUserId" src
rg "session.user.lmsToken" src
rg "session.accessToken" src
rg "userPositions" src
rg "dashboardUsers" src
```

All of these must return **zero** results.

### Remove Old Environment Variables

Delete from `.env` and any deployment configs:
- `AUTH_SECRET` (replaced by `BETTER_AUTH_SECRET`)
- `AUTH_URL` (replaced by `BETTER_AUTH_URL`)
- `AUTH_GOOGLE_ID` (replaced by `GOOGLE_CLIENT_ID`)
- `AUTH_GOOGLE_SECRET` (replaced by `GOOGLE_CLIENT_SECRET`)

### Remove `authInterrupts`

**Keep `authInterrupts: true`** in `next.config.ts` — it is still required for `unauthorized()` and `forbidden()` support in `withPermission`. Do NOT remove it.

### Verify Proxy

Confirm `proxy.ts` exists with:
- Cookie-only session check (no DB hit)
- Public path exclusions (`/auth/login`, `/api/auth`)
- Redirect to `/auth/login?callbackUrl=...` for unauthenticated users
- Proper `matcher` config excluding static assets

## 24.2 Remove Obsolete Enum References

Verify that no TypeScript code references:
- `dashboardUsers` enum
- `userRoles` enum
- `userPositions` enum
- `UserPosition` type
- `DashboardUser` type (replaced by `DashboardRole` from permissions.ts)

These enums were dropped in Phase 5 database migration. All code referencing them must have been updated in earlier phases.

## 24.3 Update Type Exports

Ensure `src/app/auth/users/_schema/users.ts` no longer exports:
- `dashboardUsers`
- `userRoles`
- `userPositions`

Any file that imported these types must be updated to use:
- `UserRole` from `@/core/auth/permissions` (string union replacing `userRoles` enum)
- `DashboardRole` from `@/core/auth/permissions` (string union replacing `dashboardUsers` enum)
- `DASHBOARD_ROLES` from `@/core/auth/permissions`
- Plain string types for role values

## 24.4 Verify Database State

Run these queries to confirm migration completeness:

```sql
-- All users with positions should now have presets
SELECT count(*) FROM users WHERE preset_id IS NULL AND role NOT IN ('user', 'applicant', 'student', 'admin');
-- Expected: 0 (all staff users have presets, admin bypasses permissions)

-- Permission presets exist
SELECT name, role, (SELECT count(*) FROM preset_permissions WHERE preset_id = pp.id) as perm_count
FROM permission_presets pp;

-- No orphan data
SELECT count(*) FROM preset_permissions pp
LEFT JOIN permission_presets p ON pp.preset_id = p.id
WHERE p.id IS NULL;
-- Expected: 0

-- Enums dropped
SELECT typname FROM pg_type WHERE typname IN ('user_roles', 'user_positions', 'dashboard_users');
-- Expected: 0 rows

-- LMS credentials migrated
SELECT count(*) FROM lms_credentials;

-- Sessions cleared (Better Auth sessions table)
SELECT count(*) FROM sessions;
-- Expected: 0 or only new sessions

-- Verifications table exists, verification_tokens dropped
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifications');
-- Expected: true
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verification_tokens');
-- Expected: false

-- Authenticators table dropped
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'authenticators');
-- Expected: false
```

## 24.5 Integration Tests

Write at minimum these critical-path tests (using Vitest):

### Test 1: Google Sign-In Flow
- Verify the Better Auth route handler responds at `/api/auth`
- Verify `authClient.signIn.social({ provider: 'google' })` initiates the OAuth flow

### Test 2: withPermission Authorization
- `'all'` allows unauthenticated access
- `'auth'` rejects missing session (throws unauthorized)
- `'dashboard'` rejects non-dashboard roles (throws forbidden) 
- Permission requirement checks preset permissions correctly
- Admin role bypasses all permission checks

### Test 3: Preset CRUD
- Creating a preset with permissions stores rows correctly
- Updating a preset revokes affected user sessions
- Deleting a preset sets users' presetId to null

### Test 4: Session Permissions
- Session includes permissions from customSession plugin
- Users with no preset get empty permissions array
- Cookie cache contains permissions (no extra DB hit on withPermission)
- `session.permissions` uses the canonical `PermissionGrant[]` shape

## 24.6 Testing Checklist

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

### Proxy (proxy.ts)

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

### Authorization — withPermission

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

## 24.6 Rollback Plan

### Before Starting Migration

1. Full DB backup:
   ```bash
   $stamp = Get-Date -Format yyyyMMdd
   pg_dump -Fc registry | Out-File -Encoding ascii "registry-pre-betterauth-$stamp.dump"
   ```
2. Work on dedicated branch: `feat/better-auth-migration`
3. Backup `.env` to `.env.backup` with `Copy-Item .env .env.backup`

### Rollback Procedure

```bash
# Restore database
pg_restore -d registry registry-pre-betterauth-YYYYMMDD.dump

# Restore code
git checkout develop

# Restore env
Copy-Item .env.backup .env -Force
```

### Communication Plan

- Schedule migration during low-usage window
- Notify all users they will need to sign in again after migration
- Have the admin verify preset assignments after migration

## 24.7 Post-Migration Monitoring

After deploying:

1. Monitor auth error rates for 24 hours
2. Verify all department heads can access their modules
3. Spot-check permission enforcement on key actions (grade approval, student registration, etc.)
4. Confirm no permission gaps (users who had position-based access still have equivalent preset access)
5. Review rate limiting behavior (not too aggressive for normal usage)

## Migration Execution Order (Commit Summary)

### Commit 1: Foundation (Phases 1–2)
- Install Better Auth packages
- Create auth config files (auth.ts, auth-client.ts) using `better-auth/minimal`
- Create permissions catalog
- Create new schema files
- Update barrel exports

### Commit 2: Schema Updates (Phases 3–4)
- Update Drizzle schema TypeScript files
- Update Drizzle relations for Better Auth tables (join optimization)
- Create permission preset relations
- Generate Drizzle migration
- Update dependent schemas (enum→text)

### Commit 3: Data Migration (Phases 5–6)
- Run schema migration
- Migrate account data
- Seed permission presets
- Migrate positions → preset assignments
- Extract LMS credentials
- Swap route handler
- Create `proxy.ts` with cookie-only optimistic redirect
- Verify Google OAuth Console callback URIs

### Commit 4: Authorization Wrapper (Phases 7–8)
- Create withPermission
- Migrate `requireSessionUserId` to withPermission module
- Update BaseService
- Delete withAuth

### Commits 5–7: Service Migration (Phases 9–14)
- Academic services (Phases 9–10)
- Registry + Admin services (Phases 11–12)
- Admissions, finance, timetable, library services + standalone actions (Phases 13–14)

### Commit 8: Client Migration (Phases 15–17)
- Replace all next-auth imports
- Replace useSession, signOut, SessionProvider
- Migrate GoogleSignInForm to client component with `authClient.signIn.social()`
- Migrate login page session access
- Replace position checks with permission checks
- stdNo on-demand fetching
- Student portal layout and pages migrated

### Commit 9: LMS + Navigation (Phases 18–19)
- LMS credential on-demand reads
- NavItem permissions field
- Dashboard shell permission checking
- Module config updates

### Commit 10: Preset Backend (Phases 20–21)
- Permission preset CRUD (repository, service, actions, pages)
- Session revocation on preset update (affected users forced re-login)
- Session revocation on user presetId change

### Commit 11: Preset UI (Phases 22–23)
- PermissionMatrix component
- Preset Form component
- User form update (preset dropdown, read-only matrix)

### Commit 12: Cleanup (Phase 24)
- Remove Auth.js packages
- Delete obsolete files
- Verify zero legacy references
- Run full test checklist

## Exit Criteria

- [ ] All Auth.js artifacts removed (files, packages, env vars, SessionProvider)
- [ ] All grep checks return zero results for legacy patterns
- [ ] Database state verified with SQL queries
- [ ] All testing checklist items pass
- [ ] `pnpm tsc --noEmit` passes clean
- [ ] `pnpm lint:fix` passes clean
- [ ] Rollback plan documented and tested
