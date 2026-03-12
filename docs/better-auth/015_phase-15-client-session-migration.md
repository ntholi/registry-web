# Phase 15: Client Component Session Migration

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 14 complete. Read `000_overview.md` first.

This phase migrates all client components from `next-auth` session APIs to Better Auth, removes `SessionProvider`, and replaces `useSession`/`signOut` patterns.

## 15.1 Session Access — Client Components (~35+ files)

### Replace Imports

Replace throughout all client component files:
- `useSession` from `next-auth/react` → `authClient.useSession()` from `@/core/auth-client`
- `signOut` from `next-auth/react` → `authClient.signOut()`
- `SessionProvider` from `next-auth/react` → remove entirely
- Session type from `next-auth` → `Session` from `@/core/auth`

### Remove SessionProvider

- Remove `SessionProvider` wrapper from `src/app/providers.tsx`
- Remove `next-auth/react` import from providers

### Usage Pattern Change

**Before:**
```ts
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  // ...
}
```

**After:**
```ts
import { authClient } from '@/core/auth-client';

function MyComponent() {
  const { data: session } = authClient.useSession();
  // ...
}
```

### SignOut Pattern Change

**Before:**
```ts
import { signOut } from 'next-auth/react';
signOut({ callbackUrl: '/auth/login' });
```

**After:**
```ts
import { authClient } from '@/core/auth-client';
authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/auth/login') } });
```

## 15.2 Remove `session.accessToken` References

Verify with `grep -r 'session.accessToken' src/` that no code reads `session.accessToken`. If found, replace with on-demand token fetch from accounts table.

## Exit Criteria

- [ ] All ~35+ client components migrated from `next-auth` session APIs
- [ ] `SessionProvider` removed from `src/app/providers.tsx`
- [ ] `authClient.useSession()` used everywhere instead of `useSession`
- [ ] `authClient.signOut()` used everywhere instead of `signOut`
- [ ] No `session.accessToken` references remain
- [ ] No `next-auth/react` imports remain
- [ ] No `SessionProvider` wrapper in the app
- [ ] `pnpm tsc --noEmit` passes
