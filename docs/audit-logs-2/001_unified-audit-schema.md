# Step 001: Unified Audit Schema

## Introduction

Create the single `audit_logs` Drizzle table that stores all audit entries as JSONB snapshots. This is the same table design as v1 — the difference is how entries are written (application-level vs triggers).

## Requirements

### 1. Drizzle Schema

Create `src/app/audit-logs/_schema/auditLogs.ts`:

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
    metadata: jsonb(),
  },
  (table) => [
    index('idx_audit_logs_table_record').on(table.tableName, table.recordId),
    index('idx_audit_logs_changed_by').on(table.changedBy),
    index('idx_audit_logs_changed_at').on(table.changedAt),
    index('idx_audit_logs_table_operation').on(table.tableName, table.operation),
  ]
);
```

### 2. Relations

Create `src/app/audit-logs/_schema/relations.ts`:

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

### 3. Update Barrel Export

Add to `src/app/audit-logs/_database/index.ts`:

```typescript
export * from '../_schema/auditLogs';
export * from '../_schema/relations';
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
| `metadata` | `jsonb` | nullable | Optional context: reasons, IP address, custom data |

## Index Strategy

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_audit_logs_table_record` | `(tableName, recordId)` | O(1) per-record history lookup |
| `idx_audit_logs_changed_by` | `(changedBy)` | User activity queries |
| `idx_audit_logs_changed_at` | `(changedAt)` | Time-range filtering, retention |
| `idx_audit_logs_table_operation` | `(tableName, operation)` | Filter by table + operation type |

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
