# Activity Tracker Overhaul Plan

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

---

## Phase 1: Schema & Infrastructure

### 1. Add `activityType` column to `audit_logs`

Add a nullable `text` column `activity_type` to the `auditLogs` schema in `src/core/database/schema/auditLogs.ts`. Add indexes:

- `idx_audit_logs_activity_type` on `(activity_type)`
- `idx_audit_logs_user_activity` on `(changedBy, activity_type, changedAt)` for efficient grouping queries

Run `pnpm db:generate` to create the migration.

### 2. Extend `AuditOptions` interface

In `src/core/platform/BaseRepository.ts`, add `activityType?: string` to the `AuditOptions` interface. Update `writeAuditLog()` and `writeAuditLogBatch()` to persist `activityType` into the new column.

### 3. Extend `BaseService.buildAuditOptions()`

In `src/core/platform/BaseService.ts`, add an optional `activityType` parameter to `buildAuditOptions()` so services can pass it through to repositories.

### 4. Enable audit on print tables

Set `auditEnabled = true` on the repositories for `transcriptPrints`, `statementOfResultsPrints`, and `studentCardPrints` in their respective repositories under `src/app/registry/print/`.

### 5. Create activity type registry

Create `src/app/admin/activity-tracker/_lib/activity-types.ts` containing:

- A const map of all `activityType` identifiers to display labels
- A `tableName+operation → activityType` mapping for backfill
- A helper function to get the display label for an activity type
- A department grouping map (which activity types belong to which department view)

---

## Phase 2: Tag All Server Actions

### 6. Registry Module

Update all service/action methods to pass `activityType` in audit options:

| Feature | Activity Types |
|---------|---------------|
| Students | `student_creation`, `student_update`, `student_deletion` |
| Student Programs | `program_enrollment`, `program_completed`, `program_activated`, `program_change`, `program_deleted`, `program_deactivated` |
| Student Semesters | `semester_activated`, `semester_deferred`, `semester_dropout`, `semester_deleted`, `semester_withdrawal`, `semester_repeat`, `semester_deactivated` |
| Student Modules | `module_update`, `module_dropped`, `module_deleted`, `module_repeated` |
| Registration Requests | `registration_submitted`, `registration_updated`, `registration_cancelled` |
| Clearance | `clearance_created`, `clearance_approved`, `clearance_rejected` |
| Print - Transcript | `transcript_print` |
| Print - Statement of Results | `statement_of_results_print` |
| Print - Student Card | `student_card_print` |
| Graduation Dates | `graduation_date_created`, `graduation_date_updated` |
| Graduation Requests | `graduation_request_submitted`, `graduation_request_updated` |
| Graduation Clearance | `graduation_clearance_created`, `graduation_clearance_decision` |
| Certificates | `certificate_generated`, `certificate_reprint` |
| Blocked Students | `student_blocked`, `student_unblocked` |
| Terms | `term_created`, `term_updated` |
| Documents | `document_uploaded` |
| Auto-Approvals | `auto_approval_created`, `auto_approval_updated`, `auto_approval_deleted` |

### 7. Academic Module

| Feature | Activity Types |
|---------|---------------|
| Assessments | `assessment_created`, `assessment_updated`, `assessment_deleted` |
| Assessment Marks | `mark_entered`, `mark_updated`, `mark_deleted` |
| Assigned Modules | `module_assigned`, `module_unassigned` |
| Attendance | `attendance_recorded`, `attendance_updated` |
| Modules | `module_created`, `module_updated` |
| Semester Modules | `semester_module_created`, `semester_module_updated`, `semester_module_deleted` |
| Schools | `school_created`, `school_updated` |
| Programs/Structures | `program_created`, `program_updated`, `structure_created`, `structure_updated` |
| Feedback | `feedback_cycle_created`, `feedback_cycle_updated`, `feedback_category_created`, `feedback_question_created` |

### 8. Finance Module

