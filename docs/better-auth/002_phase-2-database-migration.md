# Phase 2: Database Migration

**Prerequisites**: Phase 1 complete. Read `000_steering-document.md` first.

The schema migration must be completed before Phase 3 code depends on Better Auth tables.

## 2.1 Migration Strategy

Side-by-side migration:

1. Generate the Better Auth schema shape
2. Update Drizzle schema files to match Better Auth models
3. Create migrations for auth tables + permission preset tables
4. Migrate existing Auth.js account data
5. Seed predefined permission presets
6. Migrate position values → preset assignments
7. Drop obsolete tables/columns/enums after verification

## 2.2 Tables To Prepare

The migration covers:

- `users` — modify (add presetId, remove position/lmsUserId/lmsToken, convert enums to text)
- `accounts` — modify (map Auth.js fields to Better Auth fields)
- `sessions` — recreate (drop Auth.js sessions, create Better Auth sessions)
- `verifications` — new (replaces `verification_tokens`)
- `permission_presets` — new
- `preset_permissions` — new
- `lms_credentials` — new (extracted from users)
- `rate_limits` — new

Also:
- Drop `authenticators` table
- Drop `verification_tokens` table (replaced by `verifications`)
- Drop `userRoles`, `userPositions`, `dashboardUsers` enums (after column conversion)
- Convert `clearance.department` and `autoApprovals.department` from enum to text

## 2.3 Users Table Target

**Current shape:**

```
id, name, role (userRoles enum), position (userPositions enum),
email, email_verified (timestamp), image, lms_user_id, lms_token
```

**Target shape:**

```
id, name, role (text), email (not null), email_verified (boolean),
image, preset_id (FK → permission_presets.id, nullable),
created_at, updated_at, banned, ban_reason, ban_expires
```

**Required changes:**

1. Convert `role` from `userRoles` enum to `text`
2. Convert `email_verified` from `timestamp` to `boolean`
3. Enforce `email` and `name` as NOT NULL
4. Add Better Auth lifecycle fields: `created_at`, `updated_at`
5. Add Better Auth admin plugin fields: `banned`, `ban_reason`, `ban_expires`
6. Add `preset_id` FK → `permission_presets.id` (nullable, SET NULL on delete)
7. Remove `position` column
8. Remove `lms_user_id` and `lms_token` columns (moved to `lms_credentials`)

### Enum to Text Migration

All three PostgreSQL enums must be converted to text:

1. `users.role`: `userRoles` enum → `text` (preserve existing values)
2. `clearance.department`: `dashboardUsers` enum → `text`
3. `autoApprovals.department`: `dashboardUsers` enum → `text`
4. `blockedStudents.department`: `dashboardUsers` enum → `text`
5. `studentNotes.role`: `userRoles` enum → `text`
6. Drop enums after all dependent columns are converted: `userRoles`, `userPositions`, `dashboardUsers`

**SQL pattern for enum → text conversion:**

```sql
ALTER TABLE users ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE clearance ALTER COLUMN department TYPE text USING department::text;
ALTER TABLE auto_approvals ALTER COLUMN department TYPE text USING department::text;
ALTER TABLE blocked_students ALTER COLUMN department TYPE text USING department::text;
ALTER TABLE student_notes ALTER COLUMN role TYPE text USING role::text;
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS user_positions;
DROP TYPE IF EXISTS dashboard_users;
```

## 2.4 Accounts Migration

Map Auth.js account fields to Better Auth:

| Auth.js | Better Auth |
|---------|-------------|
| `id` | Generate new text ID with `nanoid()` |
| `userId` | `userId` (preserved) |
| `type` | Drop (not in Better Auth) |
| `provider` | `providerId` |
| `providerAccountId` | `accountId` |
| `access_token` | `accessToken` |
| `refresh_token` | `refreshToken` |
| `expires_at` | `accessTokenExpiresAt` (convert epoch → timestamp) |
| `token_type` | Drop |
| `scope` | `scope` |
| `id_token` | `idToken` |
| `session_state` | Drop |

Add new fields: `createdAt`, `updatedAt`, `password` (nullable, for future email/password).

Migration must preserve user linkage. Existing Google-linked users must continue to sign in.

## 2.5 Sessions Strategy

Drop all existing Auth.js sessions. Create the Better Auth sessions table fresh. Users will need to re-sign-in after cutover.

Better Auth sessions table includes admin plugin fields:

```
id, token, user_id, ip_address, user_agent,
expires_at, created_at, updated_at,
impersonated_by (admin plugin)
```

## 2.6 Verification Table

Current `verification_tokens` (composite PK) → new `verifications` (single `id` PK):

```sql
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
DROP TABLE IF EXISTS verification_tokens;
```

## 2.7 LMS Credentials Extraction

Extract `lms_user_id` and `lms_token` from `users` into `lms_credentials`:

```sql
INSERT INTO lms_credentials (user_id, lms_user_id, lms_token)
SELECT id, lms_user_id, lms_token
FROM users
WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL;

ALTER TABLE users DROP COLUMN lms_user_id;
ALTER TABLE users DROP COLUMN lms_token;
```

## 2.8 Permission Preset Seeds

After creating the `permission_presets` and `preset_permissions` tables, seed the predefined presets.

### Seed Data

The migration inserts these presets and their permissions (see `000_steering-document.md` for the full permission catalog per preset):

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

## 2.9 Position → Preset Migration

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

