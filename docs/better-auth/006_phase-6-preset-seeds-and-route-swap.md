# Phase 6: Preset Seeds, Route Swap & Middleware

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 5 complete. Read `000_overview.md` first.

This phase seeds permission presets, migrates position→preset assignments, swaps the auth route handler, creates the middleware, and verifies Google OAuth.

## 6.1 Permission Preset Seeds

After creating the `permission_presets` and `preset_permissions` tables, seed the predefined presets.

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
  (<id>, 'lecturers', 'manage'),
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
  (<id>, 'feedback-reports', 'manage'),
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
  (<id>, 'graduation', 'manage'),
  (<id>, 'activity-tracker', 'read'),
  (<id>, 'tasks', 'read'),
  (<id>, 'tasks', 'create'),
  (<id>, 'tasks', 'update'),
  (<id>, 'tasks', 'delete'),
  (<id>, 'gradebook', 'read'),
  (<id>, 'gradebook', 'update'),
  (<id>, 'gradebook', 'approve');

-- Academic Program Leader
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Program Leader', 'academic', 'Program-level academic management');
-- Permissions: lecturers:read/manage, feedback-questions:CRUD, feedback-categories:CRUD,
-- school-structures:read/update, registration:read/update, timetable:read, students:read,
-- gradebook:read/update/approve

-- Academic Year Leader
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Year Leader', 'academic', 'Year-level academic oversight');
-- Permissions: feedback-cycles:read, registration:read, students:read, timetable:read

-- Academic Lecturer
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Lecturer', 'academic', 'Teaching staff access');
-- Permissions: assessments:CRUD, gradebook:read/update, feedback-reports:read, timetable:read

-- Academic Principal Lecturer
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Principal Lecturer', 'academic', 'Senior teaching staff access');
-- Permissions: assessments:CRUD, gradebook:read/update/approve, feedback-reports:read, timetable:read

-- Academic Admin
INSERT INTO permission_presets (name, role, description) VALUES
  ('Academic Admin', 'academic', 'Academic administrative support');
-- Permissions: assessments:CRUD, feedback-questions:CRUD, feedback-categories:CRUD,
-- feedback-cycles:CRUD, timetable:read
```

**Registry, Finance, and Other Presets:**

```sql
-- Registry Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Registry Staff', 'registry', 'Standard registry operations');
-- Permissions: students:read/update/manage, registration:CRUD, documents:read/create,
-- student-statuses:read/create/update/delete, terms-settings:read/update,
-- certificate-reprints:CRUD, modules:create, semester-modules:create/update,
-- venues:create/update/delete, graduation:read

-- Registry Manager
INSERT INTO permission_presets (name, role, description) VALUES
  ('Registry Manager', 'registry', 'Registry department management');
-- All of Registry Staff + activity-tracker:read, tasks:CRUD, school-structures:update

-- Finance Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Finance Staff', 'finance', 'Standard finance operations');
-- Permissions: sponsors:read/manage, admissions-payments:read/update,
-- student-statuses:read, graduation:read, students:read

-- Finance Manager
INSERT INTO permission_presets (name, role, description) VALUES
  ('Finance Manager', 'finance', 'Finance department management');
-- All of Finance Staff + activity-tracker:read, tasks:CRUD

-- Library Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Library Staff', 'library', 'Library operations');
-- Permissions: library:CRUD, students:read

-- Marketing Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Marketing Staff', 'marketing', 'Marketing and admissions outreach');
-- Permissions: applicants:CRUD, applications:CRUD, entry-requirements:CRUD,
-- admissions-payments:read, admissions-documents:read

-- Student Services Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Student Services Staff', 'student_services', 'Student services operations');
-- Permissions: students:read/update, registration:read/update,
-- documents:read/create, student-statuses:read/create/update

-- LEAP Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('LEAP Staff', 'leap', 'LEAP program operations');
-- Permissions: assessments:CRUD, registration:read/update, students:read

-- Human Resource Staff
INSERT INTO permission_presets (name, role, description) VALUES
  ('Human Resource Staff', 'human_resource', 'HR access');
-- Permissions: feedback-reports:read
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
```

Then drop the position column:

```sql
ALTER TABLE users DROP COLUMN position;
```

## 6.3 Swap Auth Route Handler

After DB migration is verified:

1. Delete `src/app/api/auth/[...nextauth]/route.ts`
2. Create `src/app/api/auth/[...all]/route.ts`

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/core/auth';

export const { GET, POST } = toNextJsHandler(auth);
```

Both CANNOT coexist. This must be atomic (same commit).

## 6.4 Update Next.js Config

Add `better-auth` to `serverExternalPackages` in `next.config.ts` (if not already done in Phase 1):

```ts
serverExternalPackages: ['better-auth'],
```

Keep `authInterrupts: true` in `next.config.ts` — it is still needed for `unauthorized()` and `forbidden()` support in `withPermission`.

## 6.5 Create middleware.ts

Better Auth docs recommend creating a middleware layer for optimistic auth redirects. This is **NOT** the final security boundary — real protection happens in `withPermission` on the server.

File: `src/middleware.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_PATHS = ['/auth/login', '/api/auth'];

export function middleware(request: NextRequest) {
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
- Cookie-only check (no DB hit) — this is the documented optimistic pattern
- Public paths (login page, auth API) are excluded
- Unauthenticated users are redirected to login with `callbackUrl`
- Does NOT replace server-side checks — `withPermission` is still the final boundary
- Better Auth docs explicitly label this as "an optimistic redirect layer"

## 6.6 Update Google OAuth Console

**CRITICAL**: After swapping the route handler from `[...nextauth]` to `[...all]`, verify the callback URL in Google Cloud Console:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit the OAuth 2.0 Client ID used by this app
3. Verify the authorized redirect URIs include:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
4. Better Auth typically uses the same callback path format, but **test sign-in immediately after the swap**
5. If sign-in fails with `redirect_uri_mismatch`, check the Better Auth logs for the exact callback URL it's sending and update Google Console accordingly

> **Note**: Better Auth docs emphasize setting `baseURL` explicitly to avoid `redirect_uri_mismatch` problems. The `BETTER_AUTH_URL` env var must match the domain used in Google Console.

## Exit Criteria

- [ ] `permission_presets` table seeded with all predefined presets
- [ ] `preset_permissions` table populated with permissions per preset
- [ ] Users migrated from position to preset assignments
- [ ] `position` column dropped from users table
- [ ] Auth route handler swapped from `[...nextauth]` to `[...all]`
- [ ] `src/middleware.ts` created with cookie-only optimistic redirect
- [ ] Google OAuth Console callback URIs verified
- [ ] Sign-in tested after route swap
- [ ] `pnpm tsc --noEmit` passes
