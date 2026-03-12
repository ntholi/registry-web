# Phase 2: Auth Config, Schema Files & Client

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 1 complete. Read `000_overview.md` first.

## Essential Outcomes

- Create all Better Auth config files and new schema files
- Do NOT swap the auth route handler yet (that happens at the end of Phase 6)
- Create permission preset schema files
- Create the Better Auth client

## 2.1 Create Better Auth Server Entry

Rename existing `src/core/auth.ts` → `src/core/auth.legacy.ts`.

Create new `src/core/auth.ts`:

```ts
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin, customSession } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import { db, schema } from '@/core/database';
import type { PermissionGrant } from '@/core/auth/permissions';
import { listPresetPermissions } from '@auth/permission-presets/_server/repository';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema,
  }),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((o) => o.trim()) ?? []),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
      presetId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 5,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: 'compact',
      version: '1',
    },
  },
  account: {
    encryptOAuthTokens: true,
    updateAccountOnSignIn: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/social': { window: 10, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    database: {
      generateId: () => nanoid(),
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
    },
  },
  plugins: [
    admin({ defaultRole: 'user' }),
    customSession(async ({ user, session }) => {
      let permissions: PermissionGrant[] = [];
      if (user.presetId) {
        permissions = await listPresetPermissions(user.presetId);
      }
      return { user, session, permissions };
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
```

**Key decisions**:
- Uses `better-auth/minimal` import — documented bundle-size optimization for adapter-based setups (Drizzle)
- Admin plugin is included for user management APIs (ban, impersonate, list users) but NOT used for permission checking
- No `ac` or `roles` passed to admin plugin — permissions are repo-owned via preset system
- `nanoid()` for ID generation (preserves existing user ID format)
- Cookie cache with compact strategy for performance
- Rate limiting with database storage
- `src/core/auth.ts` may import `db` only for Better Auth adapter wiring; the preset-permission query itself must live in auth-owned repository code to stay aligned with the repo database-access rule
- `presetId` declared in `additionalFields` as `type: 'string'` so it's properly typed in `session.user.presetId` (avoids unsafe casts)
- `customSession` plugin enriches session with preset permissions (loaded once, cached in cookie via `cookieCache`)
- `nextCookies()` must be the LAST plugin in the array (Better Auth requirement)
- `encryptOAuthTokens: true` — tokens stored encrypted in DB; any code needing raw tokens must use Better Auth's API, NOT direct DB reads

## 2.2 Create Better Auth Client

File: `src/core/auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields, customSessionClient } from 'better-auth/client/plugins';
import type { auth } from '@/core/auth';

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient(),
    customSessionClient<typeof auth>(),
  ],
});
```

## 2.3 Create New Schema Files

### Permission Presets Table

File: `src/app/auth/permission-presets/_schema/permissionPresets.ts`

```ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const permissionPresets = pgTable('permission_presets', {
  id: text().primaryKey().$defaultFn(() => nanoid()),
  name: text().notNull().unique(),
  role: text().notNull(),
  description: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

### Preset Permissions Table

File: `src/app/auth/permission-presets/_schema/presetPermissions.ts`

```ts
import { pgTable, text, unique, index } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { permissionPresets } from './permissionPresets';

export const presetPermissions = pgTable('preset_permissions', {
  id: text().primaryKey().$defaultFn(() => nanoid()),
  presetId: text()
    .references(() => permissionPresets.id, { onDelete: 'cascade' })
    .notNull(),
  resource: text().notNull(),
  action: text().notNull(),
}, (table) => ({
  uniquePresetResourceAction: unique().on(table.presetId, table.resource, table.action),
  presetIdIdx: index('idx_preset_permissions_preset_id').on(table.presetId),
}));
```

### Relations

File: `src/app/auth/permission-presets/_schema/relations.ts`

```ts
import { relations } from 'drizzle-orm';
import { permissionPresets } from './permissionPresets';
import { presetPermissions } from './presetPermissions';
import { users } from '@auth/users/_schema/users';