## 2.10 Drizzle Schema File Updates

### Users Schema

File: `src/app/auth/users/_schema/users.ts`

**Before:**
```ts
export const dashboardUsers = pgEnum('dashboard_users', [...]);
export const userRoles = pgEnum('user_roles', [...]);
export const userPositions = pgEnum('user_positions', [...]);

export const users = pgTable('users', {
  id: text().primaryKey(),
  name: text(),
  role: userRoles().notNull().default('user'),
  position: userPositions(),
  email: text().unique(),
  emailVerified: timestamp(),
  image: text(),
  lmsUserId: integer(),
  lmsToken: text(),
});
```

**After:**
```ts
import { permissionPresets } from '@auth/permission-presets/_schema/permissionPresets';

export const users = pgTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  role: text().notNull().default('user'),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  presetId: text('preset_id').references(() => permissionPresets.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  banned: boolean().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});
```

**Removed:**
- `dashboardUsers` enum export
- `userRoles` enum export
- `userPositions` enum export
- `position` column
- `lmsUserId` column
- `lmsToken` column

### Accounts Schema

File: `src/app/auth/auth-providers/_schema/accounts.ts`

Update to match Better Auth account model:

```ts
export const accounts = pgTable('accounts', {
  id: text().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text(),
  idToken: text('id_token'),
  password: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

### Sessions Schema

File: `src/app/auth/auth-providers/_schema/sessions.ts`

Replace Auth.js sessions with Better Auth model:

```ts
export const sessions = pgTable('sessions', {
  id: text().primaryKey(),
  token: text().notNull().unique(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  impersonatedBy: text('impersonated_by'),
});
```

### Verifications Schema

File: `src/app/auth/auth-providers/_schema/verifications.ts` (renamed from `verificationTokens.ts`)

```ts
export const verifications = pgTable('verifications', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
```

### Delete Authenticators

Delete `src/app/auth/auth-providers/_schema/authenticators.ts` and remove `authenticatorsRelations` from relations file.

## 2.11 Indexes

Ensure these indexes exist (add via Drizzle schema table definitions, not raw SQL):

- `users.email` (unique, already exists)
- `users.preset_id`
- `accounts.user_id` → `index('accounts_user_id_idx').on(table.userId)`
- `sessions.user_id` → `index('sessions_user_id_idx').on(table.userId)`
- `sessions.token` (unique, already exists)
- `verifications.identifier` → `index('verifications_identifier_idx').on(table.identifier)`
- `rate_limits.key` (primary key)
- `preset_permissions.preset_id`

## 2.12 Swap Auth Route Handler

After DB migration is verified:

1. Delete `src/app/api/auth/[...nextauth]/route.ts`
2. Create `src/app/api/auth/[...all]/route.ts`

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/core/auth';

export const { GET, POST } = toNextJsHandler(auth);
```

Both CANNOT coexist. This must be atomic (same commit).

## 2.13 Update Next.js Config

Remove `authInterrupts: true` from `next.config.ts` (Auth.js-specific).

## 2.14 Generate Drizzle Migration

After all schema files are updated:

```bash
pnpm db:generate
```

This generates a single migration covering all schema changes. **Never create .sql migration files manually** — it corrupts the Drizzle journal. Review the generated SQL to confirm it matches expected changes (enum→text conversions, column drops, new tables, indexes).

## 2.15 Update Dependent Schema Files

Update schema files that reference the dropped enums:

**`blockedStudents` schema**: Replace `dashboardUsers` enum with `text()` for the `department` column.

**`studentNotes` schema**: Replace `userRoles` enum with `text()` for the `role` column.

**`clearance` schema**: Replace `dashboardUsers` enum with `text()` for the `department` column.

**`autoApprovals` schema**: Replace `dashboardUsers` enum with `text()` for the `department` column.

> **Note**: After removing the enum exports from `users.ts`, all files that imported `userRoles`, `userPositions`, or `dashboardUsers` must be updated. Use `UserRole` and `DashboardRole` types from `src/core/auth/permissions.ts` for TypeScript validation where needed.

## Exit Criteria

- [ ] Better Auth schema files match target database shape
- [ ] Auth.js account data migrated to Better Auth field names
- [ ] Legacy sessions dropped (users re-authenticate)
- [ ] `permission_presets` table created with predefined presets seeded
- [ ] `preset_permissions` table created with permissions per preset
- [ ] Users assigned to presets based on former role+position
- [ ] `position` column dropped from users
- [ ] `lms_user_id` and `lms_token` moved to `lms_credentials`
- [ ] `lms_credentials` table populated from existing user data
- [ ] `rate_limits` table created
- [ ] `verifications` table created, `verification_tokens` dropped
- [ ] `authenticators` table and schema dropped
- [ ] All three enums (`userRoles`, `userPositions`, `dashboardUsers`) dropped
- [ ] `clearance.department`, `autoApprovals.department`, `blockedStudents.department` converted to text
- [ ] `studentNotes.role` converted to text
- [ ] All indexes exist (including `accounts_user_id_idx`, `sessions_user_id_idx`, `verifications_identifier_idx`)
- [ ] `schema` exported from `src/core/database/index.ts`
- [ ] Drizzle migration generated via `pnpm db:generate` (not manual SQL)
- [ ] Auth route handler swapped from `[...nextauth]` to `[...all]`
- [ ] `authInterrupts: true` removed from `next.config.ts`
