# Phase 18: LMS Credential Migration

**Prerequisites**: Phase 17 complete. Read `000_overview.md` first.

This phase migrates all LMS credential reads from session to the `lms_credentials` table, centralizes credential ownership in the auth module, updates all `moodleGet`/`moodlePost` callers to pass tokens explicitly, and removes all LMS fields from session types.

## 18.1 Create Auth-Owned LMS Credentials Repository

File: `src/app/auth/auth-providers/_server/repository.ts`

This file becomes the single auth-owned access point for LMS credentials. Named `repository.ts` per project convention (only repository files may import `db`). All other modules must import from here.

```ts
import { eq } from 'drizzle-orm';
import { db, lmsCredentials } from '@/core/database';

export async function getLmsCredentials(userId: string) {
  return db.query.lmsCredentials.findFirst({
    where: eq(lmsCredentials.userId, userId),
  });
}

export async function upsertLmsCredentials(
  userId: string,
  lmsUserId: number | null | undefined,
  lmsToken: string | null | undefined,
) {
  if (!lmsUserId && !lmsToken) {
    return db.delete(lmsCredentials).where(eq(lmsCredentials.userId, userId));
  }
  return db
    .insert(lmsCredentials)
    .values({ userId, lmsUserId: lmsUserId ?? null, lmsToken: lmsToken ?? null })
    .onConflictDoUpdate({
      target: lmsCredentials.userId,
      set: { lmsUserId: lmsUserId ?? null, lmsToken: lmsToken ?? null },
    });
}

export async function hasLmsCredentials(userId: string) {
  const creds = await getLmsCredentials(userId);
  return !!(creds?.lmsUserId && creds?.lmsToken);
}
```

## 18.2 Migrate moodle.ts — Remove Session Coupling

**File**: `src/core/integrations/moodle.ts`

Currently `moodleGet` and `moodlePost` call `auth()` internally to get a fallback `lmsToken` from session. After migration, callers must always pass `lmsToken` explicitly.

**Before:**
```ts
export async function moodleGet(wsfunction, params = {}, lmsToken?: string) {
  const session = await auth();
  return moodleRequest(wsfunction, 'GET', params, lmsToken || session?.user?.lmsToken);
}
```

**After:**
```ts
export async function moodleGet(wsfunction, params = {}, lmsToken?: string) {
  return moodleRequest(wsfunction, 'GET', params, lmsToken);
}
```

- Remove `import { auth } from '../auth'` entirely from moodle.ts.
- `moodleRequest` already falls back to `MOODLE_TOKEN` env when no `userToken` is passed, so admin-level calls (which pass `process.env.MOODLE_TOKEN`) continue to work.
- Callers that need a user-specific token must fetch it via `getLmsCredentials()` and pass it explicitly.

## 18.2a Migrate All moodleGet/moodlePost Callers to Pass User Token

After removing the session fallback from `moodle.ts` (18.2), **all callers** that previously relied on the implicit session token must now explicitly fetch the user's `lmsToken` from the `lms_credentials` table and pass it.

**Pattern for each file:**
```ts
import { getLmsCredentials } from '@auth/auth-providers/_server/repository';

// At start of action (after auth check):
const session = await auth();
if (!session?.user) throw new Error('Unauthorized');
const creds = await getLmsCredentials(session.user.id);

// Then pass creds?.lmsToken to moodleGet/moodlePost calls:
await moodleGet('some_function', { ... }, creds?.lmsToken);
await moodlePost('some_function', { ... }, creds?.lmsToken);
```

**Calls that already pass `process.env.MOODLE_TOKEN` explicitly do NOT need changes** — they are intentional admin-level operations.

### Files requiring caller migration:

| File | Calls without explicit token | Notes |
|------|------------------------------|-------|
| `src/app/lms/_shared/utils.ts` | `getCourseSections()`, `getOrReuseSection()` | Add `lmsToken` parameter to these shared functions; callers pass it through |
| `src/app/lms/posts/_server/actions.ts` | 6 calls (forums CRUD) | Fetch creds once per action, pass to all moodleGet/moodlePost calls |
| `src/app/lms/material/_server/actions.ts` | 8 calls (pages, files, URLs) | Fetch creds once per action, pass to all calls |
| `src/app/lms/course-outline/_server/actions.ts` | 6 calls (books, chapters) | Fetch creds once per action, pass to all calls |
| `src/app/lms/quizzes/_server/actions.ts` | ~22 calls (quiz CRUD, attempts) | Fetch creds once per action; 2 calls already pass `MOODLE_TOKEN` |
| `src/app/lms/virtual-classroom/_server/actions.ts` | 2 calls (BBB session, join URL) | Fetch creds once per action, pass to all calls |
| `src/app/lms/assignments/_server/actions.ts` | 6 calls (assignment CRUD) | Fetch creds once per action; 1 call already passes `MOODLE_TOKEN` |
| `src/app/lms/assignments/_features/submissions/server/actions.ts` | 1 call (get submissions) | Fetch creds, pass to the non-admin call |

