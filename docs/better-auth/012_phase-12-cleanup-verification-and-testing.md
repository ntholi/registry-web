# Phase 12: Cleanup, Verification & Testing

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phases 1–11 complete. Read `000_steering.md` first.

## 12.1 Remove Auth.js Artifacts

### Delete Files

- `next-auth.d.ts`
- `src/core/auth.legacy.ts` (the renamed old Auth.js config)
- `src/core/platform/withAuth.ts` (already deleted in Phase 4, verify)
- `src/app/auth/auth-providers/_schema/authenticators.ts` (already deleted in Phase 2, verify)
- `src/app/api/auth/[...nextauth]/route.ts` (already deleted in Phase 3, verify)
- Any test mocks for withAuth (e.g., `src/test/mock.withAuth.ts`)

### Remove from Relations

- Remove `authenticatorsRelations` from `src/app/auth/auth-providers/_schema/relations.ts`

### Remove Packages

```bash
pnpm remove next-auth @auth/drizzle-adapter
```

### Remove SessionProvider

- Remove `SessionProvider` wrapper from `src/app/providers.tsx` (already done in Phase 8, verify)
- Remove `next-auth/react` import from providers

### Grep Verification

```bash
grep -r "next-auth" src/
grep -r "from 'next-auth'" src/
grep -r "@auth/drizzle-adapter" src/
grep -r "withAuth" src/
grep -r "session.user.position" src/
grep -r "session.user.stdNo" src/
grep -r "session.user.lmsUserId" src/
grep -r "session.user.lmsToken" src/
grep -r "session.accessToken" src/
grep -r "userPositions" src/
grep -r "dashboardUsers" src/
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

## 12.2 Remove Obsolete Enum References

Verify that no TypeScript code references:
- `dashboardUsers` enum
- `userRoles` enum
- `userPositions` enum
- `UserPosition` type
- `DashboardUser` type (replaced by `DashboardRole` from permissions.ts)

These enums were dropped in Phase 3 database migration. All code referencing them must have been updated in earlier phases.

## 12.3 Update Type Exports

Ensure `src/app/auth/users/_schema/users.ts` no longer exports:
- `dashboardUsers`
- `userRoles`
- `userPositions`

Any file that imported these types must be updated to use:
- `UserRole` from `@/core/auth/permissions` (string union replacing `userRoles` enum)
- `DashboardRole` from `@/core/auth/permissions` (string union replacing `dashboardUsers` enum)
- `DASHBOARD_ROLES` from `@/core/auth/permissions`
- Plain string types for role values

## 12.4 Verify Database State

Run these queries to confirm migration completeness:

```sql
-- All users with positions should now have presets
SELECT count(*) FROM users WHERE preset_id IS NULL AND role NOT IN ('user', 'applicant', 'student');
-- Expected: 0 (all staff users have presets)

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

## 12.5 Testing Checklist

### Authentication

