# Phase 24b: Schema Cleanup & Verification

> Estimated Implementation Time: 25–35 minutes

**Prerequisites**: Phase 24a complete.

## 24b.1 Drop `users.position` Column

Phase 6 kept `users.position` for type compatibility. Remove it now:

1. Create a final custom migration with `pnpm db:generate --custom`
2. Add `ALTER TABLE users DROP COLUMN position;` to that migration
3. Apply the migration
4. Remove the `position` field from `src/app/auth/users/_schema/users.ts`
5. Remove any remaining `userPositions`, `UserPosition`, or related compatibility exports from that file
6. Run `pnpm db:generate` to update the schema snapshot if needed
7. Run `pnpm tsc --noEmit` and confirm no `position` references remain

## 24b.2 Remove Obsolete Enum References

Verify that no TypeScript code references:
- `dashboardUsers` enum
- `userRoles` enum
- `userPositions` enum
- `UserPosition` type
- `DashboardUser` type (replaced by `DashboardRole` from permissions.ts)

These enums were dropped in Phase 5 database migration. All code referencing them must have been updated in earlier phases.

## 24b.3 Update Type Exports

Ensure `src/app/auth/users/_schema/users.ts` no longer exports:
- `dashboardUsers`
- `userRoles`
- `userPositions`

Any file that imported these types must be updated to use:
- `UserRole` from `@/core/auth/permissions` (string union replacing `userRoles` enum)
- `DashboardRole` from `@/core/auth/permissions` (string union replacing `dashboardUsers` enum)
- `DASHBOARD_ROLES` from `@/core/auth/permissions`
- Plain string types for role values

## 24b.4 Grep Verification

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

Also verify the final authorization ownership boundary:

- There should be no `actions.ts` files that perform permission checks directly
- Permission checks belong in `service.ts` files (or `BaseService` config), with `actions.ts` acting only as thin transport wrappers
- If an `actions.ts` file still calls `withPermission` for authorization, move that check into the owning service before closing the migration

## 24b.5 Verify Proxy

Confirm `proxy.ts` exists with:
- Cookie-only session check (no DB hit)
- Public path exclusions (`/auth/login`, `/api/auth`)
- Redirect to `/auth/login?callbackUrl=...` for unauthenticated users
- Proper `matcher` config excluding static assets

## 24b.6 Verify Database State

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

## 24b.7 Rollback Plan

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

## 24b.8 Post-Migration Monitoring

After deploying:

1. Monitor auth error rates for 24 hours
2. Verify all department heads can access their modules
3. Spot-check permission enforcement on key actions (grade approval, student registration, etc.)
4. Confirm no permission gaps (users who had position-based access still have equivalent preset access)
5. Review rate limiting behavior (not too aggressive for normal usage)
