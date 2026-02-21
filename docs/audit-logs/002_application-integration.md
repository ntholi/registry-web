# Step 002: Application Integration

## Introduction

With the audit table and trigger function created in Step 1, this step integrates user attribution into the application layer. Every database write that should be attributed to a user must set `app.current_user_id` as a PostgreSQL session variable so triggers can record _who_ made the change.

## Context

PostgreSQL triggers execute at the database level and don't have access to the application's auth session. The solution is to inject a session variable via `SET LOCAL app.current_user_id = '...'` inside a transaction before the operation. `SET LOCAL` scopes the variable to the current transaction, so it's safe for connection pooling.

This step uses a **lightweight transaction wrapper utility** — `BaseRepository` and `BaseService` are NOT modified. Services that need audit attribution use the wrapper explicitly.

## Requirements

### 1. Audit Utility: `withAudit`

Create `src/core/database/audit.ts`:

```
function withAudit<R>(
  userId: string,
  fn: (tx: Transaction) => Promise<R>,
  metadata?: Record<string, unknown>
): Promise<R>
```

**Behavior:**
1. Opens a `db.transaction()`
2. Executes `SET LOCAL app.current_user_id = '<userId>'`
3. If `metadata` is provided, executes `SET LOCAL app.audit_metadata = '<JSON>'`
4. Calls `fn(tx)` — the caller performs their write operations using `tx`
5. Returns the result

Also export a lower-level helper for code that already has a transaction:

```
function setAuditUser(tx: Transaction, userId: string): Promise<void>
function setAuditMetadata(tx: Transaction, metadata: Record<string, unknown>): Promise<void>
```

### 2. Usage Pattern

Services that need audit attribution wrap their write operations:

```ts
// In a service method (inside withAuth callback where session is available)
async create(data: NewEntity) {
  return withAuth(async (session) => {
    return withAudit(session.user.id, async (tx) => {
      const [created] = await tx.insert(entities).values(data).returning();
      return created;
    });
  }, this.config.createRoles);
}
```

For operations that need to pass reasons/metadata:

```ts
async update(id: number, data: Partial<Entity>, reasons?: string) {
  return withAuth(async (session) => {
    return withAudit(session.user.id, async (tx) => {
      const [updated] = await tx.update(entities).set(data).where(eq(entities.id, id)).returning();
      return updated;
    }, reasons ? { reasons } : undefined);
  }, this.config.updateRoles);
}
```

### 3. When to Use `withAudit`

| Scenario | Use `withAudit`? | Reason |
|----------|-----------------|--------|
| Standard CRUD via BaseService | **Yes** — wrap the repo call | Attribute the change to the logged-in user |
| System/migration operations | **No** | `changedBy` will be NULL — acceptable |
| Read operations | **No** | Triggers only fire on writes |
| Custom transaction logic | Use `setAuditUser(tx, userId)` | Already in a transaction — use the lower-level helper |

### 4. Adopting `withAudit` in Existing Services

This step does NOT require modifying every service immediately. The triggers will fire regardless — `changedBy` will simply be NULL if `withAudit` is not used.

**Priority adoption** (services handling sensitive data):
- Student-related services (registry)
- Assessment/marks services (academic)
- Payment/finance services (finance)
- User management services (admin)

Other services can adopt `withAudit` incrementally over time.

### 5. Fallback for System Operations

Some operations run without a user session (e.g., migrations, cron jobs, seed scripts). In these cases:
- `changedBy` will be `NULL`
- The trigger function already handles this: `current_setting('app.current_user_id', true)` returns NULL if not set

## Expected Files

| File | Purpose |
|------|---------|
| `src/core/database/audit.ts` | `withAudit`, `setAuditUser`, `setAuditMetadata` utility functions |

## Validation Criteria

1. `withAudit` correctly sets `app.current_user_id` within a transaction
2. `setAuditMetadata` correctly sets `app.audit_metadata` as JSON
3. Operations without `withAudit` still work (user ID is NULL in audit log)
4. All existing tests/features continue to work (no breaking changes)
5. `pnpm tsc --noEmit` passes

## Notes

- `SET LOCAL` is scoped to the current transaction. This is critical — it doesn't leak across requests sharing the same connection pool
- `BaseRepository` and `BaseService` are NOT modified — this approach is non-invasive
- The `withAudit` wrapper is used explicitly by service methods that need attribution, giving full control over when audit context is set
- After this step, ANY table with an audit trigger will automatically log the user who performed the operation — zero per-feature audit code needed
- Services that already use custom transactions should use `setAuditUser(tx, userId)` at the start of their existing transaction instead of wrapping with `withAudit`
