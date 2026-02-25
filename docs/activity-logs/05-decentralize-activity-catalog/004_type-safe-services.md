# Step 4 — Type-Safe Service Activity Types

## Goal

Replace hardcoded string literals in all services with typed constant imports from their owning module's `activities.ts` fragment, gaining compile-time safety.

## Current State (Unsafe)

Every service currently hardcodes activity type strings:

```ts
// src/app/timetable/venues/_server/service.ts
activityTypes: {
  create: 'venue_created',  // plain string, no type checking
  update: 'venue_updated',  // typo → silent runtime bug
},

// src/app/registry/students/_server/service.ts
activityType: 'student_creation',  // inline string literal
```

If someone misspells `'venu_created'`, TypeScript won't catch it. The audit log gets a garbage `activity_type` value.

## Target State (Type-Safe)

Each module's `activities.ts` exports typed constants that services import:

```ts
// src/app/timetable/_lib/activities.ts
export const TIMETABLE_ACTIVITY = {
  VENUE_CREATED: 'venue_created',
  VENUE_UPDATED: 'venue_updated',
  // ...
} as const;
```

```ts
// src/app/timetable/venues/_server/service.ts
import { TIMETABLE_ACTIVITY } from '@timetable/_lib/activities';

activityTypes: {
  create: TIMETABLE_ACTIVITY.VENUE_CREATED,
  update: TIMETABLE_ACTIVITY.VENUE_UPDATED,
},
```

Now a typo is a compile error. Renaming an activity key propagates through the type system.

## Services to Update

### Registry Module (`src/app/registry/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `students/_server/service.ts` | `student_creation`, `student_update`, `student_program_structure_changed`, `program_enrollment`, + resolvers for program/semester/module status |
| `blocked-students/_server/service.ts` | `student_blocked`, `student_unblocked` |
| `terms/_server/service.ts` | `term_created`, `term_updated` (via `activityTypes` config) |
| `terms/settings/_server/service.ts` | `term_settings_updated` |
| `registration/requests/_server/requests/service.ts` | `registration_submitted`, `registration_updated`, `registration_cancelled` |
| `registration/requests/_server/clearance/service.ts` | `clearance_approved`, `clearance_rejected` |
| `registration/clearance/auto-approve/_server/service.ts` | `auto_approval_created`, `auto_approval_updated`, `auto_approval_deleted` |
| `print/transcript/_server/service.ts` | `transcript_print` |
| `print/statement-of-results/_server/service.ts` | `statement_of_results_print` |
| `print/student-card/_server/service.ts` | `student_card_print` |
| `documents/_server/service.ts` | `document_uploaded`, `document_deleted` |
| `graduation/dates/_server/service.ts` | `graduation_date_created`, `graduation_date_updated`, `graduation_date_deleted` (via `activityTypes` config) |
| `graduation/clearance/_server/requests/service.ts` | `graduation_request_submitted`, `graduation_request_updated` |
| `graduation/clearance/_server/clearance/service.ts` | `graduation_clearance_decision` |
| `certificate-reprints/_server/service.ts` | `certificate_reprint_created`, `certificate_reprint_updated`, `certificate_reprint_deleted` |

### Academic Module (`src/app/academic/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `assessments/_server/service.ts` | `assessment_created`, `assessment_updated`, `assessment_deleted` (via config) |
| `assessment-marks/_server/service.ts` | `mark_entered`, `mark_updated` (manual audit calls, not BaseService config) |
| `assigned-modules/_server/service.ts` | `module_assigned`, `module_unassigned` (manual audit calls) |
| `attendance/_server/service.ts` | `attendance_recorded` (manual audit calls) |
| `modules/_server/service.ts` | `module_created`, `module_updated`, `module_deleted` (via config) |
| `semester-modules/_server/service.ts` | `semester_module_created`, `semester_module_updated`, `semester_module_deleted` (via config) |
| `schools/structures/_server/service.ts` | `structure_created`, `structure_updated`, `structure_semester_created` (via config + manual) |
| `feedback/cycles/_server/service.ts` | `feedback_cycle_created`, `feedback_cycle_updated`, `feedback_cycle_deleted` (via config) |
| `feedback/categories/_server/service.ts` | `feedback_category_created`, `feedback_category_updated`, `feedback_category_deleted` (via config) |
| `feedback/questions/_server/service.ts` | `feedback_question_created`, `feedback_question_updated`, `feedback_question_deleted` (via config) |

### Finance Module (`src/app/finance/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `payment-receipts/_server/service.ts` | `payment_receipt_added`, `payment_receipt_removed` (via config) |
| `sponsors/_server/service.ts` | `sponsor_created`, `sponsor_updated`, `sponsor_deleted`, `sponsorship_assigned`, `sponsorship_updated` (manual audit calls) |

