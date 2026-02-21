# Audit Logs v2 — Application-Level Audit Logging

## Overview

Implement a unified, application-level audit logging system embedded directly into `BaseRepository`. Every `create`, `update`, and `delete` operation is automatically audited to a single `audit_logs` table using JSONB snapshots, with user attribution passed explicitly via method parameters.

## Why v2? (Comparison with v1)

| Aspect | v1 (PG Triggers) | v2 (BaseRepository) |
|--------|-------------------|----------------------|
| Implementation | PostgreSQL trigger function + 87 triggers | TypeScript in `BaseRepository` |
| User attribution | `SET LOCAL` session variable per transaction | Explicit `AuditOptions` parameter |
| Catches raw SQL | Yes | No (only repo-based writes) |
| Testability | Requires PG instance | Unit-testable in TypeScript |
| Maintainability | SQL migrations for each new table | Zero config for new repos (inherit from `BaseRepository`) |
| Custom metadata | Session variable + JSON parsing in PL/pgSQL | Native TypeScript object passed per operation |
| Skip configuration | Centralized SQL trigger list | Per-repository `auditEnabled` flag |
| Override mechanism | N/A (triggers are generic) | Template method pattern (`buildAuditMetadata`) |
| New table onboarding | Create new SQL trigger migration | Automatic — inherits from `BaseRepository` |
| Performance | PG-native (no extra app round-trip) | +1 SELECT for update/delete (to capture old values) |
| Portability | PostgreSQL only | Any database Drizzle supports |

## Design Decisions

1. **Single unified `audit_logs` table** — JSONB old/new values, no per-table audit tables
2. **Explicit `AuditOptions` parameter** — `create(entity, audit?)`, `update(id, entity, audit?)`, `delete(id, audit?)` — fully traceable, no hidden context
3. **Per-repository opt-out** — `protected auditEnabled = true` by default; repositories for excluded tables set `false`
4. **Template method for metadata** — `protected buildAuditMetadata()` can be overridden in subclasses for entity-specific context (e.g., `reasons`)
5. **Transaction wrapping** — Audited operations are wrapped in `db.transaction()` for atomicity; non-audited operations remain unchanged (zero overhead)
6. **Backward compatible** — All existing calls work without the audit parameter; they simply won't generate audit entries

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    UI / Server Actions                    │
│                                                          │
│         ┌─────────────────────────────┐                  │
│         │       BaseService           │                  │
│         │                             │                  │
│         │  create(data) {             │                  │
│         │    withAuth(session => {    │                  │
│         │      repo.create(data, {   │                  │
│         │        userId: session.id  │                  │
│         │      })                    │                  │
│         │    })                       │                  │
│         │  }                          │                  │
│         └──────────┬──────────────────┘                  │
│                    │                                     │
│         ┌──────────▼──────────────────┐                  │
│         │      BaseRepository         │                  │
│         │                             │                  │
│         │  create(entity, audit?) {   │                  │
│         │    if (auditEnabled && audit)│                  │
│         │      db.transaction(tx => { │                  │
│         │        tx.insert(table)     │  ← Main write   │
│         │        tx.insert(auditLogs) │  ← Audit write  │
│         │      })                     │                  │
│         │    else                      │                  │
│         │      db.insert(table)       │  ← No audit     │
│         │  }                          │                  │
│         └──────────┬──────────────────┘                  │
│                    │                                     │
│         ┌──────────▼──────────────────┐                  │
│         │    PostgreSQL Database       │                  │
│         │                             │                  │
│         │  ┌────────────┐ ┌─────────┐ │                  │
│         │  │ entity_tbl │ │audit_logs│ │                  │
│         │  └────────────┘ └─────────┘ │                  │
│         └─────────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

## AuditOptions Type

```typescript
interface AuditOptions {
  userId: string;
  metadata?: Record<string, unknown>;
}
```

## Operation Behavior Matrix

| Scenario | audit param | auditEnabled | Result |
|----------|------------|--------------|--------|
| `create(entity)` | Not provided | true | Direct insert, NO audit log |
| `create(entity, { userId })` | Provided | true | Transaction: insert + audit log |
| `create(entity, { userId })` | Provided | false | Direct insert, NO audit log |
| `update(id, entity)` | Not provided | true | Direct update, NO audit log |
| `update(id, entity, { userId })` | Provided | true | Transaction: select old + update + audit log |
| `delete(id)` | Not provided | true | Direct delete, NO audit log |
| `delete(id, { userId })` | Provided | true | Transaction: select old + delete + audit log |
| Custom method with `writeAuditLog` | Manual | true | Subclass calls `this.writeAuditLog(tx, ...)` within its own transaction |

## Database Entity

