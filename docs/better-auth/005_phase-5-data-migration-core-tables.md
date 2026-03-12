# Phase 5: Data Migration — Core Tables

> Estimated Implementation Time: 2 to 2.5 hours

**Prerequisites**: Phase 4 complete and migration applied. Read `000_overview.md` first.

This phase runs a custom Drizzle migration that copies data from old Auth.js columns to new Better Auth columns, verifies every step with assertions that **ABORT the migration on failure**, migrates the accounts primary key, extracts LMS credentials, and performs destructive cleanup only after all checks pass.

## 5.0 Safety Architecture

### How data is protected

1. **Pre-migration `pg_dump` backup** (Phase 4.3) — full database restore point
2. **Zero-rename accounts schema** (Phase 4.0) — old columns are NEVER modified, only new columns are populated
3. **Embedded SQL assertions** — every critical step has a `DO $$ ... RAISE EXCEPTION` block that aborts the entire migration if any data check fails
4. **Idempotent UPDATE statements** — all data copies use `WHERE new_col IS NULL`, so re-running after a failure is safe
5. **Destructive operations last** — column drops and PK changes only execute after ALL verification passes

### Data snapshot: BEFORE applying Phase 5

> **Note**: If you already ran `pnpm migration:snapshot` in Phase 4.3.2, the snapshot file already exists and covers the pre-Phase-4 state. If Phase 4 has been applied since then, re-run the snapshot to capture the current (post-Phase-4, pre-Phase-5) state:

```bash
pnpm migration:snapshot
```

This captures every user row, every account row, all role/position/provider distributions, account-user linkages, and all dependent enum values to `scripts/migration/snapshot-before-migration.json`.

You can optionally also run these queries manually via `psql` for a quick visual confirmation:

```sql
-- Quick visual check (optional — the snapshot script captures all this automatically)
SELECT
  (SELECT count(*) FROM users) AS total_users,
  (SELECT count(*) FROM accounts) AS total_accounts,
  (SELECT count(*) FROM users WHERE position IS NOT NULL) AS users_with_position,
  (SELECT count(*) FROM users WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL) AS users_with_lms;
```

## 5.1 Create Custom Migration

```bash
pnpm db:generate --custom --name=phase-5-data-migration
```

This creates an empty SQL file in `drizzle/`. Open it and paste the SQL from sections 5.2 through 5.7 below (skip 5.5 — no SQL needed).

> **Reminder**: Phase 4 already handled sessions (dropped and recreated empty), `authenticators` (dropped), and `verification_tokens` (dropped). Phase 5 only deals with accounts data migration, LMS extraction, and destructive cleanup of old columns/types.

## 5.2 Accounts Data Copy

This populates the new Better Auth columns from the old Auth.js columns. Old columns are **never modified** — only new columns are written.

```sql
-- ================================================================
-- ACCOUNTS: Copy Auth.js data to Better Auth columns
-- ================================================================

-- Generate unique IDs for all existing accounts
UPDATE accounts SET id = gen_random_uuid()::text WHERE id IS NULL;

-- Copy provider name: provider → provider_id
UPDATE accounts SET provider_id = provider WHERE provider_id IS NULL;

-- Copy account identifier: provider_account_id → account_id
UPDATE accounts SET account_id = provider_account_id WHERE account_id IS NULL;

-- Convert epoch seconds → timestamp: expires_at → access_token_expires_at
UPDATE accounts
SET access_token_expires_at = to_timestamp(expires_at)
WHERE expires_at IS NOT NULL AND access_token_expires_at IS NULL;

-- Set lifecycle timestamps for existing rows
UPDATE accounts SET created_at = NOW() WHERE created_at IS NULL;
UPDATE accounts SET updated_at = NOW() WHERE updated_at IS NULL;
```

## 5.3 Accounts Verification (Abort on Failure)

This block **prevents the migration from continuing** if any data copy failed. If an assertion fails, PostgreSQL raises an exception and rolls back.