| Feature | Activity Types |
|---------|---------------|
| Payment Receipts | `payment_receipt_added`, `payment_receipt_removed` |
| Sponsors | `sponsor_created`, `sponsor_updated` |
| Sponsorship | `sponsorship_assigned`, `sponsorship_updated` |

### 9. Library Module

| Feature | Activity Types |
|---------|---------------|
| Books | `book_added`, `book_updated`, `book_deleted` |
| Book Copies | `book_copy_added`, `book_copy_updated` |
| Loans | `book_loan_created`, `book_returned`, `loan_deleted` |
| Fines | `fine_created`, `fine_updated` |
| Authors | `author_created`, `author_updated`, `author_deleted` |
| Categories | `category_created`, `category_updated`, `category_deleted` |
| Publications | `publication_added`, `publication_updated`, `publication_deleted` |
| Question Papers | `question_paper_uploaded`, `question_paper_updated`, `question_paper_deleted` |
| Settings | `library_settings_updated` |
| External Libraries | `external_library_added`, `external_library_updated`, `external_library_deleted` |

### 10. Admissions Module

| Feature | Activity Types |
|---------|---------------|
| Applications | `application_submitted`, `application_updated`, `application_status_changed` |
| Documents | `applicant_document_uploaded`, `applicant_document_reviewed` |
| Bank Deposits | `deposit_submitted`, `deposit_verified` |
| Applicants | `applicant_created`, `applicant_updated` |
| Subjects | `subject_created`, `subject_updated`, `subject_deleted` |
| Recognized Schools | `recognized_school_added`, `recognized_school_updated`, `recognized_school_deleted` |
| Certificate Types | `certificate_type_created`, `certificate_type_updated`, `certificate_type_deleted` |
| Entry Requirements | `entry_requirement_created`, `entry_requirement_updated`, `entry_requirement_deleted` |
| Intake Periods | `intake_period_created`, `intake_period_updated`, `intake_period_deleted` |

### 11. Admin Module

| Feature | Activity Types |
|---------|---------------|
| Users | `user_created`, `user_updated`, `user_deleted` |
| Tasks | `task_created`, `task_updated` |
| Notifications | `notification_created`, `notification_updated` |

### 12. Timetable Module

| Feature | Activity Types |
|---------|---------------|
| Venues | `venue_created`, `venue_updated` |
| Venue Types | `venue_type_created`, `venue_type_updated` |
| Timetable Allocations | `allocation_created`, `allocation_updated`, `allocation_deleted` |
| Timetable Slots | `slot_created`, `slot_updated`, `slot_deleted` |

---

## Phase 3: Backfill Historical Data

### 13. Generate custom migration

Run `pnpm db:generate --custom` and write a SQL migration that backfills `activity_type` for existing `audit_logs` rows using a `CASE WHEN table_name = 'X' AND operation = 'Y' THEN 'z'` statement covering all mappings from the activity types registry.

---

## Phase 4: Rebuild Repository & Service

### 14. Rewrite repository

Delete and rewrite `src/app/admin/activity-tracker/_server/repository.ts` — New repository focused on `activityType` aggregation:

- `getDepartmentSummary(start, end, dept?)` — Count activities grouped by `activityType`, filtered by user role (department). Returns activity counts and total unique users.
- `getEmployeeList(start, end, page, search, dept?)` — Paginated list of users with their total activity count, grouped by user, filtered by role. Sortable by count.
- `getEmployeeActivityBreakdown(userId, start, end)` — Activity counts per `activityType` for one user. For the bar chart.
- `getEmployeeTimeline(userId, start, end, page)` — Paginated list of recent audit_log entries for a user with `activityType` labels and timestamps.
- `getActivityHeatmap(userId, start, end)` — Day-of-week × hour-of-day counts for one user.
- `getDailyTrends(start, end, dept?)` — Daily activity counts, optionally grouped by top N activity types.
- All queries join `users` table for name/image, filter by `users.role` for department.

### 15. Rewrite service

Delete and rewrite `src/app/admin/activity-tracker/_server/service.ts` — Same access control (admin or manager position). Simplified method wrappers calling the new repository.

