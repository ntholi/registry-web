# Phase 1: Foundation

> Estimated Implementation Time: 2 to 4 hours

**Prerequisites**: Read `000_steering-document.md` first. It is the authoritative reference.

## Essential Outcomes

- Install Better Auth alongside Auth.js (both coexist temporarily)
- Create all Better Auth config files and new schema files
- Do NOT swap the auth route handler yet (that happens at the end of Phase 2)
- Create permission preset schema files
- Create the access control permission catalog

## 1.1 Install Dependencies

```bash
pnpm add better-auth @better-auth/drizzle-adapter
```

Do NOT remove `next-auth` or `@auth/drizzle-adapter` yet.

## 1.2 Update Next.js Config

Add `better-auth` to `serverExternalPackages` in `next.config.ts`:

```ts
serverExternalPackages: ['better-auth'],
```

Keep `authInterrupts: true` until Phase 2 route swap.

## 1.3 Add Environment Variables

Add alongside existing Auth.js env vars:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID` (already exists)
- `GOOGLE_CLIENT_SECRET` (already exists)

Do NOT remove Auth.js env vars (`AUTH_SECRET`, `AUTH_URL`, etc.) yet — they are cleaned up in Phase 5.

> **Note**: After migration, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` will be removed. Only `BETTER_AUTH_*` and `GOOGLE_*` vars will remain.

## 1.4 Create Permission Catalog

File: `src/core/auth/permissions.ts`

This file defines the complete resource:action permission catalog and TypeScript types used throughout the app:

```ts
export const RESOURCES = [
  'lecturers',
  'assessments',
  'semester-modules',
  'modules',
  'school-structures',
  'feedback-questions',
  'feedback-categories',
  'feedback-cycles',
  'feedback-reports',
  'timetable',
  'venues',
  'gradebook',
  'students',
  'registration',
  'student-statuses',
  'documents',
  'terms-settings',
  'graduation',
  'certificate-reprints',
  'applicants',
  'applications',
  'admissions-payments',
  'admissions-documents',
  'entry-requirements',
  'sponsors',
  'users',
  'tasks',
  'activity-tracker',
  'library',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'manage',
  'approve',
] as const;

export type Action = (typeof ACTIONS)[number];

export type PermissionRequirement = {
  [R in Resource]?: Action[];
};

export type AuthRequirement =
  | 'all'
  | 'auth'
  | 'dashboard'
  | PermissionRequirement;

export const DASHBOARD_ROLES = [
  'finance',
  'registry',
  'library',
  'resource',
  'academic',
  'marketing',
  'student_services',
  'admin',
  'leap',
  'human_resource',
] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

export const USER_ROLES = ['student', ...DASHBOARD_ROLES] as const;

export type UserRole = (typeof USER_ROLES)[number];
```

## 1.5 Create Better Auth Server Entry

Rename existing `src/core/auth.ts` → `src/core/auth.legacy.ts`.

Create new `src/core/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import { db, schema } from '@/core/database';

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
        type: [
          'user', 'applicant', 'student', 'finance', 'registry', 'library',
          'academic', 'marketing', 'student_services', 'resource', 'leap',
          'human_resource', 'admin',
        ],
        required: false,
        defaultValue: 'user',
        input: false,
      },
      presetId: {
        type: 'number',
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
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
```

**Key decisions**:
- Admin plugin is included for user management APIs (ban, impersonate, list users) but NOT used for permission checking
- No `ac` or `roles` passed to admin plugin — permissions are repo-owned via preset system
- `nanoid()` for ID generation (preserves existing user ID format)
- Cookie cache with compact strategy for performance
- Rate limiting with database storage
- `presetId` declared in `additionalFields` so it's properly typed in `session.user.presetId` (avoids unsafe casts)
- `encryptOAuthTokens: true` — tokens stored encrypted in DB; any code needing raw tokens must use Better Auth's API, NOT direct DB reads

## 1.6 Create Better Auth Client

File: `src/core/auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from '@/core/auth';

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient(),
  ],
});
```

## 1.7 Create New Schema Files

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
  lastRequest: timestamp().notNull(),
});
```

> **Verification**: After setup, run `npx @better-auth/cli generate --output ./ba-schema-check.ts` and compare the generated `rateLimit` table against our `rateLimits` schema to ensure column names and types align. Delete the generated file afterwards.

## 1.8 Update Barrel Exports

Update `src/app/auth/_database/index.ts` to re-export new schema files:

- `permissionPresets`
- `presetPermissions`
- `permissionPresetsRelations`
- `presetPermissionsRelations`
- `lmsCredentials`
- `rateLimits`

Update `src/core/database/index.ts` to include new tables in the `schema` object and add `export { schema }`.

## 1.9 Create Proxy

File: `proxy.ts` (project root)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/academic/:path*',
    '/registry/:path*',
    '/finance/:path*',
    '/admin/:path*',
    '/lms/:path*',
    '/timetable/:path*',
    '/library/:path*',
    '/admissions/:path*',
    '/student-portal/:path*',
    '/apply/:path*',
  ],
};
```

> **Important**: This is ONLY an optimistic redirect — NOT a security layer. Real authorization happens in `withPermission`.

## Exit Criteria

- [ ] `better-auth` and `@better-auth/drizzle-adapter` installed
- [ ] `next.config.ts` has `serverExternalPackages: ['better-auth']`
- [ ] New env vars documented and set locally
- [ ] `src/core/auth/permissions.ts` defines full resource:action catalog and `UserRole` type
- [ ] `src/core/auth.ts` has Better Auth server config (coexists with legacy)
- [ ] `src/core/auth-client.ts` has Better Auth React client
- [ ] Permission preset schema files created (text IDs with nanoid)
- [ ] LMS credentials and rate limits schema files created
- [ ] Rate limit schema verified against `@better-auth/cli generate` output
- [ ] Barrel exports updated
- [ ] `schema` exported from `src/core/database/index.ts`
- [ ] `proxy.ts` created at project root
- [ ] `pnpm tsc --noEmit` passes (no type errors from new files)