**For `lms/_shared/utils.ts`**: Since `getCourseSections()` and `getOrReuseSection()` are shared utilities called from multiple action files, add an `lmsToken` parameter to their signatures. Each calling action passes the token it already fetched.

**Before (`_shared/utils.ts`):**
```ts
export async function getCourseSections(courseId: number) {
  const result = await moodleGet('core_course_get_contents', { courseid: courseId });
  return result as CourseSection[];
}
```

**After:**
```ts
export async function getCourseSections(courseId: number, lmsToken?: string) {
  const result = await moodleGet('core_course_get_contents', { courseid: courseId }, lmsToken);
  return result as CourseSection[];
}
```

## 18.3 Migrate LMS Courses Actions

**File**: `src/app/lms/courses/_server/actions.ts`

Two actions read LMS credentials from session:

1. **`getUserCourses()`** — reads `session.user.lmsUserId` (line 14)
2. **`createMoodleCourse()`** — reads `session.user.lmsUserId` for enrollment (line 76)

Additionally, several `moodleGet`/`moodlePost` calls in this file don't pass explicit tokens and need the user's `lmsToken`.

**After:**
```ts
import { getLmsCredentials } from '@auth/auth-providers/_server/repository';

export async function getUserCourses() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const creds = await getLmsCredentials(session.user.id);
  if (!creds?.lmsUserId) return [];
  // pass creds.lmsToken to moodleGet for user-context results
  const result = await moodleGet('core_enrol_get_users_courses', {
    userid: creds.lmsUserId,
  }, creds.lmsToken ?? undefined);
  return result as MoodleCourse[];
}
```

For `createMoodleCourse()`: fetch creds, use `creds.lmsUserId` for enrollment, and pass `creds.lmsToken` to calls that don't already use `process.env.MOODLE_TOKEN`.

## 18.4 Migrate LMS Auth Actions

**File**: `src/app/lms/auth/_server/actions.ts`

`checkMoodleUserExists()` currently:
- Reads `session.user.lmsUserId` (line 31) to compare with Moodle user ID
- Reads `session.user.lmsToken` (line 36) to preserve existing token during upsert
- Calls `usersRepository.upsertLmsCredentials()` directly

**After:**
```ts
import { getLmsCredentials, upsertLmsCredentials } from '@auth/auth-providers/_server/repository';

export async function checkMoodleUserExists() {
  const session = await auth();
  if (!session?.user?.email) return { exists: false, error: 'No email found' };

  const creds = await getLmsCredentials(session.user.id);
  // compare creds?.lmsUserId with moodleUser.id
  // call upsertLmsCredentials() from auth module instead of usersRepository
}
```

Also add a new combined action for LmsAuthGuard (see 18.5):

```ts
export async function getLmsAuthStatus() {
  const session = await auth();
  if (!session?.user?.id) return { hasCredentials: false, moodleCheck: null };

  const hasCreds = await hasLmsCredentials(session.user.id);
  if (hasCreds) return { hasCredentials: true, moodleCheck: null };

  // run moodle check only when no credentials
  const moodleCheck = await checkMoodleUserExists();
  return { hasCredentials: false, moodleCheck };
}
```

## 18.5 Migrate LmsAuthGuard Client Component

**File**: `src/app/lms/auth/_components/LmsAuthGuard.tsx`

Currently reads `session?.user?.lmsUserId` and `session?.user?.lmsToken` from the client-side session hook. Replace with a single server action query that combines the credential check and Moodle user check to minimize round-trips.

**Before:**
```tsx
const { data: session } = authClient.useSession();
const lmsUserId = session?.user?.lmsUserId;
const lmsToken = session?.user?.lmsToken;
const { data: moodleCheck } = useQuery({
  queryKey: ['moodle-user-check'],
  queryFn: checkMoodleUserExists,
  enabled: !lmsUserId || !lmsToken,
});
```