export const permissionPresetsRelations = relations(permissionPresets, ({ many }) => ({
  permissions: many(presetPermissions),
  users: many(users),
}));

export const presetPermissionsRelations = relations(presetPermissions, ({ one }) => ({
  preset: one(permissionPresets, {
    fields: [presetPermissions.presetId],
    references: [permissionPresets.id],
  }),
}));
```

### LMS Credentials Table

File: `src/app/auth/auth-providers/_schema/lmsCredentials.ts`

```ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { users } from '@auth/users/_schema/users';

export const lmsCredentials = pgTable('lms_credentials', {
  id: text().primaryKey().$defaultFn(() => nanoid()),
  userId: text()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  lmsUserId: integer(),
  lmsToken: text(),
});
```

### Rate Limits Table

File: `src/app/auth/auth-providers/_schema/rateLimits.ts`

```ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const rateLimits = pgTable('rate_limits', {
  key: text().primaryKey(),
  count: integer().notNull(),
  lastRequest: timestamp('last_request').notNull(),
});
```

> **Verification**: After setup, run `npx auth generate --output ./ba-schema-check.ts` and compare the generated `rateLimit` table against our `rateLimits` schema to ensure column names and types align. Delete the generated file afterwards.

> **MANDATORY**: This verification step is BLOCKING. Do NOT proceed to Phase 3 until the generated schema aligns with all manually-defined tables (`users`, `accounts`, `sessions`, `verifications`, `rateLimits`). If any column names or types differ, update the manual schemas to match.

### Preset Catalog Source Of Truth

Create `src/app/auth/permission-presets/_lib/catalog.ts` as the only typed definition for:

- Predefined preset seeds
- Resource grouping metadata for the permission matrix UI
- Legacy `role + position -> preset` migration mapping used in Phase 6

Do not redefine these lists in later phases. Phase 6 seeding, Phase 22 matrix rendering, Phase 23 user-form preview, and Phase 24 tests must all import from this catalog.

### Minimal Auth-Owned Repository Helper

Create `src/app/auth/permission-presets/_server/repository.ts` in this phase with the minimal read helper needed by `customSession`:

```ts
export async function listPresetPermissions(presetId: string): Promise<PermissionGrant[]> { ... }
```

Phase 20 expands this same auth-owned module with the full repository, service, and actions used by the admin pages.

## 2.4 Update Barrel Exports

Update `src/app/auth/_database/index.ts` to re-export new schema files:

- `permissionPresets`
- `presetPermissions`
- `permissionPresetsRelations`
- `presetPermissionsRelations`
- `lmsCredentials`
- `rateLimits`

Update `src/core/database/index.ts` to include new tables in the `schema` object and add `export { schema }`.

## 2.5 ~~Create Proxy~~ — DEFERRED TO PHASE 6

> **Note**: The proxy file (`proxy.ts`) is created in Phase 6 after the route handler swap. Do not create it here — Phase 2 focuses on config and schema files only. See Phase 6, Section 6.5.

## Exit Criteria

- [ ] `src/core/auth.ts` has Better Auth server config with `customSession` plugin (coexists with legacy)
- [ ] `src/core/auth-client.ts` has Better Auth React client with `customSessionClient`
- [ ] Permission preset schema files created (text IDs with nanoid)
- [ ] LMS credentials and rate limits schema files created
- [ ] Minimal auth-owned preset repository helper created for `customSession`
- [ ] **MANDATORY**: `npx auth generate` output verified against manual schemas — all column names and types match
- [ ] Rate limit schema verified against `npx auth generate` output
- [ ] Barrel exports updated
- [ ] `schema` exported from `src/core/database/index.ts`
- [ ] Shared preset catalog created in `src/app/auth/permission-presets/_lib/catalog.ts`
- [ ] `pnpm tsc --noEmit` passes (no type errors from new files)