### 16. Rewrite actions

Delete and rewrite `src/app/admin/activity-tracker/_server/actions.ts` — Updated server actions matching new repository methods.

---

## Phase 5: Rebuild Types & Config

### 17. Rewrite types

Delete and rewrite `src/app/admin/activity-tracker/_lib/types.ts` — New types:

- `ActivitySummary` — `{ activityType: string; label: string; count: number }`
- `EmployeeSummary` — `{ userId: string; name: string; image: string | null; totalActivities: number; topActivity: string }`
- `EmployeeActivityBreakdown` — `{ activityType: string; label: string; count: number }[]`
- `TimelineEntry` — `{ id: string; activityType: string; label: string; timestamp: Date; tableName: string; recordId: string }`
- `HeatmapCell` — `{ dayOfWeek: number; hour: number; count: number }`
- `DailyTrend` — `{ date: string; activityType: string; count: number }`
- `DateRange`, `TimePreset` updated with monthly/quarterly presets

### 18. Delete department-tables.ts

Delete `src/app/admin/activity-tracker/_lib/department-tables.ts` — No longer needed (department = user role, not table ownership).

---

## Phase 6: Rebuild UI Components

### 19. Rewrite main page

Delete and rewrite `src/app/admin/activity-tracker/page.tsx` — New main page:

- Department selector (for admins) + time period filter with new presets (Today, 7d, 30d, This Month, Last Month, This Quarter, This Year, Custom)
- `DepartmentOverview` — Stat cards showing top activity types with counts
- `DailyTrendsChart` — Line chart of daily activity counts
- `EmployeeList` — Ranked table of employees by total activities

### 20. Rewrite DepartmentOverview

Delete and rewrite `src/app/admin/activity-tracker/_components/DepartmentOverview.tsx` — Grid of stat cards, each card showing an activity type icon, label, and count. Sorted by count descending.

### 21. Rewrite EmployeeList

Delete and rewrite `src/app/admin/activity-tracker/_components/EmployeeList.tsx` — Table with avatar, name, role badge, total activities, top activity. Clickable to drill into employee detail.

### 22. Rewrite DailyTrendsChart

Delete and rewrite `src/app/admin/activity-tracker/_components/DailyTrendsChart.tsx` — Line chart showing daily total activities, optionally stacked by top activity types.

### 23. Rewrite DateRangeFilter

Delete and rewrite `src/app/admin/activity-tracker/_components/DateRangeFilter.tsx` — Updated with new presets: Today, 7 days, 30 days, This Month, Last Month, This Quarter, This Year, Custom.

### 24. Rewrite employee detail page

Delete and rewrite `src/app/admin/activity-tracker/[userId]/page.tsx` — Employee detail page with:

- Header: User avatar, name, role, total activities in period
- `ActivityBreakdownChart` — Horizontal bar chart of activity counts by type
- `ActivityHeatmap` — Day/hour heatmap
- `ActivityTimeline` — Paginated list of recent activities with type labels, timestamps, and record links

### 25. Rewrite EmployeeDetailView

Delete and rewrite `src/app/admin/activity-tracker/_components/EmployeeDetailView.tsx` — Container component for the employee detail page sections.

### 26. Rewrite ActivityTimeline

Delete and rewrite `src/app/admin/activity-tracker/_components/ActivityTimeline.tsx` — Timeline items show activity type label with icon, timestamp, and optional record link.

### 27. Rewrite ActivityHeatmap

Delete and rewrite `src/app/admin/activity-tracker/_components/ActivityHeatmap.tsx` — Retained, but data now comes from `activityType`-based queries instead of raw CRUD counts.

### 28. Delete EntityBreakdownChart

Delete `src/app/admin/activity-tracker/_components/EntityBreakdownChart.tsx` — Replaced by new `ActivityBreakdownChart` showing activity types instead of database tables.

---

## Activity Types Master Reference

