# Phase 6: Preset Seeds & Cutover Readiness

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 5 complete. Read `000_overview.md` first.

This phase seeds permission presets from the shared catalog, migrates position→preset assignments, and proves that every staff user can be represented by a preset before the final auth cutover.

For this branch to remain deployable, the actual auth route swap, proxy creation, session purge, and physical `users.position` removal are deferred until the remaining NextAuth session consumers and `position` references have been migrated in later phases.

The explicit plan is to remove `users.position` in **Phase 24**, not here.

> **Migration type**: All steps in sections 6.1 and 6.2 must be implemented as a **custom migration** (`pnpm db:generate --custom`). The seed inserts and user mapping UPDATEs should live in one custom `.sql` file executed as a single transaction. Do **not** drop `users.position` in this phase. Keep the DB column and the Drizzle field temporarily so `pnpm tsc --noEmit` can continue to pass while later phases remove live code references.

## 6.1 Permission Preset Seeds

After creating the `permission_presets` and `preset_permissions` tables, seed the predefined presets from `src/app/auth/permission-presets/_lib/catalog.ts`.

That catalog is the single source of truth for:

- Preset names and descriptions
- Resource/action grants for each preset
- Legacy `role + position -> preset` mapping used in this phase

The SQL below is illustrative. The implementation should derive its inserts from the shared catalog instead of duplicating preset definitions in migration, UI, and tests.

> **Action vocabulary rule**: Do not use a catch-all action like `manage` in the preset catalog or migration output. Expand permissions to explicit actions such as `create`, `update`, `delete`, and `approve`. If a future workflow needs something more specific, add a narrowly named action for that workflow instead of reusing `manage`.

### Seed Data

The migration inserts these presets and their permissions (see `000_overview.md` for the full permission catalog per preset):

**Academic Presets:**

```sql
-- Academic Manager
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Manager', 'academic', 'Full academic department management');

-- Get the generated ID, then insert permissions:
INSERT INTO preset_permissions (preset_id, resource, action) VALUES
  (<id>, 'lecturers', 'read'),
  (<id>, 'lecturers', 'create'),
  (<id>, 'lecturers', 'update'),
  (<id>, 'lecturers', 'delete'),
  (<id>, 'assessments', 'read'),
  (<id>, 'assessments', 'create'),
  (<id>, 'assessments', 'update'),
  (<id>, 'assessments', 'delete'),
  (<id>, 'feedback-questions', 'read'),
  (<id>, 'feedback-questions', 'create'),
  (<id>, 'feedback-questions', 'update'),
  (<id>, 'feedback-questions', 'delete'),
  (<id>, 'feedback-categories', 'read'),
  (<id>, 'feedback-categories', 'create'),
  (<id>, 'feedback-categories', 'update'),
  (<id>, 'feedback-categories', 'delete'),
  (<id>, 'feedback-cycles', 'read'),
  (<id>, 'feedback-cycles', 'create'),
  (<id>, 'feedback-cycles', 'update'),
  (<id>, 'feedback-cycles', 'delete'),
  (<id>, 'feedback-reports', 'read'),
  (<id>, 'feedback-reports', 'update'),
  (<id>, 'school-structures', 'read'),
  (<id>, 'school-structures', 'update'),
  (<id>, 'school-structures', 'delete'),
  (<id>, 'timetable', 'read'),
  (<id>, 'timetable', 'create'),
  (<id>, 'timetable', 'update'),
  (<id>, 'timetable', 'delete'),
  (<id>, 'venues', 'read'),
  (<id>, 'venues', 'create'),
  (<id>, 'venues', 'update'),
  (<id>, 'venues', 'delete'),
  (<id>, 'students', 'read'),
  (<id>, 'registration', 'read'),
  (<id>, 'registration', 'update'),
  (<id>, 'graduation', 'read'),
  (<id>, 'graduation', 'approve'),
  (<id>, 'graduation-clearance', 'read'),
  (<id>, 'graduation-clearance', 'approve'),
  (<id>, 'graduation-clearance', 'reject'),
  (<id>, 'activity-tracker', 'read'),
  (<id>, 'tasks', 'read'),
  (<id>, 'tasks', 'create'),
  (<id>, 'tasks', 'update'),
  (<id>, 'tasks', 'delete'),
  (<id>, 'gradebook', 'read'),
  (<id>, 'gradebook', 'update'),
  (<id>, 'gradebook', 'approve'),
  (<id>, 'attendance', 'read'),
  (<id>, 'attendance', 'create'),
  (<id>, 'attendance', 'update'),
  (<id>, 'attendance', 'delete'),
  (<id>, 'assigned-modules', 'read'),
  (<id>, 'assigned-modules', 'create'),
  (<id>, 'assigned-modules', 'delete'),
  (<id>, 'reports-attendance', 'read'),
  (<id>, 'reports-course-summary', 'read'),
  (<id>, 'reports-boe', 'read'),
  (<id>, 'reports-enrollments', 'read'),
  (<id>, 'reports-progression', 'read'),
  (<id>, 'reports-distribution', 'read'),
  (<id>, 'reports-graduation', 'read');

-- Academic Program Leader
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Program Leader', 'academic', 'Program-level academic management');
-- Permissions: lecturers:CRUD, feedback-questions:CRUD, feedback-categories:CRUD,
-- school-structures:read/update, registration:read/update, timetable:read, students:read,
-- gradebook:read/update/approve, attendance:read, assigned-modules:CRUD,
-- reports-attendance:read, reports-course-summary:read, reports-boe:read,
-- reports-enrollments:read, reports-progression:read, reports-distribution:read, reports-graduation:read

-- Academic Year Leader
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Year Leader', 'academic', 'Year-level academic oversight');
-- Permissions: feedback-cycles:read, registration:read, students:read, timetable:read,
-- attendance:read, reports-attendance:read, reports-enrollments:read,
-- reports-progression:read, reports-distribution:read

-- Academic Lecturer
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Lecturer', 'academic', 'Teaching staff access');
-- Permissions: assessments:CRUD, gradebook:read/update, feedback-reports:read, timetable:read,
-- attendance:read/create/update, assigned-modules:read, reports-attendance:read, reports-course-summary:read

-- Academic Principal Lecturer
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Principal Lecturer', 'academic', 'Senior teaching staff access');
-- Permissions: assessments:CRUD, gradebook:read/update/approve, feedback-reports:read, timetable:read,
-- attendance:read/create/update, assigned-modules:read, reports-attendance:read, reports-course-summary:read

-- Academic Admin
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Admin', 'academic', 'Academic administrative support');
-- Permissions: assessments:CRUD, feedback-questions:CRUD, feedback-categories:CRUD,
-- feedback-cycles:CRUD, timetable:read, attendance:read
```

