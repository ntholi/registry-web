# Step 003: Table Triggers

## Introduction

This step creates PostgreSQL triggers for all 95 auditable tables. Each trigger calls `audit_trigger_func()` (created in Step 1) on INSERT, UPDATE, and DELETE, passing the table's primary key column name as an argument.

## Context

The trigger function is already deployed. This step attaches it to every table that should be audited. Triggers are created via a custom Drizzle migration (`pnpm db:generate --custom`).

## Requirements

### 1. Custom Migration

Generate a custom migration with `pnpm db:generate --custom` and add the trigger creation SQL.

**Trigger format per table:**
```sql
CREATE TRIGGER audit_<table_name>
  AFTER INSERT OR UPDATE OR DELETE ON <table_name>
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('<pk_column>');
```

### 2. Complete Auditable Tables List (95 tables)

#### Academic Module (16 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 1 | `assessments` | `id` | Assessment definitions (quizzes, assignments, exams) |
| 2 | `assessment_marks` | `id` | Individual student marks per assessment |
| 3 | `lms_assessments` | `id` | Moodle-linked assessment mappings |
| 4 | `assigned_modules` | `id` | Lecturer-to-module assignments |
| 5 | `attendance` | `id` | Student attendance records |
| 6 | `feedback_categories` | `id` | Categories for feedback surveys |
| 7 | `feedback_cycle_schools` | `id` | Schools participating in a feedback cycle |
| 8 | `feedback_cycles` | `id` | Feedback survey periods |
| 9 | `feedback_questions` | `id` | Survey questions |
| 10 | `modules` | `id` | Academic module/course catalog |
| 11 | `programs` | `id` | Academic program definitions |
| 12 | `schools` | `id` | Faculties/schools |
| 13 | `module_prerequisites` | `id` | Module prerequisite rules |
| 14 | `semester_modules` | `id` | Modules offered per structure semester |
| 15 | `structure_semesters` | `id` | Semesters within a program structure |
| 16 | `structures` | `id` | Program curriculum structures |

#### Admin Module (4 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 17 | `fortinet_registrations` | `id` | WiFi/Fortinet device registrations |
| 18 | `notifications` | `id` | System notifications |
| 19 | `tasks` | `id` | Administrative tasks |
| 20 | `task_assignees` | `id` | Task assignment tracking |

> Note: `task_students` is a join table that links tasks to students. Include it for auditing since task-student assignments are business-critical.

| 21 | `task_students` | `id` | Students linked to tasks |

#### Admissions Module (18 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 22 | `academic_records` | `id` | Applicant academic records |
| 23 | `subject_grades` | `id` | Individual subject grades on academic records |
| 24 | `applicants` | `id` | Prospective student profiles |
| 25 | `applicant_locations` | `id` | Applicant address information |
| 26 | `applicant_phones` | `id` | Applicant phone numbers |
| 27 | `guardians` | `id` | Applicant guardians/parents |
| 28 | `guardian_phones` | `id` | Guardian phone numbers |
| 29 | `applications` | `id` | Admission applications |
| 30 | `application_notes` | `id` | Notes on applications |
| 31 | `certificate_types` | `id` | Types of academic certificates |
| 32 | `applicant_documents` | `id` | Uploaded applicant documents |
| 33 | `entry_requirements` | `id` | Program entry requirements |
| 34 | `intake_periods` | `id` | Admission intake windows |
| 35 | `intake_period_programs` | `id` | Programs available per intake |
| 36 | `admission_receipts` | `id` | Payment receipts for admissions |
| 37 | `bank_deposits` | `id` | Bank deposit payment records |
| 38 | `mobile_deposits` | `id` | Mobile money payment records |
| 39 | `recognized_schools` | `id` | Recognized feeder schools |
| 40 | `subjects` | `id` | High school subjects catalog |
| 41 | `subject_aliases` | `id` | Alternative names for subjects |

#### Auth Module (2 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 42 | `users` | `id` | System user accounts |
| 43 | `user_schools` | `id` | User-to-school access assignments |

> Excluded: `sessions`, `verification_tokens`, `accounts`, `authenticators` (Auth.js-managed ephemeral data)

#### Finance Module (5 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 44 | `payment_receipts` | `id` | Student payment receipts |
| 45 | `sponsors` | `id` | Sponsoring organizations |
| 46 | `sponsored_students` | `id` | Students under sponsorship |
| 47 | `sponsored_terms` | `id` | Terms covered by sponsorship |

> Note: Check if `payment_receipts` uses `id` or `receiptNo` as PK.

#### Library Module (14 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 48 | `authors` | `id` | Book authors |
| 49 | `book_copies` | `id` | Individual physical copies of books |
| 50 | `books` | `id` | Book catalog entries |
| 51 | `book_authors` | `id` | Book-author associations |
| 52 | `book_categories` | `id` | Book-category associations |
| 53 | `categories` | `id` | Book categories |
| 54 | `external_libraries` | `id` | External library links |
| 55 | `fines` | `id` | Library fines |
| 56 | `loans` | `id` | Book loans |
| 57 | `publications` | `id` | Academic publications |
| 58 | `publication_authors` | `id` | Publication-author links |
| 59 | `publication_attachments` | `id` | Publication file attachments |
| 60 | `question_papers` | `id` | Past exam papers |
| 61 | `library_settings` | `id` | Library configuration |