- [ ] Google OAuth sign-in works and account selector appears
- [ ] Session persists across page refreshes
- [ ] Session expires after configured duration
- [ ] Middleware redirects unauthenticated users from protected routes
- [ ] Existing Google-linked users can sign in against migrated account rows
- [ ] New users created with `nanoid()` IDs
- [ ] Cookie cache works (no DB hit on every request)
- [ ] `customSession` plugin correctly enriches session with permissions
- [ ] Permissions are available in session cookie (no separate DB query in `withPermission`)
- [ ] Rate limiting works on sign-in endpoint
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` env var is set
- [ ] Standard `better-auth` import used (not `better-auth/minimal`)

### CSRF Protection

- [ ] `trustedOrigins` correctly configured for local dev and production domains
- [ ] Cross-origin POST requests to auth endpoints are rejected (test with `curl` or Postman from unauthorized origin)
- [ ] Same-origin requests work normally

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
- [ ] Cookie cache invalidation works when preset is changed (session `cookieCache.version` bump)

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
- [ ] `session.permissions` contains correct permission strings from `customSession` plugin
- [ ] Student portal fetches stdNo on demand via server action
- [ ] LMS features fetch credentials from lms_credentials table
- [ ] Users without a preset get `permissions: []` (empty array)

### Admin Plugin Features

- [ ] Admin can ban/unban users via Better Auth admin API
- [ ] Admin impersonation works (sessions marked with `impersonatedBy`)
- [ ] Sessions table includes `impersonated_by` column

### Client Components

- [ ] `authClient.useSession()` works in all client components
- [ ] `authClient.signOut()` works
- [ ] No `SessionProvider` wrapper needed
- [ ] No `next-auth/react` imports remain

### Database Integrity

- [ ] All required indexes exist (users.email, accounts.user_id, sessions.user_id, sessions.token, verifications.identifier, preset_permissions.preset_id)
- [ ] Rate limits table exists
- [ ] Verifications table has correct columns
- [ ] Authenticators table is dropped
- [ ] All three enums are dropped
- [ ] `clearance.department`, `autoApprovals.department`, `blockedStudents.department` are text columns
- [ ] `studentNotes.role` is a text column

### Build & Lint

- [ ] `pnpm tsc --noEmit` passes clean
- [ ] `pnpm lint:fix` passes clean
- [ ] No `next-auth` imports remain (`grep -r "next-auth" src/` returns nothing)
- [ ] No `withAuth` imports remain
- [ ] No `session.user.position` references remain
- [ ] No `session.accessToken` references remain
- [ ] No enum references remain (userRoles, userPositions, dashboardUsers)
- [ ] Old env vars removed (AUTH_SECRET, AUTH_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)

## 12.6 Rollback Plan

### Before Starting Migration

1. Full DB backup:
   ```bash
   pg_dump -Fc registry > registry-pre-betterauth-$(date +%Y%m%d).dump
   ```
2. Work on dedicated branch: `feat/better-auth-migration`
3. Backup `.env` to `.env.backup`

### Rollback Procedure

```bash
# Restore database
pg_restore -d registry registry-pre-betterauth-YYYYMMDD.dump

# Restore code
git checkout develop

# Restore env
cp .env.backup .env
```

### Communication Plan

- Schedule migration during low-usage window
- Notify all users they will need to sign in again after migration
- Have the admin verify preset assignments after migration

## 12.7 Post-Migration Monitoring

After deploying:

1. Monitor auth error rates for 24 hours
2. Verify all department heads can access their modules
3. Spot-check permission enforcement on key actions (grade approval, student registration, etc.)
4. Confirm no permission gaps (users who had position-based access still have equivalent preset access)
5. Review rate limiting behavior (not too aggressive for normal usage)

## Migration Execution Order (Commit Summary)

### Commit 1: Foundation (Phase 1)
- Install Better Auth packages
- Create auth config files (auth.ts, auth-client.ts)
- Create permissions catalog
- Create new schema files
- Update barrel exports
- Create proxy.ts

### Commit 2: Schema Updates (Phase 2)
- Update Drizzle schema TypeScript files
- Generate Drizzle migration
- Update dependent schemas (enum→text)

### Commit 3: Data Migration (Phase 3)
- Run schema migration
- Migrate account data
- Seed permission presets
- Migrate positions → preset assignments
- Extract LMS credentials
- Swap route handler

### Commit 4: Authorization Wrapper (Phase 4)
- Create withPermission
- Update BaseService
- Delete withAuth

### Commits 5–7: Service Migration (Phases 5–7)
- Academic services (Phase 5)
- Registry + Admin services (Phase 6)
- Admissions, finance, timetable, library services + standalone actions (Phase 7)

### Commit 8: Client Migration (Phase 8)
- Replace all next-auth imports
- Replace useSession, signOut, SessionProvider
- Replace position checks with permission checks
- stdNo on-demand fetching

### Commit 9: LMS + Navigation (Phase 9)
- LMS credential on-demand reads
- NavItem permissions field
- Dashboard shell permission checking
- Module config updates

### Commit 10: Preset Backend (Phase 10)
- Permission preset CRUD (repository, service, actions, pages)

### Commit 11: Preset UI (Phase 11)
- PermissionMatrix component
- Preset Form component
- User form update (preset dropdown, read-only matrix)

### Commit 12: Cleanup (Phase 12)
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
