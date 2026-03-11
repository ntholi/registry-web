# Phase 4: Cleanup & Testing

Status: maintain this phase document together with `better-auth-documentation.md`.

If this file conflicts with `better-auth-documentation.md`, use `better-auth-documentation.md` as the authoritative source.

## 4.1 Remove Auth.js Artifacts
- Delete `next-auth.d.ts`
- Delete `src/core/platform/withAuth.ts`
- Delete `src/app/auth/auth-providers/_schema/authenticators.ts`
- Remove `authenticatorsRelations` from `src/app/auth/auth-providers/_schema/relations.ts`
- Remove `next-auth` and `@auth/drizzle-adapter` from `package.json` (this is when these packages are finally removed, not in Phase 1)
- Remove `SessionProvider` from `src/app/providers.tsx`
- Remove all imports from `next-auth` and `next-auth/react`

## 4.2 Dashboard Navigation

File: `src/app/dashboard/module-config.types.ts`

- Update `NavItem.roles` to permission-based visibility, or
- keep role-based nav visibility and enforce permissions at action layer

Prefer the smallest change that preserves current navigation behavior during the migration.

## 4.3 Delete Obsolete Files
- `src/app/api/auth/[...nextauth]/route.ts` (already deleted atomically in Phase 2.9)
- `src/core/auth.legacy.ts` (old Auth.js config preserved during migration)
- `next-auth.d.ts`
- `src/core/platform/withAuth.ts`
- `src/app/auth/auth-providers/_schema/authenticators.ts`
- `src/test/mock.withAuth.ts`

## 4.4 Testing Checklist
- [ ] Google OAuth sign-in works and account selector appears
- [ ] Session persists across refreshes
- [ ] Proxy redirects unauthenticated users from protected routes
- [ ] Proxy file is at project root (`proxy.ts`), not in `src/`
- [ ] `serverExternalPackages: ['better-auth']` is in `next.config.ts`
- [ ] `trustedOrigins` uses `BETTER_AUTH_TRUSTED_ORIGINS` env var
- [ ] Role field validates against the defined enum array (rejects invalid role strings)
- [ ] `human_resource` role is included in the role type array
- [ ] Admin can manage user roles via Better Auth admin API
- [ ] Admin impersonation works and sessions are marked with `impersonatedBy`
- [ ] Sessions table includes `impersonated_by` column (added by admin plugin)
- [ ] Permission presets populate `user_permissions`
- [ ] Per-user permission overrides work (grant + revoke)
- [ ] `withPermission` merges role defaults + overrides correctly
- [ ] `withPermission` `'dashboard'` shorthand works for dashboard-level roles
- [ ] Server actions enforce correct permissions
- [ ] Client conditional rendering uses permission checks
- [ ] Student portal auth works
- [ ] Apply portal auth works (all 8 files migrated)
- [ ] LMS auth guard works with `lms_credentials` table (not session fields)
- [ ] All 15+ LMS files read credentials from `lms_credentials` table, not session
- [ ] All 40+ position field references replaced with permission-based checks
- [ ] Account linking works for existing Google users
- [ ] `encryptOAuthTokens: true` is active (existing tokens encrypt on next sign-in via `updateAccountOnSignIn`)
- [ ] Database indexes exist on: users.email, accounts.user_id, sessions.user_id, sessions.token, verifications.identifier, rate_limits.key
- [ ] `rate_limits` table exists with unique index on `key`
- [ ] `verification_tokens` table renamed to `verifications` with correct columns
- [ ] `authenticators` table dropped
- [ ] `dashboardUsers`, `userRoles`, `userPositions` enums dropped after column conversions
- [ ] `clearance.department` and `autoApprovals.department` columns converted to text
- [ ] No `next-auth` imports remain (`grep -r "next-auth" src/` returns nothing)
- [ ] `pnpm tsc --noEmit && pnpm lint:fix` passes clean
- [ ] `account.updateAccountOnSignIn: true` is set (OAuth tokens refresh on each sign-in)
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` is NOT set (client auto-discovers, unnecessary env var)
- [ ] `better-auth/minimal` is used for bundle size
- [ ] `stdNo` is accessed via dedicated `getStudentByUserId()` server action, NOT from session
- [ ] Student portal components updated to use on-demand `stdNo` fetching
- [ ] `session.accessToken` field removed (confirmed no consumers outside callback)
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` env var is set in all environments
- [ ] Client `authClient` uses `inferAdditionalFields<typeof auth>()` plugin (not type parameter)
- [ ] Admin plugin is imported from `better-auth/plugins`
- [ ] Drizzle adapter imported from `better-auth/adapters/drizzle`
- [ ] `schema` is exported from `src/core/database/index.ts` with all new tables included
- [ ] New schema barrel exports updated (`userPermissions`, `lmsCredentials`, `rateLimits`)
- [ ] GoogleSignInForm uses module-level server action with `signInSocial()` + `redirect()`
- [ ] Login page uses `auth.api.getSession()` for redirect logic
- [ ] Account-setup page uses `authClient.useSession()`
- [ ] Root page (`src/app/page.tsx`) uses hardcoded role list instead of `dashboardUsers` enum
- [ ] BaseService config types updated from `Role[]` to permission requirements
- [ ] BaseService `buildAuditOptions()` uses Better Auth `Session` type
- [ ] `withPermission` uses React `cache()` for per-request permission dedup
- [ ] `authInterrupts: true` removed from `next.config.ts`
- [ ] User IDs generated with `nanoid()` (consistent with existing IDs)
- [ ] `/apply/:path*` included in proxy matcher
- [ ] Auth route handler at `[...all]` (swapped in Phase 2 after DB migration)

