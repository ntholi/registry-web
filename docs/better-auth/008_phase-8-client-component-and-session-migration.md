# Phase 8: Client Component & Session Migration

> Estimated Implementation Time: 4 to 5 hours

**Prerequisites**: Phase 7 complete. Read `000_overview.md` first.

This phase migrates all client components from `next-auth` session APIs to Better Auth, removes `SessionProvider`, and replaces position-based UI checks with permission-based checks.

## 8.1 Session Access — Client Components (~35+ files)

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

## 8.2 Session Access — Server Components

Replace throughout all server component files:

**Before:**
```ts
import { auth } from '@/core/auth';
const session = await auth();
```

**After:**
```ts
import { auth } from '@/core/auth';
import { headers } from 'next/headers';
const session = await auth.api.getSession({ headers: await headers() });
```

Or use the helper:
```ts
import { getSession } from '@/core/platform/withPermission';
const session = await getSession();
```

## 8.3 Position Checks → Permission Checks in UI Components

All `session.user.position` checks must be replaced with permission-based checks.

**Server component pattern:**
```ts
// Before
if (session.user.position === 'manager') { /* show edit button */ }

// After
import { getSessionPermissions } from '@/core/platform/withPermission';
const result = await getSessionPermissions();
const canEdit = result?.permissions.some(p => p.resource === 'school-structures' && p.action === 'update');
if (canEdit) { /* show edit button */ }
```

**Client component pattern (via server action):**
```ts
// Create a server action that checks permissions
'use server';
export async function checkPermission(resource: string, action: string) {
  const result = await getSessionPermissions();
  if (!result) return false;
  if (result.session.user.role === 'admin') return true;
  return result.permissions.some(p => p.resource === resource && p.action === action);
}
```

### Key Files Requiring Position → Permission Migration

- `src/app/academic/schools/structures/[id]/page.tsx` — position-based edit/delete visibility
- `src/app/academic/academic.config.ts` — `isVisible` position checks
- `src/app/registry/registry.config.ts` — `isVisible` position checks
- `src/app/admin/admin.config.ts` — `isVisible` position checks
- `src/app/timetable/timetable.config.ts` — `isVisible` position checks
- `src/app/admin/activity-tracker/_server/service.ts` — manager position check (already done in Phase 6)
- `src/app/admin/tasks/_server/service.ts` — manager position check (already done in Phase 6)
- All feedback service files — position arrays (already done in Phase 5)

## 8.4 Replace `stdNo` Session Access

Create a dedicated server action (on-demand):

File: `src/app/registry/students/_server/actions.ts` (add to existing)

```ts
export async function getStudentByUserId(userId: string) {
  return withPermission(async () => {
    return studentRepository.findByUserId(userId);
  }, 'auth');
}
```

Update all components using `session.user.stdNo`:
- `src/app/student-portal/**`
- `src/shared/lib/hooks/use-user-student.tsx`

## 8.5 Remove `session.accessToken` References

Verify with `grep -r 'session.accessToken' src/` that no code reads `session.accessToken`. If found, replace with on-demand token fetch from accounts table.

## 8.6 Migrate Sign-In Page & GoogleSignInForm

The current sign-in flow uses Auth.js server actions. This must be migrated to Better Auth.

### Login Page

File: `src/app/auth/login/page.tsx`

**Before:**
```ts
import { auth } from '@/core/auth';
// ...
const session = await auth();
```

**After:**
```ts
import { auth } from '@/core/auth';
import { headers } from 'next/headers';
// ...
const session = await auth.api.getSession({ headers: await headers() });
```

### GoogleSignInForm

File: `src/shared/ui/GoogleSignInForm.tsx`

The current component is a server component using Auth.js `signIn('google')` server action. Better Auth uses a client-side social sign-in flow.

**Before (Server Component with Auth.js server action):**
```ts
'use server';
import { signIn } from '@/core/auth';

export default async function GoogleSignInForm({ redirectTo = '/' }: Props) {
  async function handleSignIn() {
    'use server';
    await signIn('google', { redirectTo });
  }
  return (
    <form action={handleSignIn}>
      <Button type='submit'>Sign in with Google</Button>
    </form>
  );
}
```

**After (Client Component with Better Auth):**
```ts
'use client';

import { Button } from '@mantine/core';
import Image from 'next/image';
import { authClient } from '@/core/auth-client';

type Props = {
  redirectTo?: string;
};

export default function GoogleSignInForm({ redirectTo = '/' }: Props) {
  function handleSignIn() {
    authClient.signIn.social({
      provider: 'google',
      callbackURL: redirectTo,
    });
  }

  return (
    <Button
      onClick={handleSignIn}
      variant='default'
      leftSection={
        <Image src='/images/google.svg' alt='Google' width={18} height={18} />
      }
      fullWidth
    >
      Sign in with Google
    </Button>
  );
}
```

**Key changes:**
- Converted from server component to client component (`'use client'`)
- Uses `authClient.signIn.social({ provider: 'google' })` instead of Auth.js `signIn('google')`
- `redirectTo` becomes `callbackURL` parameter
- No longer a `<form>` — uses `onClick` handler
- This matches the Better Auth migration guide: `signIn('google')` → `authClient.signIn.social({ provider: 'google' })`

## 8.7 Student Portal Migration Checklist

The student portal (`src/app/student-portal/`) uses a different layout and has unique auth patterns. Ensure all student portal files are migrated:

### Layout

File: `src/app/student-portal/layout.tsx`

**Before:**
```ts
import { auth } from '@/core/auth';
const session = await auth();
```

**After:**
```ts
import { auth } from '@/core/auth';
import { headers } from 'next/headers';
const session = await auth.api.getSession({ headers: await headers() });
```

### Files to check

- `src/app/student-portal/layout.tsx` — session for metadata/navbar
- `src/app/student-portal/_shared/Navbar.tsx` — likely reads session for user name/avatar
- All page files under `src/app/student-portal/` that call `auth()` or use `useSession`
- Any student portal hooks that reference `session.user.stdNo` (must use on-demand fetch from 8.4)

### Student portal does NOT use adease patterns

Per project guidelines, `src/app/student-portal` uses a unique layout. Ensure migration preserves this — do NOT convert it to use `withPermission` for navigation. Student portal pages should use `'auth'` requirement checks where needed.

## Exit Criteria

- [ ] All ~35+ client components migrated from `next-auth` session APIs
- [ ] `SessionProvider` removed from `src/app/providers.tsx`
- [ ] `authClient.useSession()` used everywhere instead of `useSession`
- [ ] `authClient.signOut()` used everywhere instead of `signOut`
- [ ] All server components use `auth.api.getSession()` or `getSession()` helper
- [ ] All `session.user.position` checks replaced with permission checks
- [ ] `stdNo` fetched on-demand via server action (removed from session)
- [ ] No `session.accessToken` references remain
- [ ] No `next-auth/react` imports remain
- [ ] No `SessionProvider` wrapper in the app
- [ ] GoogleSignInForm migrated to client component using `authClient.signIn.social()`
- [ ] Login page uses `auth.api.getSession()` instead of `auth()`
- [ ] Student portal layout and Navbar migrated to Better Auth session access
- [ ] Student portal pages using `session.user.stdNo` updated to on-demand fetch
- [ ] `pnpm tsc --noEmit` passes