### Registry

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `student_creation` | Student Creation | students | INSERT |
| `student_update` | Student Update | students | UPDATE |
| `student_deletion` | Student Deletion | students | DELETE |
| `program_enrollment` | Program Enrollment | student_programs | INSERT |
| `program_completed` | Program Completed | student_programs | UPDATE (status=Completed) |
| `program_activated` | Program Activated | student_programs | UPDATE (status=Active) |
| `program_change` | Program Change | student_programs | UPDATE (status=Changed) |
| `program_deleted` | Program Deleted | student_programs | UPDATE (status=Deleted) |
| `program_deactivated` | Program Deactivated | student_programs | UPDATE (status=Inactive) |
| `semester_activated` | Semester Activated | student_semesters | UPDATE (status=Active) |
| `semester_deferred` | Semester Deferred | student_semesters | UPDATE (status=Deferred) |
| `semester_dropout` | Semester Dropout | student_semesters | UPDATE (status=DroppedOut) |
| `semester_deleted` | Semester Deleted | student_semesters | UPDATE (status=Deleted) |
| `semester_withdrawal` | Semester Withdrawal | student_semesters | UPDATE (status=Withdrawn) |
| `semester_repeat` | Semester Repeat | student_semesters | UPDATE (status=Repeat) |
| `semester_deactivated` | Semester Deactivated | student_semesters | UPDATE (status=Inactive) |
| `module_update` | Module Update | student_modules | UPDATE (status=Compulsory) |
| `module_dropped` | Module Dropped | student_modules | UPDATE (status=Drop) |
| `module_deleted` | Module Deleted | student_modules | UPDATE (status=Delete) |
| `module_repeated` | Module Repeated | student_modules | UPDATE (status=Repeat1/2/3) |
| `registration_submitted` | Registration Submitted | registration_requests | INSERT |
| `registration_updated` | Registration Updated | registration_requests | UPDATE |
| `registration_cancelled` | Registration Cancelled | registration_requests | DELETE |
| `clearance_created` | Clearance Created | clearances | INSERT |
| `clearance_approved` | Clearance Approved | clearances | UPDATE (status=approved/pending) |
| `clearance_rejected` | Clearance Rejected | clearances | UPDATE (status=rejected) |
| `transcript_print` | Transcript Print | transcript_prints | INSERT |
| `statement_of_results_print` | Statement of Results Print | statement_of_results_prints | INSERT |
| `student_card_print` | Student Card Print | student_card_prints | INSERT |
| `graduation_date_created` | Graduation Date Created | graduation_dates | INSERT |
| `graduation_date_updated` | Graduation Date Updated | graduation_dates | UPDATE |
| `graduation_request_submitted` | Graduation Request | graduation_requests | INSERT |
| `graduation_request_updated` | Graduation Request Updated | graduation_requests | UPDATE |
| `graduation_clearance_created` | Graduation Clearance Created | graduation_clearance | INSERT |
| `graduation_clearance_decision` | Graduation Clearance Decision | graduation_clearance | UPDATE |
| `certificate_generated` | Certificate Generated | — | — |
| `certificate_reprint` | Certificate Reprint | certificate_reprints | INSERT |
| `student_blocked` | Student Blocked | blocked_students | INSERT |
| `student_unblocked` | Student Unblocked | blocked_students | DELETE |
| `term_created` | Term Created | terms | INSERT |
| `term_updated` | Term Updated | terms | UPDATE |
| `document_uploaded` | Document Uploaded | student_documents | INSERT |
| `auto_approval_created` | Auto-Approval Created | auto_approvals | INSERT |
| `auto_approval_updated` | Auto-Approval Updated | auto_approvals | UPDATE |
| `auto_approval_deleted` | Auto-Approval Deleted | auto_approvals | DELETE |
| `term_settings_updated` | Term Settings Updated | term_settings | UPDATE |

