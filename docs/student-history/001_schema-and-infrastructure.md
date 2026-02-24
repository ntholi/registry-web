# Step 1: Schema & Infrastructure Changes

Add `std_no` and `changed_by_role` columns to `audit_logs`, then update the audit plumbing so every write automatically populates them.

---

## 1.1 Update `audit_logs` schema

In `src/core/database/schema/auditLogs.ts`:

### Add columns

```typescript
stdNo: bigint('std_no', { mode: 'number' }),
changedByRole: text('changed_by_role'),
```

### Add indexes

```typescript
index('idx_audit_logs_std_no').on(table.stdNo),
index('idx_audit_logs_changed_by_role').on(table.changedByRole),
index('idx_audit_logs_std_no_role').on(table.stdNo, table.changedByRole),
index('idx_audit_logs_std_no_date').on(table.stdNo, table.changedAt),
index('idx_audit_logs_std_no_role_date').on(table.stdNo, table.changedByRole, table.changedAt),
```

### Final schema

```typescript
import { users } from '@auth/users/_schema/users';
import {
  bigint,
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
    operation: text().notNull(),
    oldValues: jsonb(),
    newValues: jsonb(),
    changedBy: text().references(() => users.id, { onDelete: 'set null' }),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    syncedAt: timestamp({ withTimezone: true }),
    metadata: jsonb(),
    activityType: text('activity_type'),
    stdNo: bigint('std_no', { mode: 'number' }),
    changedByRole: text('changed_by_role'),
  },
  (table) => [
    index('idx_audit_logs_table_record').on(table.tableName, table.recordId),
    index('idx_audit_logs_changed_by').on(table.changedBy),
    index('idx_audit_logs_changed_at').on(table.changedAt),
    index('idx_audit_logs_table_operation').on(table.tableName, table.operation),
    index('idx_audit_logs_synced_at').on(table.syncedAt),
    index('idx_audit_logs_user_date').on(table.changedBy, table.changedAt),
    index('idx_audit_logs_activity_type').on(table.activityType),
    index('idx_audit_logs_user_activity').on(table.changedBy, table.activityType, table.changedAt),
    index('idx_audit_logs_std_no').on(table.stdNo),
    index('idx_audit_logs_changed_by_role').on(table.changedByRole),
    index('idx_audit_logs_std_no_role').on(table.stdNo, table.changedByRole),
    index('idx_audit_logs_std_no_date').on(table.stdNo, table.changedAt),
    index('idx_audit_logs_std_no_role_date').on(table.stdNo, table.changedByRole, table.changedAt),
  ]
);
```

Run `pnpm db:generate` to create the migration.

---

## 1.2 Extend `AuditOptions` interface

In `src/core/platform/BaseRepository.ts`, add `stdNo` and `role` to `AuditOptions`:

```typescript
export interface AuditOptions {
  userId: string;
  metadata?: Record<string, unknown>;
  activityType?: string;
  stdNo?: number;
  role?: string;
}
```

---

## 1.3 Update `writeAuditLog()` to persist new fields

In `src/core/platform/BaseRepository.ts`:

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
    activityType: audit.activityType ?? null,
    stdNo: audit.stdNo ?? null,
    changedByRole: audit.role ?? null,
  });
}
```

---

## 1.4 Update `writeAuditLogForTable()` to persist new fields

Same file:

```typescript
protected async writeAuditLogForTable(
  tx: TransactionClient,
  tableName: string,
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
    tableName,
    recordId,
    operation,
    oldValues: oldValues ?? null,
    newValues: newValues ?? null,
    changedBy: audit.userId,
    metadata: Object.keys(meta).length > 0 ? meta : null,
    activityType: audit.activityType ?? null,
    stdNo: audit.stdNo ?? null,
    changedByRole: audit.role ?? null,
  });
}
```

---

## 1.5 Update `writeAuditLogBatch()` to persist new fields

Same file:

```typescript
protected async writeAuditLogBatch(
  tx: TransactionClient,
  entries: AuditBatchEntry[],
  audit: AuditOptions
): Promise<void> {
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
      activityType: audit.activityType ?? null,
      stdNo: audit.stdNo ?? null,
      changedByRole: audit.role ?? null,
    };
  });

  if (values.length === 0) return;
  await tx.insert(auditLogs).values(values);
}
```

---

## 1.6 Update `BaseService.buildAuditOptions()` to include role

In `src/core/platform/BaseService.ts`, update `buildAuditOptions()` to automatically include the user's role from the session:

```typescript
protected buildAuditOptions(
  session?: Session | null,
  operation?: 'create' | 'update' | 'delete'
): AuditOptions | undefined {
  if (!session?.user?.id) return undefined;
  return {
    userId: session.user.id,
    activityType: operation ? this.activityTypes?.[operation] : undefined,
    role: session.user.role ?? undefined,
  };
}
```

This ensures `changed_by_role` is populated automatically for ALL services extending `BaseService`, with zero per-service changes.

---

## 1.7 Update custom services to include role

For services that DON'T extend `BaseService` (e.g., `StudentService`, `StudentSemesterService`, etc.), the `withAuth` callback provides the session. Update their audit options to include `role`:

```typescript
return withAuth(async (session) => {
  return this.repository.create(data, {
    userId: session!.user!.id!,
    role: session!.user!.role!,
    activityType: 'student_creation',
    stdNo: data.stdNo,
  });
}, []);
```

**Pattern**: Every place that constructs an `AuditOptions` object from a session should add `role: session.user.role`.

---

## 1.8 Define student-traceable table constant

Create `src/app/registry/students/_lib/student-audit-tables.ts`:

```typescript
export const STUDENT_AUDIT_TABLES = [
  'students',
  'student_programs',
  'student_semesters',
  'student_modules',
  'assessment_marks',
  'clearance',
  'payment_receipts',
  'blocked_students',
  'student_documents',
  'registration_requests',
  'sponsored_students',
  'attendance',
  'loans',
  'fines',
  'transcript_prints',
  'statement_of_results_prints',
  'student_card_prints',
  'certificate_reprints',
] as const;

export type StudentAuditTable = (typeof STUDENT_AUDIT_TABLES)[number];

export const STUDENT_AUDIT_TABLE_LABELS: Record<StudentAuditTable, string> = {
  students: 'Student Record',
  student_programs: 'Program',
  student_semesters: 'Semester',
  student_modules: 'Module',
  assessment_marks: 'Assessment Mark',
  clearance: 'Clearance',
  payment_receipts: 'Payment',
  blocked_students: 'Block/Unblock',
  student_documents: 'Document',
  registration_requests: 'Registration',
  sponsored_students: 'Sponsorship',
  attendance: 'Attendance',
  loans: 'Library Loan',
  fines: 'Library Fine',
  transcript_prints: 'Transcript Print',
  statement_of_results_prints: 'Statement of Results Print',
  student_card_prints: 'Student Card Print',
  certificate_reprints: 'Certificate Reprint',
};
```

This is the single source of truth for which tables are student-related and their display labels.

---

## Verification

After completing this step:

1. `pnpm db:generate` → verify migration adds `std_no BIGINT` and `changed_by_role TEXT` columns with indexes
2. `pnpm tsc --noEmit & pnpm lint:fix` → zero errors
3. Manually test: edit a student → verify the new audit record has `std_no` and `changed_by_role` populated
4. Manually test: update marks → verify `std_no` is populated on the `assessment_marks` audit record
