# Step 002: BaseRepository Audit Integration

## Introduction

This is the core step. Modify `BaseRepository` to automatically write audit log entries when `create`, `update`, or `delete` is called with an `AuditOptions` parameter. Operations are wrapped in a transaction for atomicity.

## CRITICAL: Custom Repository Override Strategy

Several repositories override `create`/`update`/`delete` with **different signatures** (e.g., `AssessmentRepository.create(data, lmsData?)`, `ClearanceRepository.create(data & { registrationRequestId })`). These custom overrides:

1. **Bypass BaseRepository's automatic audit** — they have their own `db.transaction()` blocks
2. **Should NOT be forced to match** the `(entity, audit?)` signature
3. **Use `this.writeAuditLog(tx, ...)` directly** inside their own transaction blocks instead
4. **Receive `userId` via `AuditOptions`** passed from the service layer (see Step 003), removing the need for `await auth()` in repositories

The `audit?` parameter on base methods is strictly for **standard CRUD** that flows through BaseService. Custom overrides manage their own auditing.

## Requirements

### 1. AuditOptions Type

Add to `src/core/platform/BaseRepository.ts`:

```typescript
export interface AuditOptions {
  userId: string;
  metadata?: Record<string, unknown>;
}
```

### 2. BaseRepository Modifications

#### New Properties

```typescript
class BaseRepository<T extends Table, PK extends keyof T & keyof ModelSelect<T>> {
  protected table: T;
  protected primaryKey: Column;
  protected auditEnabled = true; // Subclasses set to false to opt out

  // ...existing code...
}
```

#### New Internal Method: `getTableName()`

Uses Drizzle's `getTableConfig` to extract the SQL table name:

```typescript
import { getTableConfig } from 'drizzle-orm/pg-core';

private getTableName(): string {
  return getTableConfig(this.table as unknown as Table).name;
}
```

#### Transaction Type Alias