### Academic

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `assessment_created` | Assessment Created | assessments | INSERT |
| `assessment_updated` | Assessment Updated | assessments | UPDATE |
| `assessment_deleted` | Assessment Deleted | assessments | DELETE |
| `mark_entered` | Mark Entered | assessment_marks | INSERT |
| `mark_updated` | Mark Updated | assessment_marks | UPDATE |
| `mark_deleted` | Mark Deleted | assessment_marks | DELETE |
| `module_assigned` | Module Assigned | assigned_modules | INSERT |
| `module_unassigned` | Module Unassigned | assigned_modules | DELETE |
| `attendance_recorded` | Attendance Recorded | attendance | INSERT |
| `attendance_updated` | Attendance Updated | attendance | UPDATE |
| `module_created` | Module Created | modules | INSERT |
| `module_updated` | Module Updated | modules | UPDATE |
| `semester_module_created` | Semester Module Created | semester_modules | INSERT |
| `semester_module_updated` | Semester Module Updated | semester_modules | UPDATE |
| `semester_module_deleted` | Semester Module Deleted | semester_modules | DELETE |
| `school_created` | School Created | schools | INSERT |
| `school_updated` | School Updated | schools | UPDATE |
| `program_created` | Program Created | programs | INSERT |
| `program_updated` | Program Updated | programs | UPDATE |
| `structure_created` | Structure Created | structures | INSERT |
| `structure_updated` | Structure Updated | structures | UPDATE |
| `structure_semester_created` | Structure Semester Created | structure_semesters | INSERT |
| `structure_semester_updated` | Structure Semester Updated | structure_semesters | UPDATE |
| `feedback_cycle_created` | Feedback Cycle Created | feedback_cycles | INSERT |
| `feedback_cycle_updated` | Feedback Cycle Updated | feedback_cycles | UPDATE |
| `feedback_category_created` | Feedback Category Created | feedback_categories | INSERT |
| `feedback_category_updated` | Feedback Category Updated | feedback_categories | UPDATE |
| `feedback_question_created` | Feedback Question Created | feedback_questions | INSERT |
| `feedback_question_updated` | Feedback Question Updated | feedback_questions | UPDATE |

### Finance

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `payment_receipt_added` | Payment Receipt Added | payment_receipts | INSERT |
| `payment_receipt_removed` | Payment Receipt Removed | payment_receipts | DELETE |
| `sponsor_created` | Sponsor Created | sponsors | INSERT |
| `sponsor_updated` | Sponsor Updated | sponsors | UPDATE |
| `sponsorship_assigned` | Sponsorship Assigned | sponsored_students | INSERT |
| `sponsorship_updated` | Sponsorship Updated | sponsored_students | UPDATE |

### Library

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `book_added` | Book Added | books | INSERT |
| `book_updated` | Book Updated | books | UPDATE |
| `book_deleted` | Book Deleted | books | DELETE |
| `book_copy_added` | Book Copy Added | book_copies | INSERT |
| `book_copy_updated` | Book Copy Updated | book_copies | UPDATE |
| `book_loan_created` | Book Loan | loans | INSERT |
| `book_returned` | Book Returned | loans | UPDATE |
| `loan_deleted` | Loan Deleted | loans | DELETE |
| `fine_created` | Fine Created | fines | INSERT |
| `fine_updated` | Fine Updated | fines | UPDATE |
| `author_created` | Author Created | authors | INSERT |
| `author_updated` | Author Updated | authors | UPDATE |
| `author_deleted` | Author Deleted | authors | DELETE |
| `category_created` | Category Created | categories | INSERT |
| `category_updated` | Category Updated | categories | UPDATE |
| `category_deleted` | Category Deleted | categories | DELETE |
| `publication_added` | Publication Added | publications | INSERT |
| `publication_updated` | Publication Updated | publications | UPDATE |
| `publication_deleted` | Publication Deleted | publications | DELETE |
| `question_paper_uploaded` | Question Paper Uploaded | question_papers | INSERT |
| `question_paper_updated` | Question Paper Updated | question_papers | UPDATE |
| `question_paper_deleted` | Question Paper Deleted | question_papers | DELETE |
| `library_settings_updated` | Library Settings Updated | library_settings | UPDATE |
| `external_library_added` | External Library Added | external_libraries | INSERT |
| `external_library_updated` | External Library Updated | external_libraries | UPDATE |
| `external_library_deleted` | External Library Deleted | external_libraries | DELETE |

