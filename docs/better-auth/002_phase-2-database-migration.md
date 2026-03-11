# Phase 2: Database Migration

Status: maintain this phase document together with `better-auth-documentation.md`.

If this file conflicts with `better-auth-documentation.md`, use `better-auth-documentation.md` as the authoritative source.

The schema migration must be completed before Phase 3 code starts depending on Better Auth tables and fields.

## 2.1 Migration Strategy

Use a side-by-side migration:

1. Generate the Better Auth schema shape.
2. Update Drizzle schema files to match the target Better Auth models.
3. Create a migration that prepares tables and columns needed by Better Auth.
4. Migrate existing Auth.js account data.
5. Drop obsolete Auth.js tables only after data migration is verified.

## 2.2 Tables And Data To Prepare

The migration must cover:

- `users`
- `accounts`
- `sessions`
- `verifications` (renamed from `verification_tokens`)
- `user_permissions`
- `lms_credentials`
- `rate_limits` (new, for database-backed rate limiting)

The migration must also:

- convert legacy `position` values into permission preset rows where required
- drop the `authenticators` table (Auth.js WebAuthn, not needed)
- drop the `authenticators` schema file and its relations

## 2.3 Users Table Target

Current important legacy fields:

```text
id, name, role, position, email, email_verified, image, lms_user_id, lms_token
```

Target user shape for Better Auth:

```text
id, name, role, email, email_verified, image, created_at, updated_at, banned, ban_reason, ban_expires
```

Required changes:

- convert `role` from enum to text
- convert `email_verified` to boolean
- enforce `email` and `name` as required
- add Better Auth lifecycle and ban fields
- remove `position`, `lms_user_id`, and `lms_token` from `users`
- drop the obsolete auth-related enums once no table depends on them

### Enum To Text Migration

The `userRoles` and `userPositions` PostgreSQL enums must be converted to text columns. The `dashboardUsers` enum is also used in non-auth schema columns:

- `clearance.department` column
- `autoApprovals.department` column

All three enums must be fully migrated:

1. Convert `users.role` from `userRoles` enum to `text`
2. Convert `clearance.department` from `dashboardUsers` enum to `text`
3. Convert `autoApprovals.department` from `dashboardUsers` enum to `text`
4. Drop `userRoles`, `userPositions`, and `dashboardUsers` enums after all dependent columns are converted

### OAuth Token Encryption Note

With `encryptOAuthTokens: true` and `updateAccountOnSignIn: true`, existing plaintext OAuth tokens will be re-encrypted on each user's next sign-in. No batch migration of existing tokens is required. Tokens for users who never sign in again will remain as expired plaintext rows.

## 2.4 Accounts Migration

Migrate legacy Auth.js accounts into Better Auth accounts by:

- preserving user linkage
- mapping provider fields to Better Auth names
- generating a new primary key for each account row

Existing Google-linked users must continue to sign in against their migrated account row.

## 2.5 Sessions Strategy

Do not migrate existing sessions. Drop legacy sessions and require users to sign in again after cutover.

Because the admin plugin remains in scope, the Better Auth sessions table must include the admin-plugin fields it depends on.

## 2.6 Drizzle Schema Updates

Update these schema files to match the Better Auth model:

- `src/app/auth/users/_schema/users.ts`
- `src/app/auth/auth-providers/_schema/accounts.ts`
- `src/app/auth/auth-providers/_schema/sessions.ts`
- `src/app/auth/auth-providers/_schema/verifications.ts` (renamed from `verificationTokens.ts`)

Delete obsolete schema artifacts that only existed for Auth.js:

- `src/app/auth/auth-providers/_schema/authenticators.ts`
- Remove `authenticatorsRelations` from `src/app/auth/auth-providers/_schema/relations.ts`

### Verification Table Rename

The current `verification_tokens` table with composite primary key must be renamed to `verifications` with:

- new single `id` column (text, primary key)
- `identifier` → kept
- `token` → renamed to `value`
- `expires` → renamed to `expiresAt`
- new `createdAt` and `updatedAt` columns

The SQL migration must:
1. Create the new `verifications` table
2. Migrate any existing data (if any)
3. Drop the old `verification_tokens` table

### Rate Limit Table

The rate limit schema file was created in Phase 1 at `src/app/auth/auth-providers/_schema/rateLimits.ts`. Ensure the Drizzle migration creates this table.

## 2.7 Minimal Indexes

Keep only the indexes needed for core auth lookups:

- `users.email`
- `accounts.user_id`
- `sessions.user_id`
- `sessions.token`
- `verifications.identifier`
- `rate_limits.key` (unique index, required for database-backed rate limiting)

## 2.8 Export Schema Object

Update `src/core/database/index.ts` to export the `schema` object. Ensure all new tables from Phase 1 (`userPermissions`, `lmsCredentials`, `rateLimits`) are included in the schema aggregation.

```ts
export { schema };
```

## 2.9 Swap Auth Route Handler

After the database migration is verified and all indexes exist, atomically swap the auth route handler:

1. Delete `src/app/api/auth/[...nextauth]/route.ts`
2. Create `src/app/api/auth/[...all]/route.ts`

Both CANNOT coexist under `/api/auth/` (Next.js catch-all conflict). This must happen in the same commit.

File: `src/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/core/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { POST, GET } = toNextJsHandler(auth);
```

**Why this is in Phase 2, not Phase 1**: Better Auth will immediately try to use the database when the route is active. If the DB schema hasn't been migrated yet (wrong column names, missing tables), all auth operations will fail. The route swap must happen AFTER the DB is ready.

## 2.10 Update Next.js Config Cleanup

Remove `authInterrupts: true` from `next.config.ts`. This is an Auth.js-specific Next.js feature and has no effect with Better Auth.

## Exit Criteria

- Better Auth schema files match the target database shape.
- Auth.js account data is migrated.
- Legacy sessions are intentionally invalidated.
- `user_permissions` and `lms_credentials` are ready for Phase 3.
- `rate_limits` table exists with unique index on `key`.
- `verification_tokens` renamed to `verifications` with correct column mappings.
- `authenticators` table and schema dropped.
- `dashboardUsers`, `userRoles`, and `userPositions` enums converted to text and dropped.
- `clearance.department` and `autoApprovals.department` columns converted from enum to text.
- All required indexes exist.
- `schema` is exported from `src/core/database/index.ts` with all new tables included.
- Auth route handler swapped from `[...nextauth]` to `[...all]` (atomically, same commit).
- `authInterrupts: true` removed from `next.config.ts`.
- Obsolete Auth.js-only tables and enums are removed only after verification.