```typescript
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

Export this type so subclasses and other code can reference it.

#### New Protected Method: `writeAuditLog()`

**This method is `protected`** so subclass repositories can call it within their own `db.transaction` blocks (e.g., `AssessmentRepository.create()` doing multi-table writes).

```typescript
protected async writeAuditLog(
  tx: TransactionClient,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: string,
  oldValues: unknown,
  newValues: unknown,
  audit: AuditOptions
): Promise<void> {
  const meta = {
    ...this.buildAuditMetadata(operation, oldValues, newValues),
    ...audit.metadata,
  };

  await tx.insert(auditLogs).values({
    tableName: this.getTableName(),
    recordId,
    operation,
    oldValues: oldValues ?? null,
    newValues: newValues ?? null,
    changedBy: audit.userId,
    metadata: Object.keys(meta).length > 0 ? meta : null,
  });
}
```

#### New Protected Method: `writeAuditLogBatch()`

For bulk operations, write multiple audit entries in a single INSERT:

```typescript
protected async writeAuditLogBatch(
  tx: TransactionClient,
  entries: Array<{
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    recordId: string;
    oldValues: unknown;
    newValues: unknown;
  }>,
  audit: AuditOptions
): Promise<void> {
  if (entries.length === 0) return;

  const tableName = this.getTableName();
  const values = entries.map((entry) => {
    const meta = {
      ...this.buildAuditMetadata(entry.operation, entry.oldValues, entry.newValues),
      ...audit.metadata,
    };
    return {
      tableName,
      recordId: entry.recordId,
      operation: entry.operation,
      oldValues: entry.oldValues ?? null,
      newValues: entry.newValues ?? null,
      changedBy: audit.userId,
      metadata: Object.keys(meta).length > 0 ? meta : null,
    };
  });

  await tx.insert(auditLogs).values(values);
}
```

#### Template Method: `buildAuditMetadata()`

Overridable by subclasses for entity-specific context:

```typescript
protected buildAuditMetadata(
  _operation: 'INSERT' | 'UPDATE' | 'DELETE',
  _oldValues: unknown,
  _newValues: unknown
): Record<string, unknown> {
  return {};
}
```

#### Helper: `shouldAudit()`

```typescript
private shouldAudit(audit?: AuditOptions): audit is AuditOptions {
  return this.auditEnabled && audit != null;
}
```

#### Helper: `getRecordId()`

Extracts the primary key value as a string from a record. Since `BaseRepository` already stores `this.primaryKey` (a `Column`), and we know the constructor receives both `table` and `primaryKey`, we can derive the TypeScript property name by iterating the table's column map:

```typescript
private getRecordId(record: ModelSelect<T>): string {
  for (const [key, col] of Object.entries(this.table)) {
    if (col === this.primaryKey) {
      return String((record as Record<string, unknown>)[key]);
    }
  }
  throw new Error(`Primary key column not found in table ${this.getTableName()}`);
}
```

> **Why not just use `record[pkName]`?** The column's SQL name (e.g., `std_no`) may differ from the TypeScript property name (e.g., `stdNo`) because of `casing: 'snake_case'` in the Drizzle config. This approach matches by column object reference, which is always correct.

### 3. Modified Methods

#### `create(entity, audit?)`

```typescript
async create(entity: ModelInsert<T>, audit?: AuditOptions): Promise<ModelSelect<T>> {
  if (!this.shouldAudit(audit)) {
    const result = await db.insert(this.table).values(entity).returning();
    return (result as ModelSelect<T>[])[0];
  }

  return db.transaction(async (tx) => {
    const result = await tx.insert(this.table).values(entity).returning();
    const created = (result as ModelSelect<T>[])[0];

    await this.writeAuditLog(tx, 'INSERT', this.getRecordId(created), null, created, audit);

    return created;
  });
}
```

#### `update(id, entity, audit?)`

```typescript
async update(
  id: ModelSelect<T>[PK],
  entity: Partial<ModelInsert<T>>,
  audit?: AuditOptions
): Promise<ModelSelect<T>> {
  if (!this.shouldAudit(audit)) {
    const [updated] = (await db
      .update(this.table)
      .set(entity)
      .where(eq(this.primaryKey, id))
      .returning()) as ModelSelect<T>[];
    return updated;
  }

  return db.transaction(async (tx) => {
    const [old] = await tx
      .select()
      .from(this.table as unknown as Table)
      .where(eq(this.primaryKey, id));

    const [updated] = (await tx
      .update(this.table)
      .set(entity)
      .where(eq(this.primaryKey, id))
      .returning()) as ModelSelect<T>[];

    if (old) {
      await this.writeAuditLog(tx, 'UPDATE', String(id), old, updated, audit);
    }

    return updated;
  });
}
```

#### `updateById(id, entity, audit?)`

Same as `update` — keep both methods but both accept `AuditOptions`:

```typescript
async updateById(
  id: ModelSelect<T>[PK],
  entity: Partial<ModelInsert<T>>,
  audit?: AuditOptions
) {
  return this.update(id, entity, audit);
}
```

#### `delete(id, audit?)`

```typescript
async delete(id: ModelSelect<T>[PK], audit?: AuditOptions): Promise<void> {
  if (!this.shouldAudit(audit)) {
    await db.delete(this.table).where(eq(this.primaryKey, id));
    return;
  }

  await db.transaction(async (tx) => {
    const [old] = await tx
      .select()
      .from(this.table as unknown as Table)
      .where(eq(this.primaryKey, id));

    await tx.delete(this.table).where(eq(this.primaryKey, id));

    if (old) {
      await this.writeAuditLog(tx, 'DELETE', String(id), old, null, audit);
    }
  });
}
```

#### `deleteById(id, audit?)`

```typescript
async deleteById(id: ModelSelect<T>[PK], audit?: AuditOptions): Promise<boolean> {
  if (!this.shouldAudit(audit)) {
    const result = await db
      .delete(this.table)
      .where(eq(this.primaryKey, id))
      .returning();
    return (result as ModelSelect<T>[]).length > 0;
  }

  return db.transaction(async (tx) => {
    const [old] = await tx
      .select()
      .from(this.table as unknown as Table)
      .where(eq(this.primaryKey, id));

    const result = await tx
      .delete(this.table)
      .where(eq(this.primaryKey, id))
      .returning();

    if (old) {
      await this.writeAuditLog(tx, 'DELETE', String(id), old, null, audit);
    }

    return (result as ModelSelect<T>[]).length > 0;
  });
}
```

#### `createMany(entities, audit?)`

For bulk operations, uses batch audit insert (single INSERT for all audit entries):

```typescript
async createMany(entities: ModelInsert<T>[], audit?: AuditOptions): Promise<ModelSelect<T>[]> {
  if (entities.length === 0) return [];

  if (!this.shouldAudit(audit)) {
    const result = await db.insert(this.table).values(entities).returning();
    return result as ModelSelect<T>[];
  }

  return db.transaction(async (tx) => {
    const result = await tx.insert(this.table).values(entities).returning();
    const created = result as ModelSelect<T>[];

    await this.writeAuditLogBatch(
      tx,
      created.map((record) => ({
        operation: 'INSERT' as const,
        recordId: this.getRecordId(record),
        oldValues: null,
        newValues: record,
      })),
      audit
    );

    return created;
  });
}
```

### 4. Import Requirements

Add to the top of `BaseRepository.ts`:

```typescript
import { getTableConfig } from 'drizzle-orm/pg-core';
import { auditLogs } from '@/core/database/schema/auditLogs';
```

Also export the `TransactionClient` type and `AuditOptions` interface:

```typescript
export type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface AuditOptions {
  userId: string;
  metadata?: Record<string, unknown>;
}
```

### 5. Opting Out of Audit

Repositories for excluded tables override `auditEnabled`:

```typescript
class FeedbackResponseRepository extends BaseRepository<typeof feedbackResponses, 'id'> {
  protected auditEnabled = false;

