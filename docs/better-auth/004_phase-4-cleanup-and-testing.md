# Phase 4: Cleanup & Testing

Status: maintain this phase document together with `better-auth-documentation.md`.

If this file conflicts with `better-auth-documentation.md`, use `better-auth-documentation.md` as the authoritative source.

## 4.1 Remove Auth.js Artifacts
- Delete `next-auth.d.ts`
- Delete `src/core/platform/withAuth.ts`
- Remove `next-auth` and `@auth/drizzle-adapter` from `package.json`
- Remove `SessionProvider` from `src/app/providers.tsx`
- Remove all imports from `next-auth` and `next-auth/react`

## 4.2 Dashboard Navigation

File: `src/app/dashboard/module-config.types.ts`

- Update `NavItem.roles` to permission-based visibility, or
- keep role-based nav visibility and enforce permissions at action layer

Prefer the smallest change that preserves current navigation behavior during the migration.

## 4.3 Delete Obsolete Files
- `src/app/api/auth/[...nextauth]/route.ts`
- `next-auth.d.ts`
- `src/core/platform/withAuth.ts`

## 4.4 Testing Checklist
- [ ] Google OAuth sign-in works and account selector appears
- [ ] Session persists across refreshes
- [ ] Proxy redirects unauthenticated users from protected routes
- [ ] Proxy file is at project root (`proxy.ts`), not in `src/`
- [ ] `serverExternalPackages: ['better-auth']` is in `next.config.ts`
- [ ] `trustedOrigins` uses `BETTER_AUTH_TRUSTED_ORIGINS` env var
- [ ] Role field validates against the defined enum array (rejects invalid role strings)
- [ ] Admin can manage user roles via Better Auth admin API
- [ ] Admin impersonation works and sessions are marked with `impersonatedBy`
- [ ] Sessions table includes `impersonated_by` column (added by admin plugin)
- [ ] Permission presets populate `user_permissions`
- [ ] Per-user permission overrides work (grant + revoke)
- [ ] `withPermission` merges role defaults + overrides correctly
- [ ] Server actions enforce correct permissions
- [ ] Client conditional rendering uses permission checks
- [ ] Student portal auth works
- [ ] Apply portal auth works
- [ ] LMS auth guard works with `lms_credentials`
- [ ] Account linking works for existing Google users
- [ ] `encryptOAuthTokens: true` is active (verify tokens are encrypted in `accounts` table)
- [ ] Database indexes exist on: users.email, accounts.user_id, sessions.user_id, sessions.token, verifications.identifier
- [ ] No `next-auth` imports remain (`grep -r "next-auth" src/` returns nothing)
- [ ] `pnpm tsc --noEmit && pnpm lint:fix` passes clean
- [ ] `account.updateAccountOnSignIn: true` is set (OAuth tokens refresh on each sign-in)
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` is NOT set (client auto-discovers, unnecessary env var)
- [ ] `better-auth/minimal` is used for bundle size
- [ ] `stdNo` is accessed via dedicated `getStudentByUserId()` server action, NOT from session
- [ ] Student portal components updated to use on-demand `stdNo` fetching
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` env var is set in all environments
- [ ] Client `authClient` is typed from the server auth definition
- [ ] Admin plugin is imported from `better-auth/plugins`

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
import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function handleSignIn() {
  "use server";
  const result = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/dashboard" },
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

### Phase 1: Foundation
1. Install Better Auth, remove Auth.js deps
2. Update `next.config.ts` (add `serverExternalPackages: ['better-auth']`)
3. Add Better Auth env vars
4. Create permissions and presets
5. Create `src/core/auth.ts` with Better Auth server setup and admin plugin
6. Create `src/core/auth-client.ts`
7. Create `src/app/api/auth/[...all]/route.ts`
8. Create `proxy.ts` at project root

### Phase 2: Database Migration
9. Create/update schema files
10. Run `pnpm db:generate`
11. Write custom migration SQL for Better Auth tables and user conversion
12. Run `pnpm db:migrate`
13. Run data migration script
14. Verify integrity and required indexes

### Phase 3: Authorization Layer Replacement
15. Create `withPermission`
16. Update `BaseService.ts`
17. Update server actions
18. Update client components
19. Update `providers.tsx`
20. Update login and Google sign-in flow
21. Replace `session.user.stdNo` with `getStudentByUserId()` server action in student portal

### Phase 4: Cleanup & Testing
22. Delete Auth.js artifacts
23. Remove old dependencies
24. Run auth flow testing
25. Run `pnpm tsc --noEmit && pnpm lint:fix`