```
┌──────────────────────────────────────┐
│            audit_logs                │
├──────────────────────────────────────┤
│ id            BIGSERIAL PK           │
│ table_name    TEXT NOT NULL           │
│ record_id     TEXT NOT NULL           │
│ operation     TEXT NOT NULL (I/U/D)   │
│ old_values    JSONB                   │
│ new_values    JSONB                   │
│ changed_by    TEXT (FK → users.id)    │
│ changed_at    TIMESTAMPTZ NOT NULL    │
│ metadata      JSONB                   │
└──────────────────────────────────────┘
    │
    │ Indexes:
    ├── idx_audit_logs_table_record (table_name, record_id)
    ├── idx_audit_logs_changed_by (changed_by)
    ├── idx_audit_logs_changed_at (changed_at)
    └── idx_audit_logs_table_operation (table_name, operation)
```

## Implementation Steps

| Step | File | Description |
|------|------|-------------|
| 1 | [001_unified-audit-schema.md](001_unified-audit-schema.md) | Create the unified `audit_logs` Drizzle schema |
| 2 | [002_base-repository-audit.md](002_base-repository-audit.md) | Modify `BaseRepository` to support automatic audit logging |
| 3 | [003_base-service-audit.md](003_base-service-audit.md) | Modify `BaseService` to thread `session.user.id` into audit options |
| 4 | [004_migration.md](004_migration.md) | Migrate existing 7 legacy audit tables into the unified table |
| 5 | [005_audit-ui.md](005_audit-ui.md) | Build unified audit log viewer and per-record history components |
| 6 | [006_cleanup.md](006_cleanup.md) | Remove legacy audit code and tables |

## Tables Audit Classification

### Audited Tables (default — `auditEnabled = true`)

All repositories extending `BaseRepository` are audited by default. Only tables explicitly opted out (below) are skipped.

### Excluded Tables (`auditEnabled = false`)

| Repository | Table | Reason |
|-----------|-------|--------|
| (Auth.js managed) | `sessions` | Ephemeral session data, not managed by BaseRepository |
| (Auth.js managed) | `verification_tokens` | Ephemeral tokens |
| (Auth.js managed) | `accounts` | OAuth provider accounts |
| (Auth.js managed) | `authenticators` | WebAuthn data |
| AuditLogRepository | `audit_logs` | Self-reference protection |
| (Legacy — removed in step 6) | `student_audit_logs` | Being migrated |
| (Legacy — removed in step 6) | `student_program_audit_logs` | Being migrated |
| (Legacy — removed in step 6) | `student_semester_audit_logs` | Being migrated |
| (Legacy — removed in step 6) | `student_module_audit_logs` | Being migrated |
| (Legacy — removed in step 6) | `assessments_audit` | Being migrated |
| (Legacy — removed in step 6) | `assessment_marks_audit` | Being migrated |
| (Legacy — removed in step 6) | `clearance_audit` | Being migrated |
| ApplicationStatusHistoryRepo | `application_status_history` | Already a history/log table |
| NotificationDismissalRepo | `notification_dismissals` | UI state, not business data |
| NotificationRecipientRepo | `notification_recipients` | Delivery tracking |
| FeedbackPassphraseRepo | `feedback_passphrases` | Ephemeral tokens |
| FeedbackResponseRepo | `feedback_responses` | Anonymous — auditing undermines anonymity |
| LoanRenewalRepo | `loan_renewals` | Already append-only log |
| GradeMappingRepo | `grade_mappings` | Static reference data |
| StatementOfResultsPrintRepo | `statement_of_results_prints` | High-volume low-value |
| StudentCardPrintRepo | `student_card_prints` | High-volume low-value |
| TranscriptPrintRepo | `transcript_prints` | High-volume low-value |

**Note**: Tables with composite PKs (e.g., `venue_schools`, `timetable_slot_allocations`) that don't go through `BaseRepository` are naturally excluded since they won't have a repository with audit support.

## Custom Transaction Auditing Strategy

Many repositories override `create`/`update`/`delete` or have custom transactional methods (e.g., `AssessmentRepository.create()`, `ClearanceRepository.update()`, `AssessmentMarksRepository.updateMark()`). These bypass `BaseRepository`'s automatic audit and cannot simply be replaced by it because they contain additional business logic (grade recalculation, multi-table writes, etc.).

### Strategy for Custom Methods

1. **`writeAuditLog` is `protected`** — subclass repositories can call it within their own `db.transaction` blocks
2. **Existing manual `tx.insert(assessmentsAudit)` calls** → Replace with `this.writeAuditLog(tx, ...)` using the unified format
3. **Custom methods that don't currently audit** → Add `writeAuditLog` calls where appropriate
4. **Methods that override `create`/`update`/`delete`** → Call `this.writeAuditLog(tx, ...)` within their transaction instead of relying on the base class auto-audit

See Step 002 for the `writeAuditLog` API and Step 006 for the migration of each custom method.

## Key Benefits

1. **Zero config for new features**: Any new repository extending `BaseRepository` is automatically audited
2. **Type-safe**: Full TypeScript — no SQL strings or PL/pgSQL functions to maintain
3. **Testable**: Audit behavior can be unit-tested without a database
4. **Extensible**: Override `buildAuditMetadata()` for entity-specific context
5. **Backward compatible**: Existing code works unchanged; audit is opt-in per call via `AuditOptions`
6. **Portable**: No PostgreSQL-specific features required
