# Activity Tracker Overhaul — Implementation Plan

## Problem

The current activity tracker measures raw CRUD operations (INSERT/UPDATE/DELETE on tables), which is meaningless to managers. A registry manager doesn't care about "50 inserts on `students`" — they want to know "50 student registrations" or "23 transcript prints."

## Solution

Replace the raw CRUD tracking with a **business-activity-oriented tracking system** where each audit log entry is tagged with a human-readable `activityType` (e.g., `student_registration`, `transcript_print`). The tracker UI shows what work each user is doing in terms managers understand. Department is derived from the user's role.

## Key Decisions

- New `activity_type TEXT` column on `audit_logs` (nullable, indexed)
- Fine-grained activity types (INSERT/UPDATE/DELETE as separate types)
- Tag only the primary action (no correlation IDs)
- Enable audit logging on print tables (transcript, statement of results, student card)
- Backfill historical data via migration
- Department = user's role
- UI: Department summary + Employee ranking + Individual drill-down (stats + chart + heatmap + timeline)
- Time presets: Today, 7 days, 30 days, This Month, Last Month, This Quarter, This Year, Custom

## Steps

| Step | File | Description |
|------|------|-------------|
| 1 | [001_infrastructure-and-audit-fixes.md](001_infrastructure-and-audit-fixes.md) | Schema changes, BaseRepository/BaseService updates, fix all audit gaps across every service |
| 2 | [002_tag-actions-and-backfill.md](002_tag-actions-and-backfill.md) | Activity type registry, tag all services with activityType, backfill historical data |
| 3 | [003_rebuild-tracker-ui.md](003_rebuild-tracker-ui.md) | Rewrite repository/service/actions/types, rebuild all UI components |

## Prerequisites

- Audit logging infrastructure already exists (BaseRepository.writeAuditLog, BaseService.buildAuditOptions)
- `auditEnabled = true` is default on BaseRepository (only print repos and audit-logs repo have it disabled)

## Verification Checklist

1. Run `pnpm db:generate` after schema change → verify migration SQL
2. Run `pnpm tsc --noEmit & pnpm lint:fix` → fix all type errors
3. Backfill migration: run against dev DB, verify `SELECT activity_type, count(*) FROM audit_logs WHERE activity_type IS NOT NULL GROUP BY activity_type`
4. Manually test: perform actions (register student, print transcript, approve clearance) → verify `activity_type` is written
5. UI: verify department summary, employee list ranking, employee drill-down all display meaningful activity labels
6. Verify non-admin manager can only see their department's data
