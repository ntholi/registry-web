# Phase 4: Dependent Schemas, Indexes & Migration Generation

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 3 complete. Read `000_overview.md` first.

This phase updates all non-auth schema files that reference the legacy enums, adds required indexes, and generates the non-destructive Drizzle schema migration.

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

## 4.3 Generate Drizzle Migration

After all schema files are updated:

```bash
pnpm db:generate
```

This generates the schema migration for additive and compatibility-preserving changes. **Never create .sql migration files manually** — it corrupts the Drizzle journal. Review the generated SQL to confirm it matches expected changes (enum→text conversions, new tables, new columns, indexes).

The generated migration in this phase must NOT drop any source columns still needed by Phase 5 or Phase 6:

- `users.position`
- `users.lms_user_id`
- `users.lms_token`
- Legacy enum types still referenced by those columns

If `pnpm db:generate` emits destructive drops for those objects, revise the Phase 3 compatibility schema and regenerate before proceeding.

## Exit Criteria

- [ ] Dependent schemas updated: enum columns → text (clearance, autoApprovals, blockedStudents, studentNotes)
- [ ] All indexes defined in schema files
- [ ] Drizzle schema migration generated via `pnpm db:generate` (not manual SQL)
- [ ] Generated SQL reviewed and confirmed non-destructive for Phase 5 source columns
- [ ] `pnpm tsc --noEmit` passes