  constructor() {
    super(feedbackResponses, feedbackResponses.id);
  }
}
```

### 6. Custom Metadata Override

Repositories that need entity-specific metadata override `buildAuditMetadata`:

```typescript
class StudentRepository extends BaseRepository<typeof students, 'stdNo'> {
  protected buildAuditMetadata(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    _oldValues: unknown,
    newValues: unknown
  ): Record<string, unknown> {
    const student = newValues as typeof students.$inferSelect;
    return {
      entity: 'student',
      studentName: student?.firstName
        ? `${student.firstName} ${student.lastName}`
        : undefined,
    };
  }
}
```

## Performance Impact

| Operation | Without Audit | With Audit |
|-----------|--------------|------------|
| `create` | 1 INSERT | Transaction: 1 INSERT entity + 1 INSERT audit |
| `update` | 1 UPDATE | Transaction: 1 SELECT old + 1 UPDATE + 1 INSERT audit |
| `delete` | 1 DELETE | Transaction: 1 SELECT old + 1 DELETE + 1 INSERT audit |
| `createMany(N)` | 1 INSERT (batch) | Transaction: 1 INSERT batch + 1 INSERT batch audit |

The extra queries happen within the same transaction on the same connection — no additional network round-trips for local PostgreSQL storage.

## Backward Compatibility

All existing code continues to work without changes:

```typescript
// Before (still works — no audit)
await repo.create(entity);
await repo.update(id, entity);
await repo.delete(id);

// After (opt-in audit)
await repo.create(entity, { userId: 'user-123' });
await repo.update(id, entity, { userId: 'user-123', metadata: { reasons: 'Grade correction' } });
await repo.delete(id, { userId: 'user-123' });
```

## Validation Criteria

1. Calling `create(entity, { userId })` inserts into both the entity table and `audit_logs`
2. Calling `create(entity)` (no audit) works exactly as before
3. Calling `update(id, entity, { userId })` captures old and new values in `audit_logs`
4. Calling `delete(id, { userId })` captures old values in `audit_logs`
5. Repositories with `auditEnabled = false` never write to `audit_logs`
6. `buildAuditMetadata` overrides are merged into the `metadata` column
7. `createMany` with audit writes one batch INSERT for all audit entries
8. Subclass repositories can call `this.writeAuditLog(tx, ...)` within their own transactions
9. Subclass repositories can call `this.writeAuditLogBatch(tx, ...)` for batch audit within their own transactions
10. `pnpm tsc --noEmit` passes

## Notes

- The `auditLogs` import in `BaseRepository.ts` comes from `@/core/database/schema/auditLogs` — it's infrastructure-level code, not a feature module import.
- The `update` method does an extra SELECT to capture old values. This is the inherent cost of application-level auditing. DB triggers have `OLD` and `NEW` built into the trigger context.
- `deleteAll()` is NOT audited — it's a destructive bulk operation that should be used sparingly and manually logged if needed.
- `writeAuditLog` is `protected` so subclass repositories can call it within their custom `db.transaction()` blocks. This is essential for complex repositories like `AssessmentRepository` and `ClearanceRepository` that override base methods and have multi-step transactions.
- `writeAuditLogBatch` is `protected` for the same reason — subclasses doing batch writes (e.g., bulk marks update) can use a single batch INSERT instead of N individual audit INSERTs.
- `TransactionClient` type is exported so subclasses can properly type their transaction parameters.
- **Custom override strategy**: Repositories that override `create`/`update`/`delete` with different signatures (like `AssessmentRepository.create(data, lmsData?)`) do NOT use the base class `audit?` parameter. Instead, they call `this.writeAuditLog(tx, ...)` directly within their own transactions. The `audit?` parameter only applies to standard CRUD that flows through the unmodified base methods.