**Registry, Finance, and Other Presets:**

```sql
-- Registry Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Registry Staff', 'registry', 'Standard registry operations');
-- Permissions: students:read/update/delete, registration:CRUD, registration-clearance:read,
-- documents:read/create, student-statuses:CRUD, terms-settings:read/update,
-- certificate-reprints:CRUD, modules:create, semester-modules:create/update,
-- venues:create/update/delete, graduation:read, student-notes:CRUD,
-- blocked-students:read/create/update, reports-enrollments:read, reports-progression:read,
-- reports-distribution:read, reports-attendance:read

-- Registry Manager
INSERT INTO permission_presets (name, role, description) VALUES
  ('Registry Manager', 'registry', 'Registry department management');
-- All of Registry Staff + activity-tracker:read, tasks:CRUD, school-structures:update,
-- blocked-students:CRUD (full incl. delete), notifications:read, reports-graduation:read

-- Finance Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Finance Staff', 'finance', 'Standard finance operations');
-- Permissions: sponsors:CRUD, admissions-payments:read/update,
-- student-statuses:read, graduation:read, students:read,
-- registration-clearance:read/approve/reject, graduation-clearance:read/approve/reject,
-- blocked-students:read/create/update, reports-enrollments:read, reports-progression:read,
-- reports-distribution:read, reports-graduation:read, reports-sponsored-students:read

-- Finance Manager
INSERT INTO permission_presets (name, role, description) VALUES
  ('Finance Manager', 'finance', 'Finance department management');
-- All of Finance Staff + activity-tracker:read, tasks:CRUD,
-- blocked-students:CRUD (full incl. delete), auto-approvals:CRUD

-- Library Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Library Staff', 'library', 'Library operations');
-- Permissions: library:CRUD, students:read,
-- registration-clearance:read/approve/reject, graduation-clearance:read/approve/reject,
-- blocked-students:read/create/update, auto-approvals:CRUD

-- Marketing Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Marketing Staff', 'marketing', 'Marketing and admissions outreach');
-- Permissions: applicants:CRUD, applications:CRUD, entry-requirements:CRUD,
-- admissions-payments:read, admissions-documents:read,
-- recognized-schools:CRUD, intake-periods:CRUD, certificate-types:CRUD, subjects:CRUD

-- Student Services Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Student Services Staff', 'student_services', 'Student services operations');
-- Permissions: students:read/update, registration:read/update,
-- documents:read/create, student-statuses:read/create/update, student-notes:CRUD

-- LEAP Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('LEAP Staff', 'leap', 'LEAP program operations');
-- Permissions: assessments:CRUD, registration:read/update, registration-clearance:read,
-- students:read, attendance:read/create/update, assigned-modules:read,
-- reports-attendance:read, reports-enrollments:read, reports-progression:read,
-- reports-distribution:read

-- Human Resource Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Human Resource Staff', 'human_resource', 'HR access');
-- Permissions: feedback-reports:read, employees:CRUD

-- Resource Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Resource Staff', 'resource', 'Resource department operations');
-- Permissions: timetable:read, venues:read,
-- registration-clearance:read/approve/reject, auto-approvals:CRUD
```

