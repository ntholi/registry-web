# Phase 3: Auth Table Schema Updates

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 2 complete. Read `000_overview.md` first.

This phase updates the core Drizzle schema TypeScript files for auth tables (users, accounts, sessions, verifications) to match the Better Auth target shape, deletes the authenticators table, and updates Drizzle relations. The actual data migration and destructive cleanup happen in Phase 5.

## 3.1 Migration Strategy

Side-by-side migration:

1. Generate the Better Auth schema shape
2. Update Drizzle schema files to match Better Auth models
3. Keep legacy source columns available until Phase 5 custom migration has copied and verified their data
4. Generate a custom migration via `pnpm db:generate --custom` (Phase 4) — avoids interactive rename prompts and ensures exact SQL control
5. Populate the custom migration with hand-crafted SQL that handles enum→text conversions, timestamp→boolean conversions, NULL data fixes, and sessions table recreation
6. Data migration, destructive drops, and seeding happen in Phases 5–6

## 3.2 Tables To Prepare

The migration covers:

- `users` — modify (add presetId, keep temporary compatibility columns for position/lmsUserId/lmsToken until Phase 5, convert enums to text)
- `accounts` — modify (map Auth.js fields to Better Auth fields)
- `sessions` — recreate (drop Auth.js sessions, create Better Auth sessions)
- `verifications` — new (replaces `verification_tokens`)
- `permission_presets` — new (created in Phase 2 schema files)
- `preset_permissions` — new (created in Phase 2 schema files)
- `lms_credentials` — new (created in Phase 2 schema files)
- `rate_limits` — new (created in Phase 2 schema files)

Also:
- Drop `authenticators` table
- Drop `verification_tokens` table (replaced by `verifications`)
- Keep legacy `position`, `lms_user_id`, and `lms_token` columns available through Phase 5 extraction/mapping
- Drop `userRoles`, `userPositions`, `dashboardUsers` enums only after all dependent data has been migrated and verified in Phase 5
- Convert `clearance.department` and `autoApprovals.department` from enum to text

## 3.3 Users Table Target

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
7. Preserve `position` as a temporary compatibility column until Phase 6 preset mapping is verified
8. Preserve `lms_user_id` and `lms_token` as temporary compatibility columns until Phase 5 extraction is verified

### Enum to Text Migration

All three PostgreSQL enums must be converted to text:

1. `users.role`: `userRoles` enum → `text` (preserve existing values)
2. `clearance.department`: `dashboardUsers` enum → `text`
3. `autoApprovals.department`: `dashboardUsers` enum → `text`
4. `blockedStudents.department`: `dashboardUsers` enum → `text`
5. `studentNotes.role`: `userRoles` enum → `text`
6. `users.position`: `userPositions` enum → `text` (column kept until Phase 5)

> **Note**: Enum TYPES (`user_roles`, `user_positions`, `dashboard_users`) are intentionally kept alive in the database until Phase 5. The Drizzle TS schema still exports the `pgEnum` declarations for backward-compatible type inference. Dropping the DB types now would cause schema drift on the next `db:generate`.

**SQL pattern for enum → text conversion** (executed via custom migration in Phase 4):

```sql
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
ALTER TABLE "users" ALTER COLUMN "position" SET DATA TYPE text USING "position"::text;
ALTER TABLE "clearance" ALTER COLUMN "department" SET DATA TYPE text USING "department"::text;
ALTER TABLE "auto_approvals" ALTER COLUMN "department" SET DATA TYPE text USING "department"::text;
ALTER TABLE "blocked_students" ALTER COLUMN "by_department" SET DATA TYPE text USING "by_department"::text;
ALTER TABLE "student_notes" ALTER COLUMN "creator_role" SET DATA TYPE text USING "creator_role"::text;
-- DO NOT drop enum types here — deferred to Phase 5
```

## 3.4 Users Schema Update

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

**Deferred removal until Phase 5 custom migration:**
- `dashboardUsers` enum export
- `userRoles` enum export
- `userPositions` enum export
- `position` column
- `lmsUserId` column
- `lmsToken` column

## 3.5 Accounts Schema Update

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

## 3.6 Sessions Schema Update

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

## 3.7 Verifications Schema + Delete Authenticators

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

## 3.8 Update Drizzle Relations for Better Auth Tables

File: `src/app/auth/auth-providers/_schema/relations.ts`

Better Auth docs state: *"Drizzle relations need to exist"* for the adapter to use efficient joins instead of falling back to multiple queries. Update the relations file to match the new Better Auth table shapes:

```ts
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { accounts } from './accounts';
import { sessions } from './sessions';
import { verifications } from './verifications';

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
```

**Changes from current:**
- Remove `authenticatorsRelations` (table dropped)
- Keep `accountsRelations` and `sessionsRelations` (fields are the same FK)
- No relation needed for `verifications` (no FK to users)
- These relations are passed to the Better Auth adapter via the `schema` object and enable join-based queries

Also add relations for the permission preset schema:

File: `src/app/auth/permission-presets/_schema/relations.ts`

```ts
import { relations } from 'drizzle-orm';
import { permissionPresets } from './permissionPresets';
import { presetPermissions } from './presetPermissions';

export const permissionPresetsRelations = relations(permissionPresets, ({ many }) => ({
  permissions: many(presetPermissions),
}));

export const presetPermissionsRelations = relations(presetPermissions, ({ one }) => ({
  preset: one(permissionPresets, {
    fields: [presetPermissions.presetId],
    references: [permissionPresets.id],
  }),
}));
```

## Exit Criteria

- [ ] Users schema updated: enums replaced with `text()`, new fields added, legacy source columns (`position`, `lmsUserId`, `lmsToken`) preserved until Phase 5 cleanup
- [ ] Accounts schema updated to transitional state (old + new columns, composite PK)
- [ ] Sessions schema updated to Better Auth model
- [ ] Verifications schema created, verificationTokens deleted
- [ ] Authenticators schema and relations deleted
- [ ] Drizzle relations updated for Better Auth tables (accounts, sessions) — enables join optimization
- [ ] Permission preset relations created (permissionPresets ↔ presetPermissions)
- [ ] No `DROP TYPE` for enum types — they remain until Phase 5
- [ ] No `DROP COLUMN` for `position`, `lms_user_id`, `lms_token` — they remain until Phase 5
- [ ] `pnpm tsc --noEmit` passes
