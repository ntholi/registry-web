# Phase 5: Cleanup & Testing

**Prerequisites**: Phases 1–4 complete. Read `000_steering-document.md` first.

## 5.1 Remove Auth.js Artifacts

### Delete Files

- `next-auth.d.ts`
- `src/core/auth.legacy.ts` (the renamed old Auth.js config)
- `src/core/platform/withAuth.ts` (already deleted in Phase 3, verify)
- `src/app/auth/auth-providers/_schema/authenticators.ts` (already deleted in Phase 2, verify)
- `src/app/api/auth/[...nextauth]/route.ts` (already deleted in Phase 2, verify)
- Any test mocks for withAuth (e.g., `src/test/mock.withAuth.ts`)

### Remove from Relations

- Remove `authenticatorsRelations` from `src/app/auth/auth-providers/_schema/relations.ts`

### Remove Packages

```bash
pnpm remove next-auth @auth/drizzle-adapter
```

### Remove SessionProvider

- Remove `SessionProvider` wrapper from `src/app/providers.tsx`
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
grep -r "userPositions" src/
grep -r "dashboardUsers" src/
```

All of these must return **zero** results.

## 5.2 Remove Obsolete Enum References

Verify that no TypeScript code references:
- `dashboardUsers` enum
- `userRoles` enum
- `userPositions` enum
- `UserPosition` type
- `DashboardUser` type (replaced by `DashboardRole` from permissions.ts)

These enums were dropped in Phase 2 database migration. All code referencing them must have been updated in Phase 3.

## 5.3 Update Type Exports

Ensure `src/app/auth/users/_schema/users.ts` no longer exports:
- `dashboardUsers`
- `userRoles`
- `userPositions`

Any file that imported these types must be updated to use:
- `DASHBOARD_ROLES` from `@/core/auth/permissions`
- Plain string types for role values

## 5.4 Verify Database State

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

## 5.5 Testing Checklist

### Authentication

- [ ] Google OAuth sign-in works and account selector appears
- [ ] Session persists across page refreshes
- [ ] Session expires after configured duration
- [ ] Proxy redirects unauthenticated users from protected routes
- [ ] Existing Google-linked users can sign in against migrated account rows
- [ ] New users created with `nanoid()` IDs
- [ ] Cookie cache works (no DB hit on every request)
- [ ] Rate limiting works on sign-in endpoint
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` env var is set
- [ ] `better-auth/minimal` is used (check bundle)

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
- [ ] `cache()` deduplication works (single DB query for multiple withPermission calls per request)

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
- [ ] Student portal fetches stdNo on demand via server action
- [ ] LMS features fetch credentials from lms_credentials table

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
- [ ] clearance.department and autoApprovals.department are text columns

### Build & Lint

- [ ] `pnpm tsc --noEmit` passes clean
- [ ] `pnpm lint:fix` passes clean
- [ ] No `next-auth` imports remain (`grep -r "next-auth" src/` returns nothing)
- [ ] No `withAuth` imports remain
- [ ] No `session.user.position` references remain
- [ ] No enum references remain (userRoles, userPositions, dashboardUsers)

## 5.6 Rollback Plan

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

## 5.7 Post-Migration Monitoring

After deploying:

1. Monitor auth error rates for 24 hours
2. Verify all department heads can access their modules
3. Spot-check permission enforcement on key actions (grade approval, student registration, etc.)
4. Confirm no permission gaps (users who had position-based access still have equivalent preset access)
5. Review rate limiting behavior (not too aggressive for normal usage)

## Migration Execution Order (Summary)

### Commit 1: Foundation
- Install Better Auth packages
- Create auth config files (auth.ts, auth-client.ts)
- Create permissions catalog
- Create new schema files
- Update barrel exports
- Create proxy.ts

### Commit 2: Database Migration
- Generate Drizzle migrations
- Run schema changes (enums → text, add/remove columns)
- Migrate account data
- Create permission preset tables
- Seed predefined presets
- Migrate positions → preset assignments
- Extract LMS credentials
- Swap route handler

### Commit 3: Authorization Wrapper
- Create withPermission
- Update BaseService
- Delete withAuth

### Commits 4–7: Service Migration (by module)
- Academic services
- Registry services
- Admin, finance, admissions services
- Timetable, library services

### Commit 8: Client Migration
- Replace all next-auth imports
- Replace useSession, signOut, SessionProvider
- Replace position checks with permission checks

### Commit 9: Preset Management UI
- Permission preset CRUD pages
- PermissionMatrix component

### Commit 10: User Form Update
- Preset dropdown
- Read-only matrix
- Remove position field

### Commit 11: Navigation Updates
- NavItem permissions field
- Dashboard shell permission checking
- Module config updates

### Commit 12: LMS + Student Portal
- LMS credential on-demand reads
- stdNo on-demand fetching

### Commit 13: Cleanup
- Remove Auth.js packages
- Delete obsolete files
- Verify zero legacy references

### Commit 14: Final Verification
- Run full test checklist
- `pnpm tsc --noEmit && pnpm lint:fix`
- Database verification queries
