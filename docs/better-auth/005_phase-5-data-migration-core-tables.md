# Phase 5: Data Migration — Core Tables

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 4 complete. Read `000_overview.md` first.

This phase runs the custom data migration after the generated schema migration from Phase 4: pre-migration data checks, column type conversions, mapping Auth.js account data to Better Auth fields, dropping sessions, migrating verifications, extracting LMS credentials, and performing the delayed destructive cleanup.

## 5.0 Pre-Migration Data Checks & Execution Method

**IMPORTANT**: All data migration SQL in this phase should be executed via `pnpm db:generate --custom` to create a custom Drizzle migration file. This keeps the migration journal consistent and allows rollback.

Execution order for Phases 4 and 5 is strict:

1. Run `pnpm db:generate` in Phase 4 for the non-destructive schema migration.
2. Apply that generated migration.
3. Run `pnpm db:generate --custom` in Phase 5 for data copy, verification, and destructive cleanup.
4. Apply the custom migration only after validating the generated schema migration succeeded.

Before applying the schema migration from Phase 4, run these pre-checks to identify data that would violate new constraints:

```sql
-- Check for NULL emails (will break NOT NULL constraint)
SELECT id, name FROM users WHERE email IS NULL;

-- Check for NULL names (will break NOT NULL constraint)
SELECT id, email FROM users WHERE name IS NULL;

-- Fix NULLs before migration:
UPDATE users SET email = CONCAT('unknown-', id, '@placeholder.local') WHERE email IS NULL;
UPDATE users SET name = 'Unknown User' WHERE name IS NULL;
```

### emailVerified Conversion (timestamp → boolean)

This must happen BEFORE the column type change:

```sql
-- Convert timestamp to boolean (NULL = not verified)
ALTER TABLE users ALTER COLUMN email_verified TYPE boolean USING (email_verified IS NOT NULL);
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
```

### expires_at Conversion (epoch integer → timestamp)

For the accounts table, `expires_at` stores epoch seconds:

```sql
-- Add new column, convert, drop old
ALTER TABLE accounts ADD COLUMN access_token_expires_at TIMESTAMP;
UPDATE accounts SET access_token_expires_at = to_timestamp(expires_at) WHERE expires_at IS NOT NULL;
```

## 5.1 Accounts Data Migration

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

## 5.2 Sessions Strategy

Drop all existing Auth.js sessions. Create the Better Auth sessions table fresh. Users will need to re-sign-in after cutover.

Better Auth sessions table includes admin plugin fields:

```
id, token, user_id, ip_address, user_agent,
expires_at, created_at, updated_at,
impersonated_by (admin plugin)
```

## 5.3 Verification Table Migration

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

## 5.4 LMS Credentials Extraction

Extract `lms_user_id` and `lms_token` from `users` into `lms_credentials`:

```sql
INSERT INTO lms_credentials (user_id, lms_user_id, lms_token)
SELECT id, lms_user_id, lms_token
FROM users
WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL;

ALTER TABLE users DROP COLUMN lms_user_id;
ALTER TABLE users DROP COLUMN lms_token;
```

## 5.5 Delayed Destructive Cleanup

Only after LMS extraction and other data-copy checks pass, perform the delayed cleanup in this custom migration:

- Drop `users.lms_user_id`
- Drop `users.lms_token`
- Drop legacy enum types that are no longer referenced

Do NOT drop `users.position` here. That column remains available until Phase 6 finishes preset assignment verification.

## Exit Criteria

- [ ] Pre-migration NULL checks passed (email, name columns have no NULLs)
- [ ] `emailVerified` converted from timestamp to boolean
- [ ] `expires_at` epoch values converted to `access_token_expires_at` timestamps
- [ ] Auth.js account data migrated to Better Auth field names
- [ ] Legacy sessions dropped (users re-authenticate)
- [ ] `verification_tokens` dropped, `verifications` table created
- [ ] LMS credentials extracted to `lms_credentials` table
- [ ] Delayed destructive cleanup completed for LMS columns and fully-unused enum types
- [ ] `pnpm tsc --noEmit` passes
