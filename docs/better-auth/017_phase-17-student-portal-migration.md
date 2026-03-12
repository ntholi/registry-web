# Phase 17: Student Portal & stdNo Migration

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 16 complete. Read `000_overview.md` first.

This phase replaces `session.user.stdNo` access with on-demand fetching and migrates all student portal auth patterns.

## 17.1 Replace `stdNo` Session Access

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

## 17.2 Student Portal Migration Checklist

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
- Any student portal hooks that reference `session.user.stdNo` (must use on-demand fetch from 17.1)

### Student portal does NOT use adease patterns

Per project guidelines, `src/app/student-portal` uses a unique layout. Ensure migration preserves this — do NOT convert it to use `withPermission` for navigation. Student portal pages should use `'auth'` requirement checks where needed.

## Exit Criteria

- [ ] `stdNo` fetched on-demand via server action (removed from session)
- [ ] Student portal layout uses `auth.api.getSession()` (not `auth()`)
- [ ] Student portal Navbar renders user name/avatar correctly
- [ ] Student portal pages using `session.user.stdNo` updated to on-demand fetch
- [ ] No `session.user.stdNo` direct access remains in student portal
- [ ] Student portal does not use `withPermission` for navigation (unique layout preserved)
- [ ] `pnpm tsc --noEmit` passes
