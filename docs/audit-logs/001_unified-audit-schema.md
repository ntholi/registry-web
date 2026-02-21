# Step 001: Unified Audit Schema

## Introduction

This is the foundational step. We create a single `audit_logs` table and the PostgreSQL trigger function that will be reused by all table-specific triggers.

## Context

The current system has 7 scattered audit tables with inconsistent schemas. This step replaces them with one generic, JSONB-based audit table that can track changes on any table in the system.

## Requirements

### 1. Drizzle Schema

Create `src/app/audit-logs/_schema/auditLogs.ts`:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | Auto-increment ID |
| `tableName` | `text` | NOT NULL | Name of the audited table (e.g., `students`) |
| `recordId` | `text` | NOT NULL | Primary key value of the affected record (cast to text) |
| `operation` | `text` | NOT NULL, CHECK IN ('INSERT', 'UPDATE', 'DELETE') | Type of operation |
| `oldValues` | `jsonb` | nullable | Full row snapshot before the change (NULL on INSERT) |
| `newValues` | `jsonb` | nullable | Full row snapshot after the change (NULL on DELETE) |
| `changedBy` | `text` | FK → users.id, nullable | User who performed the operation (NULL if system/migration) |
| `changedAt` | `timestamptz` | NOT NULL, DEFAULT NOW() | When the change occurred |

**Indexes:**

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_audit_logs_table_record` | `(tableName, recordId)` | Fast per-record history lookup |
| `idx_audit_logs_changed_by` | `(changedBy)` | Query by user |
| `idx_audit_logs_changed_at` | `(changedAt)` | Time-range queries |
| `idx_audit_logs_table_operation` | `(tableName, operation)` | Filter by table + operation type |

### 2. PostgreSQL Trigger Function

Create a custom migration with `pnpm db:generate --custom` containing:

```sql
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id TEXT;
  record_pk TEXT;
  pk_column TEXT;
BEGIN
  -- Read user ID from session variable (set by application)
  current_user_id := current_setting('app.current_user_id', true);

  -- Determine primary key column name (convention: first column or 'id')
  pk_column := TG_ARGV[0];  -- passed as trigger argument

  -- Get the primary key value
  IF (TG_OP = 'DELETE') THEN
    EXECUTE format('SELECT ($1).%I::text', pk_column) INTO record_pk USING OLD;
  ELSE
    EXECUTE format('SELECT ($1).%I::text', pk_column) INTO record_pk USING NEW;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, record_pk, 'INSERT', NULL, to_jsonb(NEW), current_user_id);
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only log if something actually changed
    IF OLD IS DISTINCT FROM NEW THEN
      INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by)
      VALUES (TG_TABLE_NAME, record_pk, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user_id);
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, record_pk, 'DELETE', to_jsonb(OLD), NULL, current_user_id);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 3. Update Barrel Exports

Add the new schema to `src/app/audit-logs/_database/index.ts`.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/audit-logs/_schema/auditLogs.ts` | Drizzle schema for unified `audit_logs` table |
| `src/app/audit-logs/_schema/relations.ts` | Relations (changedBy → users) |
| `drizzle/XXXX_custom_audit_trigger_func.sql` | Custom migration with trigger function |
| `src/app/audit-logs/_database/index.ts` | Updated barrel export |

## Validation Criteria

1. `pnpm db:generate` succeeds and creates the `audit_logs` table migration
2. Custom migration with `audit_trigger_func()` is created
3. `pnpm tsc --noEmit` passes
4. The `audit_logs` table exists in the database after migration
5. The `audit_trigger_func()` function exists in PostgreSQL

## Notes

- Use `bigserial` for `id` since this table will grow rapidly
- Use `timestamptz` (not `timestamp`) for `changedAt` to handle timezone-aware logging
- The trigger function accepts the PK column name as an argument (`TG_ARGV[0]`) to support tables with different primary key conventions (e.g., `id`, `std_no`)
- `OLD IS DISTINCT FROM NEW` prevents logging no-op updates
