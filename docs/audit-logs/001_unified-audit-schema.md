# Step 001: Unified Audit Schema

## Introduction

Create the single `audit_logs` Drizzle table that stores all audit entries as JSONB snapshots. This is the same table design as v1 — the difference is how entries are written (application-level vs triggers).

## Requirements

### 1. Drizzle Schema

The `auditLogs` schema is **infrastructure-level** (used by `BaseRepository` in `core/platform/`), so it lives in `core/database/` — not in `app/audit-logs/`.

Create `src/core/database/schema/auditLogs.ts`:

```typescript
import { users } from '@auth/users/_schema/users';
import {
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial({ mode: 'bigint' }).primaryKey(),
    tableName: text().notNull(),
    recordId: text().notNull(),
    operation: text().notNull(), // 'INSERT' | 'UPDATE' | 'DELETE'
    oldValues: jsonb(),
    newValues: jsonb(),
    changedBy: text().references(() => users.id, { onDelete: 'set null' }),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    syncedAt: timestamp({ withTimezone: true }),
    metadata: jsonb(),
  },
  (table) => [
    index('idx_audit_logs_table_record').on(table.tableName, table.recordId),
    index('idx_audit_logs_changed_by').on(table.changedBy),
    index('idx_audit_logs_changed_at').on(table.changedAt),
    index('idx_audit_logs_table_operation').on(table.tableName, table.operation),
    index('idx_audit_logs_synced_at').on(table.syncedAt),
  ]
);
```

> **Why `core/database/`?** `BaseRepository` (in `core/platform/`) imports this schema. Placing it in `app/audit-logs/` would create a core→feature dependency. The `auditLogs` table is comparable to `users` — it's foundational infrastructure, not a feature.

> **Convention note**: `core/database/schema/` is reserved for infrastructure-only schemas that are consumed by `core/platform/`. Feature schemas continue to live in their respective `_schema/` folders. This file follows the same import rules as `_schema/` files — import from specific module paths (e.g., `@auth/users/_schema/users`), NEVER from `@/core/database`.

### 2. Relations

Create `src/core/database/schema/auditLogsRelations.ts`:

```typescript
import { relations } from 'drizzle-orm';
import { users } from '@auth/users/_schema/users';
import { auditLogs } from './auditLogs';

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  changedByUser: one(users, {
    fields: [auditLogs.changedBy],
    references: [users.id],
  }),
}));
```

### 3. Update Barrel Export and Database Schema Registration

**`src/core/database/schema/index.ts`** — Add re-exports:

```typescript
export * from './auditLogs';
export * from './auditLogsRelations';
```

**`src/core/database/index.ts`** — Add to the `schema` const and exports:

```typescript
import * as coreSchema from './schema/auditLogs';
// ... in the schema object:
const schema = {
  ...coreSchema,
  ...academic,
  // ...existing modules
};
```

Also add to the bottom exports:  
```typescript
export * from './schema/auditLogs';
export * from './schema/auditLogsRelations';
```

> **Why both?** The `schema` const is used by Drizzle's `drizzle()` initialization for relation inference. The `export *` is used by server code that needs to import `auditLogs` directly.

**`src/app/audit-logs/_database/index.ts`** — Add re-export for convenience:

```typescript
export { auditLogs } from '@/core/database/schema/auditLogs';
export { auditLogsRelations } from '@/core/database/schema/auditLogsRelations';
// ... existing legacy exports (removed in step 006)
```

### 4. Generate Migration

Run `pnpm db:generate` to create the migration for the new table.

## Column Specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | Auto-increment ID (bigint for high volume) |
| `tableName` | `text` | NOT NULL | Source table name (e.g., `students`) |
| `recordId` | `text` | NOT NULL | Primary key of affected record (cast to text) |
| `operation` | `text` | NOT NULL | `'INSERT'`, `'UPDATE'`, or `'DELETE'` |
| `oldValues` | `jsonb` | nullable | Full row snapshot before change (NULL on INSERT) |
| `newValues` | `jsonb` | nullable | Full row snapshot after change (NULL on DELETE) |
| `changedBy` | `text` | FK → users.id, nullable | User who performed the operation |
| `changedAt` | `timestamptz` | NOT NULL, DEFAULT NOW() | When the change occurred |
| `syncedAt` | `timestamptz` | nullable | When this entry was synced to an external system (NULL = unsynced) |
| `metadata` | `jsonb` | nullable | Optional context: reasons, IP address, custom data |

## Index Strategy

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_audit_logs_table_record` | `(tableName, recordId)` | O(1) per-record history lookup |
| `idx_audit_logs_changed_by` | `(changedBy)` | User activity queries |
| `idx_audit_logs_changed_at` | `(changedAt)` | Time-range filtering, retention |
| `idx_audit_logs_table_operation` | `(tableName, operation)` | Filter by table + operation type |
| `idx_audit_logs_synced_at` | `(syncedAt)` | Efficiently find unsynced entries |

## Validation Criteria

1. `pnpm db:generate` creates the `audit_logs` table migration
2. `pnpm db:migrate` applies successfully
3. `pnpm tsc --noEmit` passes
4. Table exists: `SELECT * FROM audit_logs LIMIT 0;`

## Notes

- `bigserial` is used because this table will grow rapidly (every write across the app generates an entry)
- `timestamptz` (not `timestamp`) for timezone-aware logging
- `operation` is plain text rather than a pgEnum for simplicity — no migration needed to add new operation types
- `metadata` is the extensibility point: reasons, IP addresses, request IDs, or any per-entity context
- The `changedBy` FK uses `onDelete: 'set null'` so audit records survive user deletion
- The `syncedAt` column supports future external sync workflows (e.g., syncing audit events to an external analytics/compliance system). Entries with `syncedAt IS NULL` are unsynced. This column is indexed for efficient batch queries. It is not used in the initial implementation — only the infrastructure is prepared.
