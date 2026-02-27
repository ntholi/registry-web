# Phase 2: Database Migration

The database migration MUST be completed before any code changes in Phase 3. The new schema must be ready before the application code references it.

## 2.1 Side-by-Side Strategy
1. Generate Better Auth schema tables using CLI: `npx @better-auth/cli@latest generate --output src/core/auth/auth-schema.ts`
2. Better Auth creates: `user`, `session`, `account`, `verification`
3. Since `usePlural: true`, Better Auth will look for: `users`, `sessions`, `accounts`, `verifications`
4. Write a custom migration that:
   - Creates Better Auth `sessions`
   - Creates Better Auth `accounts`
   - Creates Better Auth `verifications`
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
