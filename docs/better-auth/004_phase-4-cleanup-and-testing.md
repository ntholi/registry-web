# Phase 4: Cleanup & Testing

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

## 4.3 Delete Obsolete Files
- `src/app/api/auth/[...nextauth]/route.ts`
- `next-auth.d.ts`
- `src/core/platform/withAuth.ts`

## 4.4 Testing Checklist
- [ ] Google OAuth sign-in works and account selector appears
- [ ] Session persists across refreshes
- [ ] Cookie cache is active (check for `better-auth.session_data` cookie)
- [ ] Proxy redirects unauthenticated users from protected routes (cookie-cache check via `getCookieCache`)
- [ ] Proxy file is at project root (`proxy.ts`), NOT in `src/`
- [ ] `serverExternalPackages: ['better-auth']` is in `next.config.ts`
- [ ] `trustedOrigins` includes production domain and Vercel preview wildcard
- [ ] `experimental: { joins: true }` is enabled and Drizzle relations are defined
- [ ] Session `getSession` endpoint uses DB joins (verify via network/logs that related data is fetched in 1 query)
- [ ] Cookie cache `version: "1"` is set (allows future mass session invalidation)
- [ ] Role field validates against the defined enum array (rejects invalid role strings)
- [ ] Admin can manage user roles via Better Auth admin API
- [ ] Admin impersonation works and sessions are marked with `impersonatedBy`
- [ ] Permission presets populate `user_permissions`
- [ ] Per-user permission overrides work (grant + revoke)
- [ ] `withPermission` merges role defaults + overrides correctly
- [ ] Permission caching works (React `cache()` deduplication)
- [ ] Permission query failures are handled gracefully (returns empty permissions, doesn't crash)
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
- [ ] Vercel deployment works (backgroundTasks with `waitUntil` functioning)
- [ ] Rate limiting responds with 429 + `X-Retry-After` header on excessive requests

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
- ~12K accounts migrated
- ~32K sessions dropped (re-login required)
- 147 academic users with positions migrated to presets in `user_permissions`
- 9 LMS-connected users migrated to `lms_credentials`
- session `accessToken` dropped as unused

---

## Migration Execution Order

### Phase 1: Foundation
1. Install Better Auth + `@vercel/functions`, remove Auth.js deps
2. Update `next.config.ts` (add `serverExternalPackages: ['better-auth']`)
3. Add Better Auth env vars (including `trustedOrigins` for Vercel previews)
4. Create permissions and presets
5. Create `src/core/auth.ts` (using `better-auth/minimal`, with `experimental: { joins: true }`, `trustedOrigins`, role enum type, `cookieCache.version`)
6. Create `src/core/auth-client.ts`
7. Create `src/app/api/auth/[...all]/route.ts`
8. Create `proxy.ts` at project root (using `getCookieCache` for signed cookie verification)

### Phase 2: Database Migration
9. Create/update schema files
10. Generate Drizzle relations for experimental joins (accounts→users, sessions→users)
11. Run `pnpm db:generate`
12. Write custom migration SQL (including indexes)
13. Run `pnpm db:migrate`
14. Run data migration script
15. Verify integrity + verify indexes exist + verify joins work

### Phase 3: Authorization Layer Replacement
15. Create `withPermission` (with React `cache()` for permission deduplication)
16. Update `BaseService.ts`
17. Update server actions
18. Update client components
19. Update `providers.tsx`
20. Update login and Google sign-in flow

### Phase 4: Cleanup & Testing
21. Delete Auth.js artifacts
21. Remove old dependencies
22. Run auth flow testing
23. Run `pnpm tsc --noEmit && pnpm lint:fix`