```sql
-- ================================================================
-- ACCOUNTS: Verify data copy — ABORT if any check fails
-- ================================================================
DO $$
DECLARE
  v_total_accounts INTEGER;
  v_null_ids INTEGER;
  v_null_provider_ids INTEGER;
  v_null_account_ids INTEGER;
  v_mismatched_providers INTEGER;
  v_mismatched_accounts INTEGER;
  v_duplicate_ids INTEGER;
  v_null_created_at INTEGER;
BEGIN
  SELECT count(*) INTO v_total_accounts FROM accounts;
  SELECT count(*) INTO v_null_ids FROM accounts WHERE id IS NULL;
  SELECT count(*) INTO v_null_provider_ids FROM accounts WHERE provider_id IS NULL;
  SELECT count(*) INTO v_null_account_ids FROM accounts WHERE account_id IS NULL;
  SELECT count(*) INTO v_mismatched_providers FROM accounts WHERE provider_id != provider;
  SELECT count(*) INTO v_mismatched_accounts FROM accounts WHERE account_id != provider_account_id;
  SELECT count(*) - count(DISTINCT id) INTO v_duplicate_ids FROM accounts;
  SELECT count(*) INTO v_null_created_at FROM accounts WHERE created_at IS NULL;

  RAISE NOTICE '=== ACCOUNTS VERIFICATION ===';
  RAISE NOTICE 'Total accounts: %', v_total_accounts;
  RAISE NOTICE 'NULL ids: %, NULL provider_ids: %, NULL account_ids: %',
    v_null_ids, v_null_provider_ids, v_null_account_ids;
  RAISE NOTICE 'Mismatched providers: %, Mismatched accounts: %',
    v_mismatched_providers, v_mismatched_accounts;
  RAISE NOTICE 'Duplicate ids: %, NULL created_at: %',
    v_duplicate_ids, v_null_created_at;

  IF v_null_ids > 0 THEN
    RAISE EXCEPTION 'ABORT: % accounts have NULL id after data copy', v_null_ids;
  END IF;
  IF v_null_provider_ids > 0 THEN
    RAISE EXCEPTION 'ABORT: % accounts have NULL provider_id after data copy', v_null_provider_ids;
  END IF;
  IF v_null_account_ids > 0 THEN
    RAISE EXCEPTION 'ABORT: % accounts have NULL account_id after data copy', v_null_account_ids;
  END IF;
  IF v_mismatched_providers > 0 THEN
    RAISE EXCEPTION 'ABORT: % accounts have provider_id != provider (data corruption)', v_mismatched_providers;
  END IF;
  IF v_mismatched_accounts > 0 THEN
    RAISE EXCEPTION 'ABORT: % accounts have account_id != provider_account_id (data corruption)', v_mismatched_accounts;
  END IF;
  IF v_duplicate_ids > 0 THEN
    RAISE EXCEPTION 'ABORT: % duplicate account ids detected', v_duplicate_ids;
  END IF;
  IF v_null_created_at > 0 THEN
    RAISE EXCEPTION 'ABORT: % accounts have NULL created_at', v_null_created_at;
  END IF;

  RAISE NOTICE 'ACCOUNTS VERIFICATION PASSED — all % accounts validated.', v_total_accounts;
END $$;
```

## 5.4 Accounts Primary Key Migration

Only executes if section 5.3 passed (otherwise the migration already aborted).

```sql
-- ================================================================
-- ACCOUNTS: Migrate PK from composite to single id
-- ================================================================

-- Add NOT NULL constraints (data is guaranteed populated by 5.3)
ALTER TABLE accounts ALTER COLUMN id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN provider_id SET NOT NULL;

-- Drop the old composite primary key
ALTER TABLE accounts DROP CONSTRAINT accounts_provider_provider_account_id_pk;

-- Add new single-column primary key
ALTER TABLE accounts ADD PRIMARY KEY (id);
```

## 5.5 Sessions, Verification Tokens & Authenticators

> **No SQL needed in Phase 5.** All three were already handled by the Phase 4 custom migration:
> - `sessions` — dropped and recreated with the Better Auth schema (empty)
> - `authenticators` — dropped (was empty, 0 rows)
> - `verification_tokens` — dropped (was empty, 0 rows)
>
> The `verifications` replacement table was also created in Phase 4.