## 6.2 Position → Preset Migration

After seeding presets, map existing users to the appropriate preset:

```sql
-- Map position → preset name per role
UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position = 'manager' AND pp.name = 'Academic Manager';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position = 'program_leader' AND pp.name = 'Academic Program Leader';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position = 'year_leader' AND pp.name = 'Academic Year Leader';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position = 'lecturer' AND pp.name = 'Academic Lecturer';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position = 'principal_lecturer' AND pp.name = 'Academic Principal Lecturer';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position = 'admin' AND pp.name = 'Academic Admin';

-- For non-academic roles without positions, assign default presets
-- (only if they had a staff-level role)
UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'registry' AND u.position IS NULL AND pp.name = 'Registry Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'registry' AND u.position = 'manager' AND pp.name = 'Registry Manager';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'finance' AND u.position IS NULL AND pp.name = 'Finance Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'finance' AND u.position = 'manager' AND pp.name = 'Finance Manager';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'library' AND pp.name = 'Library Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'marketing' AND pp.name = 'Marketing Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'student_services' AND pp.name = 'Student Services Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'leap' AND pp.name = 'LEAP Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'human_resource' AND pp.name = 'Human Resource Staff';

UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'resource' AND pp.name = 'Resource Staff';

-- Academic users with NULL position default to Academic Lecturer
UPDATE users u
SET preset_id = pp.id
FROM permission_presets pp
WHERE u.role = 'academic' AND u.position IS NULL AND u.preset_id IS NULL AND pp.name = 'Academic Lecturer';
```

After the mapping UPDATEs, run a blocking audit for unmapped staff users. Do NOT continue until this returns zero rows:

```sql
SELECT id, email, role, position
FROM users
WHERE preset_id IS NULL
  AND role NOT IN ('user', 'applicant', 'student', 'admin')
ORDER BY role, position, email;

SELECT role, position, count(*) AS affected_users
FROM users
WHERE preset_id IS NULL
  AND role NOT IN ('user', 'applicant', 'student', 'admin')
GROUP BY role, position
ORDER BY role, position;
```

> **Note on `admin` role**: Admin users are excluded from the blocking audit because they bypass permission checks entirely via the `withAuth` today and `withPermission` later. They do not need a preset.

If any rows remain, stop the migration, extend the shared `role + position -> preset` mapping in `src/app/auth/permission-presets/_lib/catalog.ts`, reseed if needed, rerun the assignment step, and only then continue.

After verifying all intended users have been assigned a preset, stop this phase with the compatibility column still in place. Do **not** drop `users.position` yet.

### 6.2.1 Compatibility Audit Before Final Cutover

The current codebase still contains live references to:

- `users.position` in repositories and server code
- `session.user.position` in permission and visibility checks
- `userPositions` in forms and validation
- `next-auth/react` client APIs
- `auth()` / `withAuth` server-side session access

Dropping the column or swapping the auth route before these are migrated would leave the branch non-deployable and fail `pnpm tsc --noEmit`.

Track these searches as part of Phase 6 readiness work:

```bash
rg "users\.position|userPositions|UserPosition" src
rg "session\.user\.position" src
rg "from 'next-auth/react'|from \"next-auth/react\"" src
rg "await auth\(|withAuth\(" src
```

These searches are expected to return matches at this stage. The purpose of this audit is to prove what must be migrated before the final cutover. Do not force them to zero in this phase.

Record the remaining categories and keep this phase focused on data correctness, not the final auth boundary swap.

## 6.3 Deferred Final Cutover

The route swap is **not** safe immediately after the preset migration because the app still authenticates through legacy NextAuth in multiple places:

- `src/core/auth.ts` exports `auth = legacyAuth`
- `src/core/platform/withAuth.ts` still calls NextAuth `auth()`
- many server components and server actions still call `auth()` directly
- many client components still use `next-auth/react`

Do not delete `src/app/api/auth/[...nextauth]/route.ts` in this phase.

Only perform the final cutover after all of the following are true:

- `withPermission` exists and protected server code no longer depends on `withAuth`
- direct `auth()` usage has been migrated to Better Auth session access or `getSession()` helpers
- `next-auth/react` usage has been removed from client components
- Google sign-in has been migrated to `authClient.signIn.social(...)`
- `session.user.position`, `users.position`, and `userPositions` references have been removed or replaced
- `pnpm tsc --noEmit` passes before the cutover commit

