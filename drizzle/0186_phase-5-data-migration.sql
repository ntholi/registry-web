-- ================================================================
-- Phase 5: Data Migration — Core Tables
-- Custom migration with embedded assertions and destructive cleanup last
-- ================================================================

-- ================================================================
-- ACCOUNTS: Copy Auth.js data to Better Auth columns
-- ================================================================
UPDATE accounts SET id = gen_random_uuid()::text WHERE id IS NULL;
--> statement-breakpoint
UPDATE accounts SET provider_id = provider WHERE provider_id IS NULL;
--> statement-breakpoint
UPDATE accounts SET account_id = provider_account_id WHERE account_id IS NULL;
--> statement-breakpoint
UPDATE accounts
SET access_token_expires_at = to_timestamp(expires_at)
WHERE expires_at IS NOT NULL AND access_token_expires_at IS NULL;
--> statement-breakpoint
UPDATE accounts SET created_at = NOW() WHERE created_at IS NULL;
--> statement-breakpoint
UPDATE accounts SET updated_at = NOW() WHERE updated_at IS NULL;

-- ================================================================
-- ACCOUNTS: Verify data copy — ABORT if any check fails
-- ================================================================
--> statement-breakpoint
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

-- ================================================================
-- ACCOUNTS: Migrate PK from composite to single id
-- ================================================================
--> statement-breakpoint
ALTER TABLE accounts ALTER COLUMN id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE accounts ALTER COLUMN account_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE accounts ALTER COLUMN provider_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE accounts DROP CONSTRAINT accounts_provider_provider_account_id_pk;
--> statement-breakpoint
ALTER TABLE accounts ADD PRIMARY KEY (id);

-- ================================================================
-- LMS: Extract credentials from users to lms_credentials
-- ================================================================
--> statement-breakpoint
INSERT INTO lms_credentials (id, user_id, lms_user_id, lms_token)
SELECT gen_random_uuid()::text, id, lms_user_id, lms_token
FROM users
WHERE lms_user_id IS NOT NULL OR lms_token IS NOT NULL;
--> statement-breakpoint
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

-- ================================================================
-- DESTRUCTIVE CLEANUP (only reached if ALL verifications passed)
-- ================================================================
--> statement-breakpoint
ALTER TABLE accounts DROP COLUMN type;
--> statement-breakpoint
ALTER TABLE accounts DROP COLUMN provider;
--> statement-breakpoint
ALTER TABLE accounts DROP COLUMN provider_account_id;
--> statement-breakpoint
ALTER TABLE accounts DROP COLUMN expires_at;
--> statement-breakpoint
ALTER TABLE accounts DROP COLUMN token_type;
--> statement-breakpoint
ALTER TABLE accounts DROP COLUMN session_state;
--> statement-breakpoint
ALTER TABLE users DROP COLUMN lms_user_id;
--> statement-breakpoint
ALTER TABLE users DROP COLUMN lms_token;
--> statement-breakpoint
DROP TYPE IF EXISTS user_roles;
--> statement-breakpoint
DROP TYPE IF EXISTS user_positions;
--> statement-breakpoint
DROP TYPE IF EXISTS dashboard_users;