## 5.6 LMS Credentials Extraction

Extract `lms_user_id` and `lms_token` from `users` into the dedicated `lms_credentials` table. Currently 0 users have LMS data, but this handles future cases safely.

```sql
-- ================================================================
-- LMS: Extract credentials from users to lms_credentials
-- ================================================================
INSERT INTO lms_credentials (id, user_id, lms_user_id, lms_token)
SELECT gen_random_uuid()::text, id, lms_user_id, lms_token
FROM users
WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL;

-- Verify extraction
DO $$
DECLARE
  v_source_count INTEGER;
  v_dest_count INTEGER;
BEGIN
  SELECT count(*) INTO v_source_count
  FROM users WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL;

  SELECT count(*) INTO v_dest_count FROM lms_credentials;

  IF v_source_count != v_dest_count THEN
    RAISE EXCEPTION 'ABORT: LMS extraction mismatch — source=%, dest=%',
      v_source_count, v_dest_count;
  END IF;

  RAISE NOTICE 'LMS extraction verified: % credentials migrated.', v_dest_count;
END $$;
```

## 5.7 Destructive Cleanup

These columns and types are dropped ONLY because all verification above has passed. If any assertion failed, the migration already aborted before reaching this point.

```sql
-- ================================================================
-- DESTRUCTIVE CLEANUP (only reached if ALL verifications passed)
-- ================================================================

-- Drop old Auth.js accounts columns (data already copied to new columns)
ALTER TABLE accounts DROP COLUMN type;
ALTER TABLE accounts DROP COLUMN provider;
ALTER TABLE accounts DROP COLUMN provider_account_id;
ALTER TABLE accounts DROP COLUMN expires_at;
ALTER TABLE accounts DROP COLUMN token_type;
ALTER TABLE accounts DROP COLUMN session_state;

-- Drop LMS columns from users (data extracted to lms_credentials)
ALTER TABLE users DROP COLUMN lms_user_id;
ALTER TABLE users DROP COLUMN lms_token;

-- Drop all three enum types — no column uses any of them after Phase 4:
--   user_roles:      users.role → text (Phase 4), student_notes.creator_role → text (Phase 4)
--   user_positions:  users.position → text (Phase 4) — column kept until Phase 6 but type is text now
--   dashboard_users: clearance.department → text (Phase 4), auto_approvals.department → text (Phase 4),
--                    blocked_students.by_department → text (Phase 4)
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS user_positions;
DROP TYPE IF EXISTS dashboard_users;
```

## 5.8 Final Integrity Verification

After the custom migration completes, apply it:

```bash
pnpm db:migrate
```

Then run the **automated verification** against the pre-migration snapshot:

```bash
pnpm migration:verify
```

This runs **59 individual assertions** that compare every piece of data against the snapshot:

| Check Category | What it verifies |
|---------------|------------------|
| **Row counts** | Exact same number of users and accounts (zero rows lost) |
| **Every user row** | id exists, name preserved (NULL→'Unknown User' accounted for), role matches, email matches, position matches, image matches |
| **Every account row** | `provider` → `provider_id` correct, `provider_account_id` → `account_id` correct, access_token/refresh_token/scope/id_token preserved, `expires_at` → `access_token_expires_at` timestamp conversion |
| **Account-user linkage** | Same count of valid FK relationships |
| **Role distribution** | Same per-role user counts |
| **Position distribution** | Every position value and count matches |
| **LMS extraction** | Credentials in `lms_credentials` table match source user data |
| **email_verified** | NULL→false conversion, non-NULL→true conversion, zero NULLs remaining |
| **No orphaned accounts** | Every account points to a valid user |
| **Better Auth fields** | All accounts have non-NULL id, provider_id, account_id, unique ids, timestamps |
| **Sessions table** | Empty with correct Better Auth columns |
| **Old columns dropped** | 6 account columns + 2 user columns removed |
| **Enum types dropped** | `user_roles`, `user_positions`, `dashboard_users` all removed |
| **Dependent enum→text** | Every row in clearance, auto_approvals, blocked_students, student_notes matches original value |
| **Provider distribution** | Same per-provider account counts |

