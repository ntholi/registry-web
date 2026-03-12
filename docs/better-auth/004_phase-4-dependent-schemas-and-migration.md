# Phase 4: Dependent Schemas, Indexes & Migration Generation

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 3 complete. Read `000_overview.md` first.

This phase updates all non-auth schema files that reference the legacy enums, adds required indexes, and generates the non-destructive Drizzle schema migration.

## 4.0 Accounts Schema: Zero-Rename Safety Update

**ALREADY APPLIED** — The accounts schema (`src/app/auth/auth-providers/_schema/accounts.ts`) has been updated to a **transitional state** that keeps ALL original Auth.js columns alongside the new Better Auth columns:

**Why**: The accounts table has a fundamentally different structure between Auth.js and Better Auth:
- Auth.js: composite PK `(provider, provider_account_id)`, no `id` column
- Better Auth: single PK `id`, columns renamed (`provider` → `provider_id`, `provider_account_id` → `account_id`)

If Drizzle's interactive rename prompts are answered incorrectly, data like the Google account link (`provider_account_id`) could be lost. The zero-rename approach eliminates ALL rename prompts for accounts by keeping old columns and adding new ones.

**Transitional schema keeps**:
- `type`, `provider`, `provider_account_id`, `expires_at`, `token_type`, `session_state` (old Auth.js columns)
- Composite PK `(provider, provider_account_id)` (matches DB)

**Transitional schema adds** (all nullable, populated in Phase 5):
- `id`, `account_id`, `provider_id`, `access_token_expires_at`, `refresh_token_expires_at`, `password`, `created_at`, `updated_at`

**Result**: `pnpm db:generate` produces only `ADD COLUMN` statements for accounts — **zero interactive prompts, zero rename risk**.

## 4.1 Update Dependent Schema Files

Update schema files that reference the dropped enums:

**`blockedStudents` schema**: Replace `dashboardUsers` enum with `text()` for the `department` column.

**`studentNotes` schema**: Replace `userRoles` enum with `text()` for the `role` column.

**`clearance` schema**: Replace `dashboardUsers` enum with `text()` for the `department` column.

**`autoApprovals` schema**: Replace `dashboardUsers` enum with `text()` for the `department` column.

> **Note**: After removing the enum exports from `users.ts`, all files that imported `userRoles`, `userPositions`, or `dashboardUsers` must be updated. Use `UserRole` and `DashboardRole` types from `src/core/auth/permissions.ts` for TypeScript validation where needed.

## 4.2 Indexes

Ensure these indexes exist (add via Drizzle schema table definitions, not raw SQL):

- `users.email` (unique, already exists)
- `users.preset_id`
- `accounts.user_id` → `index('accounts_user_id_idx').on(table.userId)`
- `sessions.user_id` → `index('sessions_user_id_idx').on(table.userId)`
- `sessions.token` (unique, already exists)
- `verifications.identifier` → `index('verifications_identifier_idx').on(table.identifier)`
- `rate_limits.key` (primary key)
- `preset_permissions.preset_id`

## 4.3 Pre-Generation Database Backup

**MANDATORY** before generating or applying any migration:

```bash
pg_dump postgresql://dev:111111@localhost:5432/registry > registry_pre_phase4_backup.sql
```

This dump is your full recovery point. If anything goes wrong in Phase 4 or Phase 5, restore with:

```bash
psql postgresql://dev:111111@localhost:5432/registry < registry_pre_phase4_backup.sql
```

## 4.4 Generate Drizzle Migration

```bash
pnpm db:generate
```

### Expected Prompt Answers

With the zero-rename accounts schema, the **only** interactive prompts will be for the **sessions** table. The DB has columns `session_token` (PK) and `expires`, but the schema has `token` and `expires_at`:

| Prompt | Correct Answer | Why |
|--------|---------------|-----|
| Is `token` created or renamed from `session_token`? | Either works | Sessions will be truncated in Phase 5. No user data at risk. |
| Is `expires_at` created or renamed from `expires`? | Either works | Same reason — sessions are disposable. |

**Why any answer is safe for sessions**: Sessions are temporary authentication state (32K rows). Phase 5 truncates ALL sessions. Users simply re-sign-in after cutover. There is zero permanent data in the sessions table.

No prompts should appear for accounts (all ADD COLUMN), users (type changes only), or dependent schemas (type changes only).

### Expected Generated SQL Summary

The generated migration should include:

