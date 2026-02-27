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
- [ ] Cookie cache is active
- [ ] Proxy redirects unauthenticated users from protected routes
- [ ] Admin can manage user roles via Better Auth admin API
- [ ] Permission presets populate `user_permissions`
- [ ] Per-user permission overrides work (grant + revoke)
- [ ] `withPermission` merges role defaults + overrides correctly
- [ ] Server actions enforce correct permissions
- [ ] Client conditional rendering uses permission checks
- [ ] Student portal auth works
- [ ] Apply portal auth works
- [ ] LMS auth guard works with `lms_credentials`
- [ ] Rate limiting is active
- [ ] Account linking works for existing Google users
- [ ] No `next-auth` imports remain
- [ ] `pnpm tsc --noEmit && pnpm lint:fix` passes clean

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
1. Install Better Auth and remove Auth.js deps
2. Add Better Auth env vars
3. Create permissions and presets
4. Create `src/core/auth.ts`
5. Create `src/core/auth-client.ts`
6. Create `src/app/api/auth/[...all]/route.ts`
7. Create `src/proxy.ts`

### Phase 2: Database Migration
8. Create/update schema files
9. Run `pnpm db:generate`
10. Write custom migration SQL
11. Run `pnpm db:migrate`
12. Run data migration script
13. Verify integrity

### Phase 3: Authorization Layer Replacement
14. Create `withPermission`
15. Update `BaseService.ts`
16. Update server actions
17. Update client components
18. Update `providers.tsx`
19. Update login and Google sign-in flow

### Phase 4: Cleanup & Testing
20. Delete Auth.js artifacts
21. Remove old dependencies
22. Run auth flow testing
23. Run `pnpm tsc --noEmit && pnpm lint:fix`
