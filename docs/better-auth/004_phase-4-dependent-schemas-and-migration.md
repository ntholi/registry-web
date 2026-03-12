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

## 4.3 Pre-Generation Database Backup & Data Snapshot

### 4.3.1 Database Backup

**MANDATORY** before generating or applying any migration:

```bash
pg_dump postgresql://dev:111111@localhost:5432/registry > registry_pre_phase4_backup.sql
```

This dump is your full recovery point. If anything goes wrong in Phase 4 or Phase 5, restore with:

```bash
psql postgresql://dev:111111@localhost:5432/registry < registry_pre_phase4_backup.sql
```

### 4.3.2 Capture Pre-Migration Data Snapshot

**MANDATORY** — Run the automated snapshot script to capture the complete state of all users, accounts, roles, positions, and dependent enum values BEFORE any migration is applied:

```bash
pnpm migration:snapshot
```

This captures:
- Every user row (id, name, role, position, email, email_verified, image, lms_user_id, lms_token)
- Every account row (user_id, provider, provider_account_id, access_token, refresh_token, expires_at, scope, id_token)
- Aggregate distributions (roles, positions, providers, email_verified)
- Account-user linkage count and orphaned account count
- All dependent enum values (clearance.department, auto_approvals.department, blocked_students.by_department, student_notes.creator_role)

Output is saved to `scripts/migration/snapshot-before-migration.json`.

## 4.4 Generate Custom Drizzle Migration

> **Why `--custom`?** A regular `pnpm db:generate` would introspect the DB, diff it against the TS schema, and emit SQL with interactive rename prompts (e.g., sessions `session_token` → `token`). Answering prompts incorrectly risks data loss. A custom migration eliminates all interactive prompts, gives full control over the exact SQL, and prevents Drizzle from misinterpreting complex structural changes (enum→text, timestamp→boolean, composite PK→single PK). The `--custom` flag still creates a snapshot from the current TS schema files, so the schema tracker stays in sync.

```bash
pnpm db:generate --custom --name=phase-3-4-better-auth-schema-updates
```

This creates an empty `.sql` file (e.g., `drizzle/0185_phase-3-4-better-auth-schema-updates.sql`) and a matching snapshot. Populate the file with the exact SQL below.

### 4.4.1 Complete Custom Migration SQL

Copy the following SQL **exactly** into the generated empty `.sql` file:

```sql
-- ================================================================
-- Phase 3-4: Better Auth Schema Updates
-- Custom migration — no interactive prompts, full control
--
-- Preconditions (verified against live DB):
--   users: 12,576 rows, 3 NULL names, 0 NULL emails
--   accounts: 12,596 rows (composite PK: provider + provider_account_id)
--   sessions: 32,852 rows (disposable — will be dropped and recreated)
--   verification_tokens: 0 rows (will be dropped)
--   authenticators: 0 rows (will be dropped)
--   Phase 2 tables already exist: lms_credentials, rate_limits,
--       permission_presets, preset_permissions
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
-- 2a: Convert role from user_roles enum to text (preserves all 12,576 values)
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
```

### 4.4.2 SQL Walkthrough & Safety Rationale

| Section | What it does | Risk | Mitigation |
|---------|-------------|------|------------|
| 1. Verifications | Creates new table + index | None (new table) | — |
| 2a. role enum→text | Converts 12,576 rows preserving values | None | `USING role::text` preserves all values; default reset to `'user'` |
| 2b. position enum→text | Converts 153 non-NULL values | None | `USING position::text` preserves values; column stays until Phase 5 |
| 2c. email_verified | timestamp→boolean conversion | Cannot cast directly | `USING (email_verified IS NOT NULL)` — NULL→false, non-NULL→true |
| 2d. name NOT NULL | 3 users have NULL names | SET NOT NULL fails on NULLs | UPDATE sets them to `'Unknown User'` first |
| 2e. email NOT NULL | 0 NULLs exist | None | Verified: zero NULL emails |
| 2f-2g. New columns | Better Auth lifecycle/admin fields | None (all nullable or have defaults) | — |
| 3. Accounts ADD COLUMN | 8 new nullable columns + index | None | Zero-rename: no prompts, no drops, no renames |
| 4. Sessions drop/recreate | 32K disposable rows lost | Users must re-sign-in | Sessions are temporary; no permanent data |
| 5. Dependent enum→text | 4 columns across 4 tables | None | `USING col::text` preserves all values |
| 6. Drop tables | authenticators (0 rows), verification_tokens (0 rows) | None | Both empty |

### 4.4.3 Review Checklist

Before applying, verify the SQL in the generated file:

- [ ] **No `DROP COLUMN` on accounts** — only `ADD COLUMN` statements
- [ ] **No `DROP COLUMN` on users** for `position`, `lms_user_id`, `lms_token`
- [ ] **No `DROP TYPE`** for `user_roles`, `user_positions`, `dashboard_users`
- [ ] `email_verified` ALTER TYPE has `USING ("email_verified" IS NOT NULL)`
- [ ] `name` SET NOT NULL is preceded by the UPDATE for 3 NULL names
- [ ] `role` default reset to `'user'` (text) after enum→text conversion
- [ ] Enum→text conversions present for all 6 columns: `users.role`, `users.position`, `clearance.department`, `auto_approvals.department`, `blocked_students.by_department`, `student_notes.creator_role`
- [ ] `verifications` table created (not `lms_credentials`, `rate_limits`, `permission_presets`, `preset_permissions` — those already exist from Phase 2)
- [ ] Sessions dropped and recreated (not altered)
- [ ] `authenticators` and `verification_tokens` dropped
- [ ] All indexes created: `verifications_identifier_idx`, `users_preset_id_idx`, `accounts_user_id_idx`, `sessions_user_id_idx`

## 4.5 Apply Migration & Post-Apply Verification

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
- [ ] Database backup created before generation (`pg_dump`)
- [ ] Pre-migration data snapshot captured via `pnpm migration:snapshot`
- [ ] Custom migration generated via `pnpm db:generate --custom` and populated with exact SQL from 4.4.1
- [ ] Migration SQL reviewed against 4.4.3 checklist
- [ ] Migration applied via `pnpm db:migrate` and post-apply verification passed (4.6)
- [ ] `pnpm tsc --noEmit` passes
