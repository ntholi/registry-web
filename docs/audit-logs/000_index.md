# Audit Logs - Comprehensive Implementation Plan

## Overview

Implement a unified, database-trigger-based audit logging system that captures every **Create**, **Update**, and **Delete** operation across the application. The system uses a single `audit_logs` table with JSONB snapshots, PostgreSQL triggers for reliability, and session variables for user attribution.

## Current State

The app currently has **7 fragmented audit tables** using two different patterns:

| Table | Pattern | Module |
|-------|---------|--------|
| `student_audit_logs` | JSONB old/new values | audit-logs |
| `student_program_audit_logs` | JSONB old/new values | audit-logs |
| `student_semester_audit_logs` | JSONB old/new values | audit-logs |
| `student_module_audit_logs` | JSONB old/new values | audit-logs |
| `assessments_audit` | Column-specific diffs | academic |
| `assessment_marks_audit` | Column-specific diffs | academic |
| `clearance_audit` | Status change tracking | registry |

**Problems with current approach:**
- Inconsistent patterns across entities
- Only 7 of 114 tables are audited
- Manual insertion in repositories — easy to forget
- No unified query interface for audit history

## Target Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│                                                            │
│  BaseRepository ──► SET LOCAL app.current_user_id = '...'  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                    PostgreSQL Layer                         │
│                                                            │
│  audit_trigger_func() ──► reads current_user_id            │
│       │                    from session var                 │
│       ▼                                                    │
│  ┌──────────┐                                              │
│  │audit_logs│  ◄── single unified table                    │
│  └──────────┘                                              │
│                                                            │
│  Triggers on: INSERT / UPDATE / DELETE                      │
│  Per audited table                                          │
└────────────────────────────────────────────────────────────┘
```

## Features Summary

| Feature | Description |
|---------|-------------|
| Unified audit table | Single `audit_logs` table with JSONB for all entities |
| DB triggers | PostgreSQL triggers fire on INSERT/UPDATE/DELETE automatically |
| User attribution | Session variable `app.current_user_id` passed from app layer |
| Migration | Existing 7 audit tables migrated to the new unified table |
| Query UI | Audit history viewable per-entity and globally |
| 92 tables audited | All meaningful tables tracked (22 excluded) |

## Implementation Steps

| Step | File | Description |
|------|------|-------------|
| 1 | [001_unified-audit-schema.md](001_unified-audit-schema.md) | Create the unified `audit_logs` table schema and PG trigger function |
| 2 | [002_application-integration.md](002_application-integration.md) | Integrate session variable injection into BaseRepository |
| 3 | [003_table-triggers.md](003_table-triggers.md) | Create triggers for all 92 auditable tables |
| 4 | [004_migration.md](004_migration.md) | Migrate existing 7 audit tables into the new unified table |
| 5 | [005_audit-ui.md](005_audit-ui.md) | Build query UI for viewing audit logs per entity and globally |
| 6 | [006_cleanup.md](006_cleanup.md) | Remove old audit code paths and deprecated tables |
| 7 | [007_activity-dashboard.md](007_activity-dashboard.md) | Build department and user activity dashboard from audit logs |

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
│ ip_address    TEXT                    │
└──────────────────────────────────────┘
    │
    │ Indexes:
    ├── idx_audit_logs_table_record (table_name, record_id)
    ├── idx_audit_logs_changed_by (changed_by)
    ├── idx_audit_logs_changed_at (changed_at)
    └── idx_audit_logs_table_operation (table_name, operation)
```

## Tables Audit Classification

### Audited Tables (92 tables)

See [003_table-triggers.md](003_table-triggers.md) for the complete list organized by module.

### Excluded Tables (22 tables)

| Table | Reason |
|-------|--------|
| `sessions` | Auth.js session management, high-frequency ephemeral data |
| `verification_tokens` | Auth.js tokens, ephemeral |
| `accounts` | Auth.js OAuth accounts, managed by Auth.js |
| `authenticators` | Auth.js WebAuthn, managed externally |
| `audit_logs` | The audit table itself — avoid recursion |
| `student_audit_logs` | Legacy audit table (being migrated) |
| `student_program_audit_logs` | Legacy audit table (being migrated) |
| `student_semester_audit_logs` | Legacy audit table (being migrated) |
| `student_module_audit_logs` | Legacy audit table (being migrated) |
| `assessments_audit` | Legacy audit table (being migrated) |
| `assessment_marks_audit` | Legacy audit table (being migrated) |
| `clearance_audit` | Legacy audit table (being migrated) |
| `application_status_history` | Already a history/log table by design |
| `notification_dismissals` | UI state, not business-critical |
| `notification_recipients` | Delivery tracking, not business data |
| `feedback_passphrases` | Ephemeral access tokens for feedback |
| `feedback_responses` | Anonymized survey data — auditing defeats anonymity |
| `loan_renewals` | Already an append-only log of renewals |
| `grade_mappings` | Reference/config data rarely changed, low risk |
| `statement_of_results_prints` | Operational print log, high-volume low-value for audit trail |
| `student_card_prints` | Operational print log, high-volume low-value for audit trail |
| `transcript_prints` | Operational print log, high-volume low-value for audit trail |

## Access Control

| Role | Permissions |
|------|-------------|
| `admin` | View all audit logs, global search |
| `registry` | View audit logs for registry module tables |
| `academic` | View audit logs for academic module tables |
| `finance` | View audit logs for finance module tables |
| `library` | View audit logs for library module tables |

## Execution Order

| Order | Step | Dependencies |
|-------|------|--------------|
| 1 | Unified audit schema | None |
| 2 | Application integration | Step 1 |
| 3 | Table triggers | Step 1 |
| 4 | Migration | Steps 1, 3 |
| 5 | Audit UI | Steps 1, 2 |
| 6 | Cleanup | Steps 4, 5 |
| 7 | Activity Dashboard | Steps 2, 5 |

## Validation Command

```bash
pnpm tsc --noEmit && pnpm lint:fix
```
