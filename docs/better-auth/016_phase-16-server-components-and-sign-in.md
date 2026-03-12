# Phase 16: Server Components, Sign-In & Permission Checks

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 15 complete. Read `000_overview.md` first.

This phase migrates server component session access, replaces position-based UI checks with permission checks, and migrates the sign-in page and GoogleSignInForm.

## 16.1 Session Access — Server Components

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

## 16.2 Position Checks → Permission Checks in UI Components

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
- `src/app/admin/activity-tracker/_server/service.ts` — manager position check (already done in Phase 12)
- `src/app/admin/tasks/_server/service.ts` — manager position check (already done in Phase 12)
- All feedback service files — position arrays (already done in Phases 9–10)

## 16.3 Migrate Sign-In Page & GoogleSignInForm

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

## Exit Criteria

- [ ] All server components use `auth.api.getSession()` or `getSession()` helper
- [ ] All `session.user.position` checks replaced with permission checks
- [ ] GoogleSignInForm migrated to client component using `authClient.signIn.social()`
- [ ] Login page uses `auth.api.getSession()` instead of `auth()`
- [ ] `pnpm tsc --noEmit` passes