**After:**
```tsx
const { data, isPending } = useQuery({
  queryKey: ['lms-auth-status'],
  queryFn: getLmsAuthStatus,
});
// data.hasCredentials -> render children
// !data.hasCredentials + data.moodleCheck?.exists -> "Access Pending"
// !data.hasCredentials + !data.moodleCheck?.exists -> "No Moodle Account"
```

Remove `authClient.useSession()` import — the guard no longer needs session data.

## 18.6 Remove LMS Methods from Admin UserRepository

**File**: `src/app/admin/users/_server/repository.ts`

Delete `getLmsCredentials()` and `upsertLmsCredentials()` methods from `UserRepository`. These methods currently import `lmsCredentials` from `@/core/database` and own persistence logic that belongs to the auth module.

**File**: `src/app/admin/users/_server/service.ts`

Replace repository calls with auth-owned helpers:

**Before:**
```ts
const creds = await this.repository.getLmsCredentials(id);
await this.repository.upsertLmsCredentials(id, lmsUserId, lmsToken);
```

**After:**
```ts
import { getLmsCredentials, upsertLmsCredentials } from '@auth/auth-providers/_server/repository';

const creds = await getLmsCredentials(id);
await upsertLmsCredentials(id, lmsUserId, lmsToken);
```

## 18.7 Remove LMS Credentials from Session Population

### `src/core/auth.ts`

Three locations to clean:

1. **`SessionUser` type** (lines 18-19): Remove `lmsUserId` and `lmsToken` fields.
2. **`customSession` plugin** (lines 101-117): Remove the `lmsCredentials` query and stop spreading `lmsToken`/`lmsUserId` onto the session user.
3. **`auth()` wrapper function** (lines 149-150): Remove `lmsUserId: session.user.lmsUserId` and `lmsToken: session.user.lmsToken` from the returned object.

### `src/core/auth.legacy.ts`

Remove lines 82-83:
```ts
session.user.lmsUserId = user.lmsUserId;
session.user.lmsToken = user.lmsToken;
```

### `next-auth.d.ts`

Remove lines 10-11:
```ts
lmsUserId?: number;
lmsToken?: string;
```

## Files Requiring Migration (Summary)

| File | What to change |
|------|---------------|
| `src/app/auth/auth-providers/_server/repository.ts` | **Create** auth-owned read/write/presence helpers |
| `src/core/integrations/moodle.ts` | Remove `auth()` import and session fallback; callers pass token explicitly |
| `src/app/lms/_shared/utils.ts` | Add `lmsToken` parameter to `getCourseSections()` and `getOrReuseSection()` |
| `src/app/lms/courses/_server/actions.ts` | Replace `session.user.lmsUserId` with `getLmsCredentials()`; pass `lmsToken` to moodleGet/moodlePost |
| `src/app/lms/auth/_server/actions.ts` | Replace session reads with table reads; delegate writes to auth helpers; add `getLmsAuthStatus()` combined action |
| `src/app/lms/auth/_components/LmsAuthGuard.tsx` | Replace session hook + two queries with single `getLmsAuthStatus()` query; remove `authClient.useSession()` entirely |
| `src/app/lms/posts/_server/actions.ts` | Fetch creds via `getLmsCredentials()`, pass `lmsToken` to all 6 moodleGet/moodlePost calls |
| `src/app/lms/material/_server/actions.ts` | Fetch creds via `getLmsCredentials()`, pass `lmsToken` to all 8 moodleGet/moodlePost calls |
| `src/app/lms/course-outline/_server/actions.ts` | Fetch creds via `getLmsCredentials()`, pass `lmsToken` to all 6 moodleGet/moodlePost calls |
| `src/app/lms/quizzes/_server/actions.ts` | Fetch creds via `getLmsCredentials()`, pass `lmsToken` to ~22 calls (2 already use `MOODLE_TOKEN`) |
| `src/app/lms/virtual-classroom/_server/actions.ts` | Fetch creds via `getLmsCredentials()`, pass `lmsToken` to 2 moodleGet/moodlePost calls |
| `src/app/lms/assignments/_server/actions.ts` | Fetch creds via `getLmsCredentials()`, pass `lmsToken` to 6 calls (1 already uses `MOODLE_TOKEN`) |
| `src/app/lms/assignments/_features/submissions/server/actions.ts` | Fetch creds, pass `lmsToken` to 1 non-admin moodleGet call |
| `src/app/lms/students/_server/actions.ts` | Update import from `usersRepository` to auth-owned `getLmsCredentials`/`upsertLmsCredentials` |
| `src/app/admin/users/_server/repository.ts` | Delete `getLmsCredentials()` and `upsertLmsCredentials()` methods |
| `src/app/admin/users/_server/service.ts` | Import auth-owned helpers instead of using repository methods |
| `src/core/auth.ts` | Remove `lmsUserId`/`lmsToken` from `SessionUser` type, `customSession` plugin query, and `auth()` wrapper |
| `src/core/auth.legacy.ts` | Remove legacy LMS credential session assignment (lines 82-83) |
| `next-auth.d.ts` | Remove `lmsUserId` and `lmsToken` from User interface |

