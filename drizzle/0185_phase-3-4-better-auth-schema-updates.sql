-- Custom SQL migration file, put your code below! --
-- ================================================================
-- Phase 3-4: Better Auth Schema Updates
-- Custom migration — no interactive prompts, full control
--
-- Preconditions (verified against live DB):
--   users: 12,612 rows, 3 NULL names, 0 NULL emails
--   accounts: 12,632 rows (composite PK: provider + provider_account_id)
--   sessions: 32,908 rows (disposable — will be dropped and recreated)
--   verification_tokens: 0 rows (will be dropped)
--   authenticators: 0 rows (will be dropped)
--   Phase 2 tables created by 0183/0184: lms_credentials, rate_limits,
--       permission_presets, preset_permissions, student_notes
--
-- Enum columns being converted to text:
--   users.role            (user_roles → text)
--   users.position        (user_positions → text, column kept until Phase 5)
--   clearance.department  (dashboard_users → text)
--   auto_approvals.department (dashboard_users → text)
--   blocked_students.by_department (dashboard_users → text)
--   student_notes.creator_role (user_roles → text)
--
-- Enum types intentionally KEPT alive until Phase 5.
-- ================================================================

-- ---------------------------------------------------------------
-- 1. Create verifications table (replaces verification_tokens)
-- ---------------------------------------------------------------
CREATE TABLE "verifications" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");

-- ---------------------------------------------------------------
-- 2. Users table modifications
-- ---------------------------------------------------------------
--> statement-breakpoint
-- 2a: Convert role from user_roles enum to text (preserves all 12,612 values)
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

--> statement-breakpoint
-- 2b: Convert position from user_positions enum to text (column kept until Phase 5)
ALTER TABLE "users" ALTER COLUMN "position" SET DATA TYPE text USING "position"::text;

--> statement-breakpoint
-- 2c: Convert email_verified from timestamp to boolean
-- USING clause is mandatory: PG cannot cast timestamp → boolean directly
-- NULL timestamps → false, non-NULL timestamps → true
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DATA TYPE boolean USING ("email_verified" IS NOT NULL);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL;

--> statement-breakpoint
-- 2d: Fix 3 NULL names then enforce NOT NULL
UPDATE "users" SET "name" = 'Unknown User' WHERE "name" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

--> statement-breakpoint
-- 2e: Enforce email NOT NULL (0 NULLs currently — safe)
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

--> statement-breakpoint
-- 2f: Add Better Auth columns to users
ALTER TABLE "users" ADD COLUMN "preset_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp;

--> statement-breakpoint
-- 2g: Add preset_id FK and index
ALTER TABLE "users" ADD CONSTRAINT "users_preset_id_permission_presets_id_fk"
    FOREIGN KEY ("preset_id") REFERENCES "permission_presets"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "users_preset_id_idx" ON "users" USING btree ("preset_id");

-- ---------------------------------------------------------------
-- 3. Accounts table — zero-rename, add-only approach
--    Keeps ALL original Auth.js columns + composite PK intact.
--    New Better Auth columns added as nullable (populated in Phase 5).
-- ---------------------------------------------------------------
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "id" text;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "account_id" text;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "provider_id" text;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "access_token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "password" text;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "created_at" timestamp DEFAULT now();
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "updated_at" timestamp DEFAULT now();
--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");

-- ---------------------------------------------------------------
-- 4. Sessions — drop and recreate with Better Auth schema
--    32K rows of temporary auth state; users re-sign-in after cutover.
-- ---------------------------------------------------------------
--> statement-breakpoint
DROP TABLE "sessions";
--> statement-breakpoint
CREATE TABLE "sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "token" text NOT NULL,
    "user_id" text NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "impersonated_by" text,
    CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");

-- ---------------------------------------------------------------
-- 5. Dependent schema enum→text conversions
-- ---------------------------------------------------------------
--> statement-breakpoint
ALTER TABLE "clearance" ALTER COLUMN "department" SET DATA TYPE text USING "department"::text;
--> statement-breakpoint
ALTER TABLE "auto_approvals" ALTER COLUMN "department" SET DATA TYPE text USING "department"::text;
--> statement-breakpoint
ALTER TABLE "blocked_students" ALTER COLUMN "by_department" SET DATA TYPE text USING "by_department"::text;
--> statement-breakpoint
ALTER TABLE "student_notes" ALTER COLUMN "creator_role" SET DATA TYPE text USING "creator_role"::text;

-- ---------------------------------------------------------------
-- 6. Drop unused auth tables
-- ---------------------------------------------------------------
--> statement-breakpoint
DROP TABLE "authenticators";
--> statement-breakpoint
DROP TABLE "verification_tokens";

-- ---------------------------------------------------------------
-- NOTE: user_roles, user_positions, dashboard_users enum TYPES are
-- intentionally KEPT alive. Drizzle TS schema still exports the
-- pgEnum declarations for backward-compatible type inference.
-- They will be dropped in Phase 5 alongside the deferred column
-- removals (position, lms_user_id, lms_token).
-- ---------------------------------------------------------------