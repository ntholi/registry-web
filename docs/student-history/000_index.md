# Student History Feature — Implementation Plan

## Problem

Staff viewing a student record cannot see a unified timeline of everything that happened to that student across all departments. The existing "Audit" tab only shows direct edits to the `students` table row — it misses program changes, semester activations, module drops, marks entry, clearance decisions, payment receipts, and more. Additionally, there is no role-scoping: a finance user should only see finance-related actions, not registry's internal edits.

## Solution

1. **Schema enhancement**: Add `std_no BIGINT` and `changed_by_role TEXT` columns to `audit_logs`, denormalized at write-time for fast, joinless queries.
2. **Infrastructure update**: Extend `AuditOptions`, `BaseRepository.writeAuditLog()`, and `BaseService.buildAuditOptions()` to populate these new fields automatically.
3. **Service-layer tagging**: Update all student-related services to pass `stdNo` in audit options. `changed_by_role` is populated automatically from the session.
4. **Backfill migration**: Custom migration to populate `std_no` and `changed_by_role` for all existing audit records.
5. **History tab UI**: Replace the existing "Audit" tab on the student detail page with a comprehensive "History" tab showing a role-scoped, unified timeline across all student-related tables.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `std_no` on `audit_logs` | Yes (nullable BIGINT) | Avoids 4+ recursive joins at read time; single indexed WHERE clause |
| `changed_by_role` on `audit_logs` | Yes (nullable TEXT) | Captures role at action time (survives role changes and user deletion) |
| Role-scoped filtering | Yes + admin sees all | Each role sees only their department's actions on a student |
| Existing Audit tab | Replaced by History tab | History is a superset; no need for both |
| Backfill historical data | Yes, custom migration | Staff can see historical activity immediately |
| Student Portal visibility | No | Staff-only feature |
| `assessments` table | Excluded | Class-level entity, not student-specific |

## Student-Traceable Tables

Tables whose audit logs will be linked to a student via `std_no`:

### Direct (`std_no` column on the table)
| Table | Current Audit Rows | Notes |
|-------|-------------------|-------|
| `students` | 44 | Direct student record edits |
| `student_programs` | 105 | Program enrollment/changes |
| `payment_receipts` | 0* | Financial transactions |
| `blocked_students` | 0* | Student blocks |
| `student_documents` | 0* | Document uploads |
| `registration_requests` | 0* | Registration submissions |
| `sponsored_students` | 0* | Sponsorship assignments |
| `attendance` | 0* | Attendance records |
| `loans` | 0* | Library loans |
| `fines` | 0* | Library fines |
| `transcript_prints` | 0* | Transcript print records |
| `statement_of_results_prints` | 0* | SoR print records |
| `student_card_prints` | 0* | Card print records |
| `certificate_reprints` | 0* | Certificate reprint records |

*\*These tables may not have audit logging enabled yet — Step 1 of the Activity Tracker plan enables it.*

### 1-hop (via `student_program_id` → `student_programs.std_no`)
| Table | Current Audit Rows | Join Path |
|-------|-------------------|-----------|
| `student_semesters` | 2,444 | `student_semesters.student_program_id` → `student_programs.std_no` |

### 2-hop (via `student_semester_id` → 1-hop chain)
| Table | Current Audit Rows | Join Path |
|-------|-------------------|-----------|
| `student_modules` | 1,773 | `student_modules.student_semester_id` → `student_semesters` → `student_programs.std_no` |

### 3-hop (via entity chain)
| Table | Current Audit Rows | Join Path |
|-------|-------------------|-----------|
| `assessment_marks` | 218,129 | `assessment_marks.student_module_id` → `student_modules` → `student_semesters` → `student_programs.std_no` |
| `clearance` | 25,129 | `clearance.id` → `registration_clearance.clearance_id` → `registration_requests.std_no` |

**Total traceable audit rows: ~248,668**

## Steps

| Step | File | Description |
|------|------|-------------|
| 1 | [001_schema-and-infrastructure.md](001_schema-and-infrastructure.md) | Add `std_no` + `changed_by_role` columns, update AuditOptions, BaseRepository, BaseService |
| 2 | [002_service-layer-tagging.md](002_service-layer-tagging.md) | Update all student-related services/repositories to pass `stdNo` in audit options |
| 3 | [003_backfill-migration.md](003_backfill-migration.md) | Custom migration to populate `std_no` and `changed_by_role` for existing records |
| 4 | [004_history-tab-ui.md](004_history-tab-ui.md) | Server layer + UI for the student History tab |

## Prerequisites

- Activity Tracker overhaul (Steps 1-2 from `docs/activity-tracker/`) should ideally be done first or concurrently, since it ensures all write paths produce audit records and tags them with `activityType`. However, this plan is designed to work independently — the History tab will display entries regardless of whether `activityType` is populated.

## Verification Checklist

1. Run `pnpm db:generate` after schema change → verify migration SQL
2. Run `pnpm tsc --noEmit & pnpm lint:fix` → fix all type errors
3. Backfill: verify `SELECT COUNT(*) FROM audit_logs WHERE std_no IS NOT NULL` matches expected count
4. Test: edit a student → verify `std_no` and `changed_by_role` are populated on the new audit record
5. Test: enter marks for a student module → verify `std_no` is populated
6. UI: verify History tab shows timeline filtered by current user's role
7. UI: verify admin user sees all entries, finance user sees only finance entries