## Already Migrated or Not Required

These files already read LMS credentials from `lms_credentials` via repository joins or don't reference session LMS fields:

- `src/app/lms/students/_server/repository.ts` — joins on `lmsCredentials` table directly (no changes needed)
- `src/app/admin/users/_components/Form.tsx` — form fields for lmsUserId/lmsToken are fine (submits to service)

**Note**: After removing `getLmsCredentials` from `UserRepository` in 18.6, `src/app/lms/students/_server/actions.ts` must update its import to use the auth-owned helper instead.

## Migration Pattern

**Server actions — Before:**
```ts
const session = await auth();
const lmsUserId = session.user.lmsUserId;
const lmsToken = session.user.lmsToken;
```

**Server actions — After:**
```ts
import { getLmsCredentials } from '@auth/auth-providers/_server/repository';

const session = await auth();
const creds = await getLmsCredentials(session.user.id);
const lmsUserId = creds?.lmsUserId;
const lmsToken = creds?.lmsToken;
```

**moodleGet/moodlePost callers — Before (implicit session token):**
```ts
const result = await moodleGet('some_ws_function', { param: value });
```

**moodleGet/moodlePost callers — After (explicit token):**
```ts
const creds = await getLmsCredentials(session.user.id);
const result = await moodleGet('some_ws_function', { param: value }, creds?.lmsToken);
```

**Client components — Before:**
```tsx
const { data: session } = authClient.useSession();
const hasAccess = session?.user?.lmsUserId && session?.user?.lmsToken;
```

**Client components — After:**
```tsx
const { data } = useQuery({
  queryKey: ['lms-auth-status'],
  queryFn: getLmsAuthStatus,
});
const hasAccess = data?.hasCredentials;
```

## Exit Criteria

- [ ] LMS credentials repository created in `src/app/auth/auth-providers/_server/repository.ts`
- [ ] `moodle.ts` no longer imports `auth()` or reads session; callers pass `lmsToken` explicitly
- [ ] All `moodleGet`/`moodlePost` callers in `lms/` pass explicit `lmsToken` (or `process.env.MOODLE_TOKEN` for admin ops)
- [ ] `lms/_shared/utils.ts` functions accept and forward `lmsToken` parameter
- [ ] LMS courses actions fetch credentials from table and pass `lmsToken`
- [ ] LMS auth actions delegate writes to auth-owned helpers
- [ ] `LmsAuthGuard` uses single `getLmsAuthStatus()` server action; `authClient.useSession()` removed entirely
- [ ] `getLmsCredentials`/`upsertLmsCredentials` removed from `UserRepository`
- [ ] Admin `UserService` imports auth-owned helpers directly
- [ ] `lms/students` actions updated to import from auth-owned helper (not UserRepository)
- [ ] `SessionUser` type in `auth.ts` no longer includes `lmsUserId`/`lmsToken`
- [ ] `customSession` plugin no longer queries or populates LMS credentials
- [ ] `auth()` wrapper no longer populates `lmsUserId`/`lmsToken`
- [ ] `auth.legacy.ts` session callback no longer sets LMS credential fields
- [ ] `next-auth.d.ts` User interface no longer declares `lmsUserId`/`lmsToken`
- [ ] No references to `session.user.lmsUserId`, `session?.user?.lmsUserId`, `session.user.lmsToken`, `session?.user?.lmsToken`, `user.lmsUserId`, or `user.lmsToken` remain in codebase (verify with grep)
- [ ] No `authClient.useSession()` reads of LMS fields remain in codebase
- [ ] `pnpm tsc --noEmit` passes