1. **New tables**: `lms_credentials`, `rate_limits`, `verifications`, `permission_presets`, `preset_permissions`
2. **Accounts — ADD COLUMN only**: `id`, `account_id`, `provider_id`, `access_token_expires_at`, `refresh_token_expires_at`, `password`, `created_at`, `updated_at`
3. **Users — type changes**: `role` (enum→text), `email_verified` (timestamp→boolean), `name` (SET NOT NULL), `email` (SET NOT NULL)
4. **Users — new columns**: `preset_id`, `created_at`, `updated_at`, `banned`, `ban_reason`, `ban_expires`
5. **Sessions**: renames or create/drop per prompt answers, plus new columns
6. **Dependent schemas**: `department` and `creator_role` columns (enum→text)
7. **Indexes**: as defined in 4.2
8. **Authenticators table drop** (empty table, safe)

## 4.5 Post-Generation SQL Review & Required Edits

After `pnpm db:generate` creates the migration file, open it and make these edits:

### Edit 1: `email_verified` USING clause (REQUIRED)

Find the line that changes `email_verified` type and add the `USING` clause:

```sql
-- Drizzle generates something like:
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DATA TYPE boolean;

-- Change it to:
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DATA TYPE boolean USING (email_verified IS NOT NULL);
```

Without the `USING` clause, PostgreSQL cannot cast timestamp → boolean and the migration fails. The `USING (email_verified IS NOT NULL)` converts NULL timestamps to `false` and non-NULL timestamps to `true`.

### Edit 2: Fix NULL names before NOT NULL constraint (REQUIRED)

Find the line that adds NOT NULL to `name` and insert an UPDATE before it:

```sql
-- Add this line BEFORE the SET NOT NULL:
UPDATE "users" SET "name" = 'Unknown User' WHERE "name" IS NULL;
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
```

There are currently 3 users with NULL names. Without the UPDATE, `SET NOT NULL` fails.

### Edit 3: Truncate sessions before structural changes (RECOMMENDED)

If sessions has structural changes (rename, PK change, NOT NULL additions), add a TRUNCATE at the start of the sessions section:

```sql
TRUNCATE TABLE "sessions";
-- Then the sessions ALTER/RENAME/ADD statements...
```

This ensures session structural changes work regardless of which prompt answers were chosen. Sessions data has no long-term value.

### Review Checklist

After edits, verify the generated SQL:

- [ ] **No `DROP COLUMN` on accounts** — only `ADD COLUMN` statements
- [ ] **No `DROP COLUMN` on users** for `position`, `lms_user_id`, `lms_token`
- [ ] **No `DROP TYPE`** for `user_roles`, `user_positions`, `dashboard_users` (they must remain until Phase 5)
- [ ] `email_verified` ALTER TYPE has `USING (email_verified IS NOT NULL)`
- [ ] `name` SET NOT NULL is preceded by the NULL fix UPDATE
- [ ] Enum→text conversions present for: `users.role`, `clearance.department`, `auto_approvals.department`, `blocked_students.by_department`, `student_notes.creator_role`
- [ ] New tables created: `lms_credentials`, `rate_limits`, `verifications`, `permission_presets`, `preset_permissions`

## 4.6 Apply Migration & Post-Apply Verification

Apply the migration:

```bash
pnpm db:migrate
```

Then verify critical data survived:

```sql
-- Run via psql:
-- 1. User count unchanged (expect 12,576)
SELECT count(*) FROM users;

-- 2. Account count unchanged (expect 12,596)
SELECT count(*) FROM accounts;

-- 3. All users have names
SELECT count(*) FROM users WHERE name IS NULL;  -- Must be 0

-- 4. All users have emails
SELECT count(*) FROM users WHERE email IS NULL;  -- Must be 0

-- 5. Role values preserved
SELECT role, count(*) FROM users GROUP BY role ORDER BY count DESC;

-- 6. Positions preserved (expect 153 non-NULL)
SELECT count(*) FROM users WHERE position IS NOT NULL;

-- 7. Account-user linkage intact
SELECT count(*) FROM accounts a
JOIN users u ON a.user_id = u.id;  -- Should match account count

-- 8. New accounts columns exist but empty (Phase 5 populates them)
SELECT count(*) FROM accounts WHERE id IS NOT NULL;  -- Should be 0
SELECT count(*) FROM accounts WHERE provider_id IS NOT NULL;  -- Should be 0
```

If ANY check fails, restore from the backup taken in step 4.3.

## Exit Criteria

- [ ] Accounts schema in transitional state (old + new columns, composite PK)
- [ ] Dependent schemas updated: enum columns → text (clearance, autoApprovals, blockedStudents, studentNotes)
- [ ] All indexes defined in schema files
- [ ] Database backup created before generation
- [ ] Drizzle schema migration generated via `pnpm db:generate` (not manual SQL)
- [ ] Generated SQL edited: `email_verified` USING clause, `name` NULL fix, sessions TRUNCATE
- [ ] Generated SQL reviewed: no unexpected drops of accounts columns, users columns, or enum types
- [ ] Migration applied and post-apply verification passed
- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm tsc --noEmit` passes