#### Registry Module (32 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 62 | `students` | `std_no` | Student master records |
| 63 | `student_programs` | `id` | Student program enrollments |
| 64 | `student_semesters` | `id` | Student semester registrations |
| 65 | `student_modules` | `id` | Student module enrollments |
| 66 | `student_education` | `id` | Student prior education records |
| 67 | `next_of_kins` | `id` | Student emergency contacts |
| 68 | `blocked_students` | `id` | Student registration blocks |
| 69 | `certificate_reprints` | `id` | Certificate reprint requests |
| 70 | `clearance` | `id` | Registration clearance records |
| 71 | `registration_clearance` | `id` | Clearance-registration links |
| 72 | `documents` | `id` | Document type definitions |
| 73 | `student_documents` | `id` | Documents uploaded by/for students |
| 74 | `graduation_clearance` | `id` | Graduation clearance records |
| 75 | `graduation_request_receipts` | `id` | Graduation request payment receipts |
| 76 | `graduation_dates` | `id` | Graduation ceremony dates |
| 77 | `graduation_requests` | `id` | Student graduation requests |
| 78 | `statement_of_results_prints` | `id` | Print log for statements of results |
| 79 | `student_card_prints` | `id` | Print log for student cards |
| 80 | `transcript_prints` | `id` | Print log for transcripts |
| 81 | `auto_approvals` | `id` | Auto-approval rules for clearance |
| 82 | `registration_requests` | `id` | Student registration requests |
| 83 | `registration_request_receipts` | `id` | Registration request payment receipts |
| 84 | `requested_modules` | `id` | Modules requested in a registration |
| 85 | `terms` | `id` | Academic terms/semesters |
| 86 | `term_settings` | `id` | Term configuration settings |
| 87 | `term_registrations` | `id` | Term registration windows |
| 88 | `term_registration_programs` | `id` | Programs active for a term registration |
| 89 | `publication_attachments` | `id` | Term publication file attachments |

#### Timetable Module (8 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 90 | `timetable_slots` | `id` | Time slots in the schedule |
| 91 | `timetable_slot_allocations` | `id` | Slot-to-class assignments |
| 92 | `timetable_allocations` | `id` | Module-lecturer-venue allocations |
| 93 | `timetable_allocation_allowed_venues` | `id` | Allowed venues for allocations |
| 94 | `timetable_allocation_venue_types` | `id` | Venue type preferences for allocations |
| 95 | `venues` | `id` | Physical venue/room definitions |
| 96 | `venue_schools` | `id` | Venue-to-school assignments |
| 97 | `venue_types` | `id` | Venue type catalog |

### 3. Excluded Tables (19 tables)

| Table | Module | Reason |
|-------|--------|--------|
| `sessions` | auth | Auth.js ephemeral session data |
| `verification_tokens` | auth | Auth.js ephemeral tokens |
| `accounts` | auth | Auth.js OAuth provider accounts |
| `authenticators` | auth | Auth.js WebAuthn |
| `audit_logs` | audit-logs | Self-reference protection |
| `student_audit_logs` | audit-logs | Legacy (being migrated in Step 4) |
| `student_program_audit_logs` | audit-logs | Legacy (being migrated in Step 4) |
| `student_semester_audit_logs` | audit-logs | Legacy (being migrated in Step 4) |
| `student_module_audit_logs` | audit-logs | Legacy (being migrated in Step 4) |
| `assessments_audit` | academic | Legacy (being migrated in Step 4) |
| `assessment_marks_audit` | academic | Legacy (being migrated in Step 4) |
| `clearance_audit` | registry | Legacy (being migrated in Step 4) |
| `application_status_history` | admissions | Already a history/log table |
| `notification_dismissals` | admin | UI state, not business data |
| `notification_recipients` | admin | Delivery tracking, not business data |
| `feedback_passphrases` | academic | Ephemeral access tokens |
| `feedback_responses` | academic | Anonymous data — auditing undermines anonymity |
| `loan_renewals` | library | Already append-only log |
| `grade_mappings` | registry | Static reference data |

## Expected Files

| File | Purpose |
|------|---------|
| `drizzle/XXXX_custom_audit_triggers.sql` | Custom migration creating all 97 triggers |

## Validation Criteria

1. Migration runs successfully
2. All 97 triggers exist in the database: `SELECT tgname FROM pg_trigger WHERE tgname LIKE 'audit_%';`
3. Inserting a row into any audited table creates a corresponding row in `audit_logs`
4. Updating a row creates an `UPDATE` audit entry with old and new values
5. Deleting a row creates a `DELETE` audit entry with old values
6. No triggers exist on excluded tables

## Notes

- Generate triggers in alphabetical order for maintainability
- If a table has a composite primary key, use the first column as the PK argument to the trigger
- The `students` table uses `std_no` as PK, not `id` — the trigger argument must reflect this
- `publication_attachments` appears in both registry and library barrel exports — only create one trigger
- Review any tables with `id` vs auto-generated PKs to ensure the correct column is referenced