The script exits with code 0 if ALL checks pass and code 1 if ANY check fails, printing a summary of failures.

> **If any check fails**, do NOT proceed to Phase 5.9. Restore from the `pg_dump` backup (Phase 4.3) and investigate.

You can also run these queries manually via `psql` for additional spot-checking:

```sql
-- Quick manual spot-checks (optional — the verify script covers all of these)
SELECT (SELECT count(*) FROM users) AS total_users, (SELECT count(*) FROM accounts) AS total_accounts;
SELECT role, count(*) FROM users GROUP BY role ORDER BY count(*) DESC;
SELECT count(*) FROM accounts WHERE id IS NULL OR account_id IS NULL OR provider_id IS NULL;  -- Must be 0
SELECT count(*) FROM accounts a LEFT JOIN users u ON a.user_id = u.id WHERE u.id IS NULL;  -- Must be 0
```

## 5.9 Post-Phase-5 Schema Cleanup

After the custom migration is applied and verification passes, update the Drizzle schema files to match the final DB state:

### Update accounts schema to final Better Auth shape

Replace the transitional `accounts.ts` with the target schema:

```ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../users/_schema/users';

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
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

### Remove dropped columns from users schema

Remove `lmsUserId` and `lmsToken` from the users table definition (keep `position` until Phase 6).

### Remove all enum exports

Remove **all three** pgEnum declarations and their type exports from `users.ts`:
- `userRoles` / `UserRole` type — users.role is now `text()`
- `userPositions` / `UserPosition` type — users.position is now `text()` (Phase 4 converted it)
- `dashboardUsers` / `DashboardUser` type — all dependent columns are now `text()`

> **Note**: The `UserRole`, `DashboardRole`, and `UserPosition` TypeScript types are still available from `src/core/auth/permissions.ts` — they were moved there in Phase 2. No code should be importing these types from the schema file anymore.

### Verify schema matches DB

```bash
pnpm db:generate
```

This should report **no changes needed**. If Drizzle wants to generate changes, the schema doesn't match the DB — review and fix before proceeding.

## 5.10 Rollback Procedure

If the custom migration fails or verification reveals data issues:

### If migration aborted (assertion failure)

The embedded `RAISE EXCEPTION` blocks prevent destructive operations from executing. Old columns still contain the original data. Fix the issue and re-run — the UPDATE statements are idempotent (`WHERE new_col IS NULL`).

### If migration completed but verification fails

Restore from the `pg_dump` backup taken in Phase 4.3:

```bash
dropdb -U dev registry
createdb -U dev registry
psql postgresql://dev:111111@localhost:5432/registry < registry_pre_phase4_backup.sql
```

Then investigate the failure, fix the SQL, and re-run both Phase 4 and Phase 5 migrations.

### If you need to restart from scratch

```bash
# Reset the Drizzle migration journal by removing the Phase 4 and Phase 5 migration files
# from drizzle/, then restore the backup and regenerate
```

## Exit Criteria

- [ ] Pre-migration data snapshots saved
- [ ] Custom migration created via `pnpm db:generate --custom`
- [ ] All embedded assertions passed (accounts verification, LMS verification)
- [ ] Accounts PK migrated from composite `(provider, provider_account_id)` to single `id`
- [ ] `provider` → `provider_id` data copy verified (zero mismatches)
- [ ] `provider_account_id` → `account_id` data copy verified (zero mismatches)
- [ ] `expires_at` epoch values converted to `access_token_expires_at` timestamps
- [ ] LMS credentials extracted (count matches source)
- [ ] Old Auth.js columns dropped from accounts (`type`, `provider`, `provider_account_id`, `expires_at`, `token_type`, `session_state`)
- [ ] `lms_user_id` and `lms_token` dropped from users
- [ ] All three enum types dropped (`user_roles`, `user_positions`, `dashboard_users`)
- [ ] Post-migration verification queries all pass
- [ ] Accounts schema updated to final Better Auth shape
- [ ] `pnpm db:generate` reports no changes (schema matches DB)
- [ ] `pnpm tsc --noEmit` passes
