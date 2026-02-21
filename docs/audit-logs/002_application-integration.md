# Step 002: Application Integration

## Introduction

With the audit table and trigger function created in Step 1, this step integrates user attribution into the application layer. Every database operation must set `app.current_user_id` as a PostgreSQL session variable so triggers can record _who_ made the change.

## Context

PostgreSQL triggers execute at the database level and don't have access to the application's auth session. The standard solution is to inject a session variable via `SET LOCAL app.current_user_id = '...'` before each operation. `SET LOCAL` scopes the variable to the current transaction, so it's safe for connection pooling.

## Requirements

### 1. Database Utility: `setAuditUser`

Create a utility function in `src/core/database/audit.ts`:

```
function setAuditUser(tx: Transaction, userId: string): Promise<void>
```

- Executes `SET LOCAL app.current_user_id = '<userId>'` on the given transaction
- Used inside `db.transaction(async (tx) => { ... })` blocks

### 2. Modify `BaseRepository`

Update `src/core/platform/BaseRepository.ts` to support audit context:

**Changes to `create()`, `update()`, `delete()` methods:**
- Wrap each in a `db.transaction()` call
- Call `setAuditUser(tx, userId)` at the start of the transaction
- The `userId` comes from a new optional parameter or a context mechanism

**Approach — Audit Context via class method:**

Add a protected method:
```
protected async withAuditContext<R>(userId: string, fn: (tx) => Promise<R>): Promise<R>
```

This wraps a transaction, sets the audit user, and executes the callback.

Modify `create`, `update`, `delete` to use `withAuditContext` when a session is available.

### 3. Modify `BaseService` 

Update `src/core/platform/BaseService.ts`:

The `create`, `update`, and `delete` methods already use `withAuth` which has the session. Pass the `session.user.id` down to the repository's audit-aware methods.

**Changes:**
- `create(data)` → gets session from `withAuth`, calls `repository.create(data, session.user.id)`
- `update(id, data)` → gets session from `withAuth`, calls `repository.update(id, data, session.user.id)`
- `delete(id)` → gets session from `withAuth`, calls `repository.delete(id, session.user.id)`

### 4. Fallback for System Operations

Some operations run without a user session (e.g., migrations, cron jobs, seed scripts). In these cases:
- `changedBy` should be `NULL`
- The trigger function already handles this: `current_setting('app.current_user_id', true)` returns NULL if not set

## Expected Files

| File | Purpose |
|------|---------|
| `src/core/database/audit.ts` | `setAuditUser` utility function |
| `src/core/platform/BaseRepository.ts` | Modified to support audit context |
| `src/core/platform/BaseService.ts` | Modified to pass user ID from session |

## Validation Criteria

1. `BaseRepository.create()` sets `app.current_user_id` in the transaction
2. `BaseRepository.update()` sets `app.current_user_id` in the transaction
3. `BaseRepository.delete()` sets `app.current_user_id` in the transaction
4. Operations without a session still work (user ID is NULL in audit log)
5. All existing tests/features continue to work (backward compatible)
6. `pnpm tsc --noEmit` passes

## Notes

- `SET LOCAL` is scoped to the current transaction. This is critical — it doesn't leak across requests sharing the same connection pool
- The `withAuditContext` method should be used internally; external callers continue using the same API
- Repositories that override `create`/`update`/`delete` with custom transaction logic should call `setAuditUser(tx, userId)` at the start of their transaction
- After this step, ANY table with an audit trigger will automatically log the user who performed the operation — zero per-feature code needed
