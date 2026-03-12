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

Run these queries via `psql` and **save the output**. You will compare against these after Phase 5.

```sql
-- Snapshot A: Row counts
SELECT
  (SELECT count(*) FROM users) AS total_users,
  (SELECT count(*) FROM accounts) AS total_accounts,
  (SELECT count(*) FROM users WHERE position IS NOT NULL) AS users_with_position,
  (SELECT count(*) FROM users WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL) AS users_with_lms;

-- Snapshot B: User role distribution
SELECT role, count(*) FROM users GROUP BY role ORDER BY count(*) DESC;

-- Snapshot C: Account-user linkage (critical for sign-in)
SELECT count(*) AS linked_accounts
FROM accounts a JOIN users u ON a.user_id = u.id;

-- Snapshot D: Provider distribution
SELECT provider, count(*) FROM accounts GROUP BY provider;

-- Snapshot E: Sample of 5 accounts (spot-check reference)
SELECT user_id, provider, provider_account_id, expires_at
FROM accounts LIMIT 5;
```

## 5.1 Create Custom Migration

```bash
pnpm db:generate --custom
```

This creates an empty SQL file in `drizzle/`. Open it and paste the complete SQL from sections 5.2 through 5.7 below.

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

## 5.5 Sessions Reset

Sessions are temporary authentication state. All 32K sessions are dropped — users re-sign-in after cutover.

```sql
-- ================================================================
-- SESSIONS: Clear all Auth.js sessions
-- ================================================================
TRUNCATE TABLE sessions;
```

## 5.6 Verification Table & Authenticators Cleanup

Both tables are empty (0 rows). Safe to drop.

```sql
-- ================================================================
-- VERIFICATION TOKENS & AUTHENTICATORS: Drop legacy tables
-- ================================================================
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS authenticators;
```

## 5.7 LMS Credentials Extraction

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

## 5.8 Destructive Cleanup

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

-- Drop enum types no longer used by any column
-- NOTE: user_positions is NOT dropped — still used by users.position (kept until Phase 6)
DROP TYPE IF EXISTS user_roles;
DROP TYPE IF EXISTS dashboard_users;
```

## 5.9 Final Integrity Verification

After the custom migration completes, apply it and run these queries manually via `psql`. Compare against the Snapshot from 5.0.

```sql
-- ================================================================
-- POST-MIGRATION VERIFICATION (run via psql after applying)
-- ================================================================

-- V1: Row counts must match pre-migration snapshot
SELECT
  (SELECT count(*) FROM users) AS total_users,
  (SELECT count(*) FROM accounts) AS total_accounts;

-- V2: User role distribution must match Snapshot B
SELECT role, count(*) FROM users GROUP BY role ORDER BY count(*) DESC;

-- V3: Account-user linkage must match Snapshot C
SELECT count(*) AS linked_accounts
FROM accounts a JOIN users u ON a.user_id = u.id;

-- V4: Every account has valid Better Auth fields
SELECT count(*) FROM accounts
WHERE id IS NULL OR account_id IS NULL OR provider_id IS NULL;
-- Must be 0

-- V5: Spot-check — compare against Snapshot E
-- For each account from your pre-migration sample, verify:
SELECT a.id, a.user_id, a.provider_id, a.account_id, a.access_token_expires_at
FROM accounts a
WHERE a.user_id IN (/* paste user_ids from Snapshot E */);
-- provider_id should match old provider value
-- account_id should match old provider_account_id value

-- V6: Users with positions preserved (compare against Snapshot A)
SELECT count(*) FROM users WHERE position IS NOT NULL;

-- V7: No orphaned accounts (every account points to a valid user)
SELECT count(*) FROM accounts a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;
-- Must be 0

-- V8: email_verified correctly converted (Phase 4 handled this)
SELECT email_verified, count(*) FROM users GROUP BY email_verified;
-- Should show false: <total_users> (all were NULL timestamps → false)

-- V9: Sessions table is empty and has correct structure
SELECT count(*) FROM sessions;  -- Must be 0
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sessions' ORDER BY ordinal_position;

-- V10: Old columns are gone
SELECT column_name FROM information_schema.columns
WHERE table_name = 'accounts' AND column_name IN (
  'type', 'provider', 'provider_account_id',
  'expires_at', 'token_type', 'session_state'
);
-- Must return 0 rows
```

## 5.10 Post-Phase-5 Schema Cleanup

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

### Remove unused enum exports

Remove `userRoles` and `dashboardUsers` pgEnum declarations and their type exports from `users.ts`. Keep `userPositions` (still used by `position` column).

### Verify schema matches DB

```bash
pnpm db:generate
```

This should report **no changes needed**. If Drizzle wants to generate changes, the schema doesn't match the DB — review and fix before proceeding.

## 5.11 Rollback Procedure

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
- [ ] Sessions truncated
- [ ] `verification_tokens` and `authenticators` tables dropped
- [ ] LMS credentials extracted (count matches source)
- [ ] Old Auth.js columns dropped from accounts
- [ ] `lms_user_id` and `lms_token` dropped from users
- [ ] `user_roles` and `dashboard_users` enum types dropped
- [ ] Post-migration verification queries all pass
- [ ] Accounts schema updated to final Better Auth shape
- [ ] `pnpm db:generate` reports no changes (schema matches DB)
- [ ] `pnpm tsc --noEmit` passes
