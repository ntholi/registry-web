# Step 003: Table Triggers

## Introduction

This step creates PostgreSQL triggers for all 87 auditable tables. Each trigger calls `audit_trigger_func()` (created in Step 1) on INSERT, UPDATE, and DELETE, passing the table's primary key column name as an argument.

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

### 2. Complete Auditable Tables List (87 tables)

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

#### Admin Module (5 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 17 | `fortinet_registrations` | `id` | WiFi/Fortinet device registrations |
| 18 | `notifications` | `id` | System notifications |
| 19 | `tasks` | `id` | Administrative tasks |
| 20 | `task_assignees` | `id` | Task assignment tracking |
| 21 | `task_students` | `id` | Students linked to tasks |

#### Admissions Module (20 tables)

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

#### Finance Module (4 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 44 | `payment_receipts` | `id` | Student payment receipts |
| 45 | `sponsors` | `id` | Sponsoring organizations |
| 46 | `sponsored_students` | `id` | Students under sponsorship |
| 47 | `sponsored_terms` | `id` | Terms covered by sponsorship |

#### Library Module (13 tables)

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
| 59 | `question_papers` | `id` | Past exam papers |
| 60 | `library_settings` | `id` | Library configuration |

#### Registry Module (23 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 61 | `students` | `std_no` | Student master records |
| 62 | `student_programs` | `id` | Student program enrollments |
| 63 | `student_semesters` | `id` | Student semester registrations |
| 64 | `student_modules` | `id` | Student module enrollments |
| 65 | `student_education` | `id` | Student prior education records |
| 66 | `next_of_kins` | `id` | Student emergency contacts |
| 67 | `blocked_students` | `id` | Student registration blocks |
| 68 | `certificate_reprints` | `id` | Certificate reprint requests |
| 69 | `clearance` | `id` | Registration clearance records |
| 70 | `registration_clearance` | `id` | Clearance-registration links |
| 71 | `documents` | `id` | Document type definitions |
| 72 | `student_documents` | `id` | Documents uploaded by/for students |
| 73 | `graduation_clearance` | `id` | Graduation clearance records |
| 74 | `graduation_dates` | `id` | Graduation ceremony dates |
| 75 | `graduation_requests` | `id` | Student graduation requests |
| 76 | `auto_approvals` | `id` | Auto-approval rules for clearance |
| 77 | `registration_requests` | `id` | Student registration requests |
| 78 | `requested_modules` | `id` | Modules requested in a registration |
| 79 | `terms` | `id` | Academic terms/semesters |
| 80 | `term_settings` | `id` | Term configuration settings |
| 81 | `term_registrations` | `id` | Term registration windows |
| 82 | `term_registration_programs` | `id` | Programs active for a term registration |
| 83 | `publication_attachments` | `id` | Term publication file attachments |

#### Timetable Module (4 tables)

| # | Table | PK Column | Description |
|---|-------|-----------|-------------|
| 84 | `timetable_slots` | `id` | Time slots in the schedule |
| 85 | `timetable_allocations` | `id` | Module-lecturer-venue allocations |
| 86 | `venues` | `id` | Physical venue/room definitions |
| 87 | `venue_types` | `id` | Venue type catalog |

### 3. Excluded Tables (28 tables)

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
| `statement_of_results_prints` | registry | Operational print log, high-volume low-value for audit trail |
| `student_card_prints` | registry | Operational print log, high-volume low-value for audit trail |
| `transcript_prints` | registry | Operational print log, high-volume low-value for audit trail |
| `venue_schools` | timetable | Composite PK `(venueId, schoolId)` — no single record identifier |
| `timetable_slot_allocations` | timetable | Composite PK `(slotId, timetableAllocationId)` — no single record identifier |
| `timetable_allocation_allowed_venues` | timetable | Composite PK `(timetableAllocationId, venueId)` — no single record identifier |
| `timetable_allocation_venue_types` | timetable | Composite PK `(timetableAllocationId, venueTypeId)` — no single record identifier |
| `registration_request_receipts` | registry | No primary key — unique constraint only `(registrationRequestId, receiptId)` |
| `graduation_request_receipts` | registry | No primary key — unique constraint only `(graduationRequestId, receiptId)` |

## Expected Files

| File | Purpose |
|------|---------|
| `drizzle/XXXX_custom_audit_triggers.sql` | Custom migration creating all 87 triggers |

## Validation Criteria

1. Migration runs successfully
2. All 87 triggers exist in the database: `SELECT tgname FROM pg_trigger WHERE tgname LIKE 'audit_%';`
3. Inserting a row into any audited table creates a corresponding row in `audit_logs`
4. Updating a row creates an `UPDATE` audit entry with old and new values
5. Deleting a row creates a `DELETE` audit entry with old values
6. No triggers exist on excluded tables

## Notes

- Generate triggers in alphabetical order for maintainability
- The `students` table uses `std_no` as PK, not `id` — the trigger argument must reflect this
- All other auditable tables use `id` as PK (whether serial integer or text nanoid)
- Tables with composite PKs or no PK are excluded — they are junction/link tables with low audit value