### Library Module (`src/app/library/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `books/_server/service.ts` | `book_added`, `book_updated`, `book_deleted` (via config) |
| `book-copies/_server/service.ts` | `book_copy_added`, `book_copy_updated`, `book_copy_deleted` (via config) |
| `loans/_server/service.ts` | `book_loan_created`, `book_loan_renewed`, `book_returned`, `loan_deleted` (via config + manual) |
| `fines/_server/service.ts` | `fine_created`, `fine_updated`, `fine_deleted` (via config) |
| `authors/_server/service.ts` | `author_created`, `author_updated`, `author_deleted` (via config) |
| `categories/_server/service.ts` | `category_created`, `category_updated`, `category_deleted` (via config) |
| `resources/publications/_server/service.ts` | `publication_added`, `publication_updated`, `publication_deleted` (via config) |
| `resources/question-papers/_server/service.ts` | `question_paper_uploaded`, `question_paper_updated`, `question_paper_deleted` (via config) |
| `settings/_server/service.ts` | `library_settings_updated` (via config) |
| `external-libraries/_server/service.ts` | `external_library_added`, `external_library_updated`, `external_library_deleted` (via config) |

### Admissions Module (`src/app/admissions/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `applications/_server/service.ts` | `application_submitted`, `application_updated`, `application_deleted`, `application_status_changed` (via config + manual) |
| `applicants/_server/service.ts` | `applicant_created`, `applicant_updated` (via config) |
| `applicants/[id]/documents/_server/service.ts` | `applicant_document_uploaded`, `applicant_document_reviewed`, `applicant_document_deleted` (via config) |
| `documents/_server/service.ts` | `applicant_document_uploaded`, `applicant_document_reviewed`, `applicant_document_deleted` (via config) |
| `payments/_server/service.ts` | `deposit_submitted`, `deposit_verified`, `deposit_deleted` (via config) |
| `subjects/_server/service.ts` | `subject_created`, `subject_updated`, `subject_deleted` (via config) |
| `recognized-schools/_server/service.ts` | `recognized_school_added`, `recognized_school_updated`, `recognized_school_deleted` (via config) |
| `certificate-types/_server/service.ts` | `certificate_type_created`, `certificate_type_updated`, `certificate_type_deleted` (via config) |
| `entry-requirements/_server/service.ts` | `entry_requirement_created`, `entry_requirement_updated`, `entry_requirement_deleted` (via config) |
| `intake-periods/_server/service.ts` | `intake_period_created`, `intake_period_updated`, `intake_period_deleted` (via config) |

### Admin Module (`src/app/admin/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `users/_server/service.ts` | `user_created`, `user_updated`, `user_deleted` (via config) |
| `tasks/_server/service.ts` | `task_created`, `task_updated`, `task_deleted`, `task_status_changed`, `task_assignees_changed`, `task_students_changed`, `task_due_date_changed`, `task_priority_changed` (via config + manual) |
| `notifications/_server/service.ts` | `notification_created`, `notification_updated`, `notification_deleted`, `notification_recipients_changed`, `notification_visibility_changed` (via config + manual) |

### Timetable Module (`src/app/timetable/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `venues/_server/service.ts` | `venue_created`, `venue_updated`, `venue_deleted` (via config) |
| `venue-types/_server/service.ts` | `venue_type_created`, `venue_type_updated`, `venue_type_deleted` (via config) |
| `timetable-allocations/_server/service.ts` | `allocation_created`, `allocation_updated`, `allocation_deleted` (via config) |
| `slots/_server/service.ts` | `slot_created`, `slot_updated`, `slot_deleted` (via config) |

## Status Resolver Functions

The registry module's `service.ts` has three resolver functions:

- `resolveStudentProgramActivityType(status)` → maps program status to activity type
- `resolveStudentSemesterActivityType(status)` → maps semester status to activity type
- `resolveStudentModuleActivityType(status)` → maps module status to activity type

These should move to `src/app/registry/_lib/activities.ts` and use typed constants from the same file, converting the `Record` maps to use the exported constants instead of strings.

## Implementation Order

1. Update registry services (highest usage, most complex resolvers)
2. Update library services (largest number of services)
3. Update timetable services
4. Update finance services
5. Update academic services (mostly config-based, straightforward)
6. Update admin-internal services (if any)

## `BaseService.activityTypes` Type — Current State

`BaseService` already uses the typed `ActivityType` union from `activity-catalog.ts`:

```ts
import type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog';

activityTypes?: {
  create?: ActivityType;
  update?: ActivityType;
  delete?: ActivityType;
};
```

This creates a dependency from `BaseService` (core/platform) → `activity-catalog` (admin module). After decentralization, `BaseService` should import `ActivityType` from the shared contract (`@/shared/lib/utils/activities`) instead. The shared module will export a base `ActivityType` as `string` (since it doesn't know all module fragments), and type safety at the call site comes from each module's typed constants. Alternatively, `BaseService` can accept `string` and rely on the module-level constants for compile-time safety where `activityTypes` is configured.

### Migration for `BaseRepository.ts`

`BaseRepository` also imports from the monolith:

```ts
import type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog';
import { resolveTableActivity } from '@/app/admin/activity-tracker/_lib/activity-types';
```

After migration:
- `ActivityType` → import from `@/shared/lib/utils/activities` (or use `string` since `BaseRepository` accepts any valid type)
- `resolveTableActivity` → import from `@/shared/lib/utils/activities` (the function moves to shared with the assembled catalog registered via singleton)
