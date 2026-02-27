# Phase 2: Database Migration

The database migration MUST be completed before any code changes in Phase 3. The new schema must be ready before the application code references it.

## 2.1 Side-by-Side Strategy
1. Generate Better Auth schema tables using CLI: `npx @better-auth/cli@latest generate --output src/core/auth/auth-schema.ts`
2. Better Auth creates: `user`, `session`, `account`, `verification`
3. Since `usePlural: true`, Better Auth will look for: `users`, `sessions`, `accounts`, `verifications`
4. Write a custom migration that:
   - Creates Better Auth `sessions` (including `impersonated_by` column for admin plugin)
   - Creates Better Auth `accounts`
   - Creates Better Auth `verifications`
   - Creates `rate_limit` table (required for `rateLimit.storage: "database"` since CLI migrate is unavailable with `better-auth/minimal`)
   - Creates `user_permissions`
   - Creates `lms_credentials`
   - Alters `users` table (enum/text conversion, timestamp/boolean conversion, added fields, dropped fields)
   - Migrates old account data to Better Auth account format
   - Drops old `sessions`, `accounts`, `verification_tokens`, `authenticators`
   - Converts `position` values into `user_permissions` preset rows

## 2.2 User Table Changes

Current users table:
```
id, name, role (pgEnum), position (pgEnum), email, email_verified (timestamp), image, lms_user_id, lms_token
```

Target users table:
```
id, name, role (text), email, email_verified (boolean), image, created_at, updated_at, banned, ban_reason, ban_expires
```

Changes:
- `role`: pgEnum → text
- `email_verified`: timestamp → boolean (`NOT NULL DEFAULT false`)
- `email`: enforce NOT NULL
- `name`: enforce NOT NULL
- Add: `created_at`, `updated_at`, `banned`, `ban_reason`, `ban_expires`
- Remove: `position`, `lms_user_id`, `lms_token`
- Drop enums: `user_roles`, `user_positions`, `dashboard_users`

Enum cleanup SQL:
```sql
ALTER TABLE users ALTER COLUMN role TYPE text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS user_positions;
DROP TYPE IF EXISTS dashboard_users;
```

## 2.3 Account Table Migration

Old accounts (Auth.js):
- Composite PK: `(provider, provider_account_id)`
- No `id` column

New accounts (Better Auth):
- `id` text PK
- `user_id`, `account_id`, `provider_id`, `access_token`, `refresh_token`, etc.

Mapping:
- `provider` → `provider_id`
- `provider_account_id` → `account_id`
- Generate `id` for each row

## 2.4 Session Table Migration

Old sessions are dropped (users re-login). Better Auth sessions include:
- `id` text PK
- `token` unique
- `user_id`
- `expires_at`
- `ip_address`, `user_agent`
- `impersonated_by` text nullable (added by admin plugin for impersonation tracking)
- `created_at`, `updated_at`

## 2.5 Enum Cleanup

Drop all 3 PostgreSQL enums during migration:
- `user_roles`
- `user_positions`
- `dashboard_users`

```sql
ALTER TABLE users ALTER COLUMN role TYPE text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN position DROP NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS position;
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS user_positions;
DROP TYPE IF EXISTS dashboard_users;
```

## 2.6 Drizzle Schema Updates

- Rewrite `src/app/auth/users/_schema/users.ts` for Better Auth user model
- Rewrite `src/app/auth/auth-providers/_schema/accounts.ts` for Better Auth account model
- Rewrite `src/app/auth/auth-providers/_schema/sessions.ts` for Better Auth session model
- Rename `src/app/auth/auth-providers/_schema/verificationTokens.ts` to `verifications.ts` and update schema
- Delete `src/app/auth/auth-providers/_schema/authenticators.ts`

## 2.6b Drizzle Relations (Required for Experimental Joins)

Since `experimental: { joins: true }` is enabled, Better Auth requires Drizzle relations to be defined. Without these, joins silently fall back to multiple queries (losing the 2-3x perf benefit).

Either run `npx @better-auth/cli@latest generate` to auto-generate relations, or add them manually:

File: `src/app/auth/auth-providers/_schema/relations.ts` (ensure these exist)

```ts
import { relations } from "drizzle-orm";
import { users } from "@auth/users/_schema/users";
import { accounts } from "./accounts";
import { sessions } from "./sessions";
import { verifications } from "./verifications";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
```

**CRITICAL**: These relations MUST be passed through the Drizzle adapter `schema` option for experimental joins to work. The `schema` object passed to `drizzleAdapter()` must include both the table definitions AND these relation definitions. Since our `db` instance already includes a schema object, we need to ensure all auth relations are exported from `@auth/_database` and included in the central `@/core/database` schema barrel.

## 2.7 Database Indexes (Performance)

Better Auth's performance guide recommends these indexes for optimal query performance. Add to the custom migration SQL:

```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications (identifier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_key ON rate_limit (key);
```

## 2.8 Rate Limit Table (Required for `rateLimit.storage: "database"`)

Since `better-auth/minimal` disables the CLI `migrate` command, the `rate_limit` table MUST be created manually in the custom migration. Without this table, rate limiting will fail at runtime.

Schema (from Better Auth docs):

```sql
CREATE TABLE IF NOT EXISTS rate_limit (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL,
  last_request BIGINT NOT NULL
);
```

> **Why is this here?** The `rateLimit.storage: "database"` option tells Better Auth to store rate limit counters in the database. Normally you'd run `npx @better-auth/cli migrate` to auto-create this table, but since we use `better-auth/minimal` (which excludes the built-in Kysely adapter), the CLI migrate command is unavailable. We create it ourselves.

These are critical with 12K+ users and frequent session lookups on Vercel serverless.