At that point, execute the cutover steps below atomically in the same commit.

### 6.3.1 Clean up stale NextAuth sessions

Immediately before the final route swap, purge existing legacy NextAuth sessions so users are forced to re-authenticate via Better Auth:

```sql
DELETE FROM sessions;
DELETE FROM verification_tokens;
```

This is safe only when done as part of the final cutover. Both systems use the `sessions` table name, so do not run this early after any Better Auth testing has begun.

### 6.3.2 Swap the route handler

1. Delete `src/app/api/auth/[...nextauth]/route.ts`
2. Create `src/app/api/auth/[...all]/route.ts`

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { betterAuthServer } from '@/core/auth';

export const { GET, POST } = toNextJsHandler(betterAuthServer);
```

> **IMPORTANT**: The Better Auth instance is exported as `betterAuthServer`, NOT `auth`. The `auth` export in `src/core/auth.ts` currently aliases `legacyAuth` from NextAuth. Do not perform this route swap until the remaining `auth()` consumers have been migrated.

Both route handlers CANNOT coexist. This must be atomic (same commit).

## 6.4 Update Next.js Config

`better-auth` is already present in `serverExternalPackages` in `next.config.ts`.

No code change is required here unless that entry is removed accidentally. The expected config remains:

```ts
serverExternalPackages: ['better-auth'],
```

Keep `authInterrupts: true` in `next.config.ts` — it is still needed for `unauthorized()` and `forbidden()` support in `withPermission`.

## 6.5 Create proxy.ts

Create `proxy.ts` only as part of the final cutover commit after the route handler has been swapped. Next.js 16 renamed `middleware.ts` to `proxy.ts` with the function export renamed from `middleware` to `proxy`. This is the optimistic auth redirect layer — **NOT** the final security boundary. Real protection happens in `withPermission` on the server.

File: `proxy.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_PATHS = ['/auth/login', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)'],
};
```

**Key points:**
- Next.js 16 uses `proxy.ts` (renamed from `middleware.ts`) with `export function proxy()` (not `middleware`)
- Cookie-only check (no DB hit) — this is the documented optimistic pattern
- Public paths (login page, auth API) are excluded
- Unauthenticated users are redirected to login with `callbackUrl`
- Does NOT replace server-side checks — `withPermission` is still the final boundary
- Better Auth docs explicitly label this as "an optimistic redirect layer"

## 6.6 Update Google OAuth Console

**CRITICAL**: Immediately after the final route swap from `[...nextauth]` to `[...all]`, verify the callback URL in Google Cloud Console:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit the OAuth 2.0 Client ID used by this app
3. Verify the authorized redirect URIs include:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
4. Better Auth typically uses the same callback path format, but **test sign-in immediately after the swap**
5. If sign-in fails with `redirect_uri_mismatch`, check the Better Auth logs for the exact callback URL it's sending and update Google Console accordingly

> **Note**: Better Auth docs emphasize setting `baseURL` explicitly to avoid `redirect_uri_mismatch` problems. The `BETTER_AUTH_URL` env var must match the domain used in Google Console.

## 6.7 Deferred `position` Column Removal

Do not remove `users.position` from `src/app/auth/users/_schema/users.ts` in this phase.

This action moves to **Phase 24: Cleanup, Verification & Testing**, which is the first phase where the plan already expects all remaining `position`-based code paths and legacy auth consumers to have been removed.

Remove the column only in the same final cutover window where all of the following are already complete:

- all TypeScript references to `users.position`, `session.user.position`, `userPositions`, and `UserPosition` are gone
- admin/user forms and detail pages no longer render or validate `position`
- notifications and any other position-targeting features have been migrated away from position-based targeting
- the application is type-clean without relying on the compatibility column

In Phase 24:

1. add the `ALTER TABLE users DROP COLUMN position;` step to the cutover migration
2. remove the Drizzle field from `users.ts`
3. run `pnpm db:generate` for the schema snapshot update
4. rerun `pnpm tsc --noEmit`

## Exit Criteria

- [ ] `permission_presets` table seeded with all predefined presets
- [ ] `preset_permissions` table populated with permissions per preset
- [ ] Users migrated from position to preset assignments
- [ ] Blocking audit confirms no unmapped staff users remain
- [ ] Compatibility audit completed for `position`, `auth()`, and `next-auth/react` references
- [ ] Legacy route handler remains in place until later session migrations are complete
- [ ] `users.position` remains as a temporary compatibility column until final cutover
- [ ] Final cutover prerequisites are documented for the later atomic swap commit
- [ ] `pnpm tsc --noEmit` passes