### Admissions (Marketing)

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `application_submitted` | Application Submitted | applications | INSERT |
| `application_updated` | Application Updated | applications | UPDATE |
| `application_status_changed` | Application Status Changed | applications | UPDATE (status changed) |
| `applicant_document_uploaded` | Document Uploaded | applicant_documents | INSERT |
| `applicant_document_reviewed` | Document Reviewed | applicant_documents | UPDATE |
| `deposit_submitted` | Deposit Submitted | bank_deposits | INSERT |
| `deposit_verified` | Deposit Verified | bank_deposits | UPDATE |
| `applicant_created` | Applicant Created | applicants | INSERT |
| `applicant_updated` | Applicant Updated | applicants | UPDATE |
| `subject_created` | Subject Created | subjects | INSERT |
| `subject_updated` | Subject Updated | subjects | UPDATE |
| `subject_deleted` | Subject Deleted | subjects | DELETE |
| `recognized_school_added` | School Added | recognized_schools | INSERT |
| `recognized_school_updated` | School Updated | recognized_schools | UPDATE |
| `recognized_school_deleted` | School Deleted | recognized_schools | DELETE |
| `certificate_type_created` | Certificate Type Created | certificate_types | INSERT |
| `certificate_type_updated` | Certificate Type Updated | certificate_types | UPDATE |
| `certificate_type_deleted` | Certificate Type Deleted | certificate_types | DELETE |
| `entry_requirement_created` | Entry Requirement Created | entry_requirements | INSERT |
| `entry_requirement_updated` | Entry Requirement Updated | entry_requirements | UPDATE |
| `entry_requirement_deleted` | Entry Requirement Deleted | entry_requirements | DELETE |
| `intake_period_created` | Intake Period Created | intake_periods | INSERT |
| `intake_period_updated` | Intake Period Updated | intake_periods | UPDATE |
| `intake_period_deleted` | Intake Period Deleted | intake_periods | DELETE |

### Admin

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `user_created` | User Created | users | INSERT |
| `user_updated` | User Updated | users | UPDATE |
| `user_deleted` | User Deleted | users | DELETE |
| `task_created` | Task Created | tasks | INSERT |
| `task_updated` | Task Updated | tasks | UPDATE |
| `notification_created` | Notification Created | notifications | INSERT |
| `notification_updated` | Notification Updated | notifications | UPDATE |

### Timetable (Resource)

| Activity Type | Label | Table | Operation |
|--------------|-------|-------|-----------|
| `venue_created` | Venue Created | venues | INSERT |
| `venue_updated` | Venue Updated | venues | UPDATE |
| `venue_type_created` | Venue Type Created | venue_types | INSERT |
| `venue_type_updated` | Venue Type Updated | venue_types | UPDATE |
| `allocation_created` | Allocation Created | timetable_allocations | INSERT |
| `allocation_updated` | Allocation Updated | timetable_allocations | UPDATE |
| `allocation_deleted` | Allocation Deleted | timetable_allocations | DELETE |
| `slot_created` | Slot Created | timetable_slots | INSERT |
| `slot_updated` | Slot Updated | timetable_slots | UPDATE |
| `slot_deleted` | Slot Deleted | timetable_slots | DELETE |

---

## Verification Checklist

1. Run `pnpm db:generate` after schema change → verify migration SQL
2. Run `pnpm tsc --noEmit & pnpm lint:fix` → fix all type errors
3. Backfill migration: run against dev DB, verify `SELECT activity_type, count(*) FROM audit_logs WHERE activity_type IS NOT NULL GROUP BY activity_type`
4. Manually test: perform actions (register student, print transcript, approve clearance) → verify `activity_type` is written
5. UI: verify department summary, employee list ranking, employee drill-down all display meaningful activity labels
6. Verify non-admin manager can only see their department's data
