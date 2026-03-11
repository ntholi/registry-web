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
- `verifications`
- `user_permissions`
- `lms_credentials`

The migration must also convert legacy `position` values into permission preset rows where required.

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
- `src/app/auth/auth-providers/_schema/verifications.ts`

Delete obsolete schema artifacts that only existed for Auth.js.

## 2.7 Minimal Indexes

Keep only the indexes needed for core auth lookups:

- `users.email`
- `accounts.user_id`
- `sessions.user_id`
- `sessions.token`
- `verifications.identifier`

Do not add optional rate-limit or join-optimization indexes in this phase.

## Exit Criteria

- Better Auth schema files match the target database shape.
- Auth.js account data is migrated.
- Legacy sessions are intentionally invalidated.
- `user_permissions` and `lms_credentials` are ready for Phase 3.
- Obsolete Auth.js-only tables and enums are removed only after verification.