---

## Rollback Plan

### Before Starting
1. Full DB backup: `pg_dump -Fc registry > registry-pre-betterauth-$(date +%Y%m%d).dump`
2. Use dedicated branch `feat/better-auth-migration`
3. Backup `.env` to `.env.backup`

### Phase 1 Rollback
- `git checkout main`

### Phase 2 Rollback
- `pg_restore -d registry registry-pre-betterauth-YYYYMMDD.dump`
- `git checkout main`
- Restore `.env.backup` to `.env`

### Phase 3–4 Rollback
- Option A: Fix issues on migration branch
- Option B: Full rollback (DB restore + `git checkout main` + env restore)

### Communication Plan
- Schedule migration in low-usage window
- Notify users they may need to sign in again
- Expect session invalidation and re-authentication

---

## Key Implementation Notes

### Better Auth Session Access (Server Components)
```ts
import { auth } from "@/core/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
```

### Better Auth Session Access (Client Components)
```ts
import { authClient } from "@/core/auth-client";

const { data: session, isPending } = authClient.useSession();
```

### Better Auth Sign-In (Server Action)
```ts
'use server';

import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signInWithGoogle(callbackURL: string) {
  const result = await auth.api.signInSocial({
    body: { provider: "google", callbackURL },
    headers: await headers(),
  });
  if (result.url) redirect(result.url);
}
```

### Better Auth Sign-Out (Client)
```ts
import { authClient } from "@/core/auth-client";
await authClient.signOut();
```

### Permission Check (Server)
```ts
await auth.api.userHasPermission({
  body: {
    userId: session.user.id,
    permissions: { student: ["print_card"] },
  },
});
```

### Permission Check (Client)
```ts
const { data } = await authClient.admin.hasPermission({
  permissions: { student: ["print_card"] },
});
```

---

## Data Volume & Risk Assessment
- ~12K users preserved with existing IDs
- existing accounts migrated
- existing sessions dropped and users re-authenticate
- position-based access translated into permission preset rows where required
- LMS-linked credentials moved out of `users`

---

## Migration Execution Order

### Phase 1: Foundation (no route swap yet)
1. Install `better-auth` alongside existing Auth.js (keep both)
2. Update `next.config.ts` — add `serverExternalPackages: ['better-auth']` only
3. Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` env vars
4. Create permissions map and permission presets (`src/core/platform/`)
5. Create `src/core/auth.ts` — Better Auth server with admin plugin, `generateId: nanoid`, drizzle adapter from `better-auth/adapters/drizzle`
6. Create `src/core/auth-client.ts` — with `inferAdditionalFields<typeof auth>()` plugin
7. Create new schema files (`rateLimits.ts`, `lmsCredentials.ts`, `userPermissions.ts`)
8. Update `_database/index.ts` barrel exports for new schema files
9. Create `proxy.ts` at project root — uses `getSessionCookie()`, matcher includes `/apply/:path*`
10. Add rate-limit plugin pointing to `src/app/auth/auth-providers/_schema/rateLimits.ts`

### Phase 2: Database Migration (route swap at end)
11. Update existing schema files (`users.ts`, `accounts.ts`, `sessions.ts`) for Better Auth columns
12. Rename `verification_tokens` → `verifications` with column changes
13. Drop `authenticators` table and schema
14. Convert enum columns to text (`userRoles`, `dashboardUsers`, `userPositions`)
15. Run `pnpm db:generate`
16. Write custom migration SQL for Better Auth tables and data conversion
17. Run `pnpm db:migrate`
18. Run data migration (accounts, position → presets, lms_credentials)
19. Verify data integrity and required indexes
20. Export `schema` object from `src/core/database/index.ts` (for drizzle adapter)
21. Atomically swap route handler: `src/app/api/auth/[...nextauth]/route.ts` → `src/app/api/auth/[...all]/route.ts`
22. Remove `authInterrupts: true` from `next.config.ts`

### Phase 3: Authorization Layer Replacement
23. Create `withPermission` — wrap core logic in React `cache()` from the start, include `'dashboard'` shorthand
24. Update `BaseService.ts` — new session types, update `buildAuditOptions()` to read from Better Auth session shape
25. Update server actions to use `withPermission`
26. Update client components (TanStack Query auth calls)
27. Update `providers.tsx` — remove `SessionProvider`
28. Migrate LMS credential reads (15+ files → `lms_credentials` table)
29. Migrate position field reads (40+ files → permission-based checks)
30. Migrate apply portal auth (8 files)
31. Migrate login page, account-setup, root page auth
32. Replace `GoogleSignInForm` — module-level server action at `src/shared/ui/google-sign-in-action.ts`
33. Replace `session.user.stdNo` with `getStudentByUserId()` server action (on-demand)

### Phase 4: Cleanup & Testing
34. Delete Auth.js artifacts (`auth.legacy.ts`, authenticators schema, old route handler)
35. Remove `next-auth` and `@auth/drizzle-adapter` from `package.json`
36. Run full auth flow testing (see checklist above)
37. Run `pnpm tsc --noEmit && pnpm lint:fix`
