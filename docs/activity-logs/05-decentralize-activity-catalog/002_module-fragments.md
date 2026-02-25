````markdown
# Step 2 — Module Activity Fragments

## Goal

Create an `_lib/activities.ts` file in each module that owns activity types. Each file declares that module's catalog entries and table-operation mappings.

## Fragment Files to Create

### 2.1 — Registry: `src/app/registry/_lib/activities.ts`

Contains all registry-department activities (50 entries):

| Activity Key | Label | Table Mapping |
|-------------|-------|---------------|
| `student_creation` | Student Creation | `students:INSERT` |
| `student_update` | Student Update | `students:UPDATE` |
| `student_deletion` | Student Deletion | `students:DELETE` |
| `program_enrollment` | Program Enrollment | `student_programs:INSERT` |
| `program_completed` | Program Completed | *(service-only, no table map)* |
| `program_activated` | Program Activated | *(service-only)* |
| `program_change` | Program Change | *(service-only)* |
| `program_deleted` | Program Deleted | *(service-only)* |
| `program_deactivated` | Program Deactivated | *(service-only)* |
| `semester_activated` | Semester Activated | `student_semesters:INSERT` |
| `semester_deferred` | Semester Deferred | *(service-only)* |
| `semester_dropout` | Semester Dropout | *(service-only)* |
| `semester_deleted` | Semester Deleted | *(service-only)* |
| `semester_withdrawal` | Semester Withdrawal | *(service-only)* |
| `semester_repeat` | Semester Repeat | *(service-only)* |
| `semester_deactivated` | Semester Deactivated | *(service-only)* |
| `module_update` | Module Update | `student_modules:UPDATE` |
| `module_dropped` | Module Dropped | *(service-only)* |
| `module_deleted` | Module Deleted | *(service-only)* |
| `module_repeated` | Module Repeated | *(service-only)* |
| `registration_submitted` | Registration Submitted | `registration_requests:INSERT` |
| `registration_updated` | Registration Updated | `registration_requests:UPDATE` |
| `registration_cancelled` | Registration Cancelled | `registration_requests:DELETE` |
| `clearance_created` | Clearance Created | `clearances:INSERT` |
| `clearance_approved` | Clearance Approved | `clearances:UPDATE` |
| `clearance_rejected` | Clearance Rejected | *(service-only)* |
| `transcript_print` | Transcript Print | `transcript_prints:INSERT` |
| `statement_of_results_print` | Statement of Results Print | `statement_of_results_prints:INSERT` |
| `student_card_print` | Student Card Print | `student_card_prints:INSERT` |
| `graduation_date_created` | Graduation Date Created | `graduation_dates:INSERT` |
| `graduation_date_updated` | Graduation Date Updated | `graduation_dates:UPDATE` |
| `graduation_date_deleted` | Graduation Date Deleted | `graduation_dates:DELETE` |
| `graduation_request_submitted` | Graduation Request Submitted | `graduation_requests:INSERT` |
| `graduation_request_updated` | Graduation Request Updated | `graduation_requests:UPDATE` |
| `graduation_clearance_created` | Graduation Clearance Created | `graduation_clearance:INSERT` |
| `graduation_clearance_decision` | Graduation Clearance Decision | `graduation_clearance:UPDATE` |
| `certificate_reprint_created` | Certificate Reprint Created | `certificate_reprints:INSERT` |
| `certificate_reprint_updated` | Certificate Reprint Updated | `certificate_reprints:UPDATE` |
| `certificate_reprint_deleted` | Certificate Reprint Deleted | `certificate_reprints:DELETE` |
| `student_program_structure_changed` | Student Program Structure Changed | *(service-only)* |
| `student_blocked` | Student Blocked | `blocked_students:INSERT` |
| `student_unblocked` | Student Unblocked | `blocked_students:DELETE` |
| `term_created` | Term Created | `terms:INSERT` |
| `term_updated` | Term Updated | `terms:UPDATE` |
| `term_settings_updated` | Term Settings Updated | `term_settings:UPDATE` |
| `document_uploaded` | Document Uploaded | `student_documents:INSERT` |
| `document_deleted` | Document Deleted | *(service-only)* |
| `auto_approval_created` | Auto Approval Created | `auto_approvals:INSERT` |
| `auto_approval_updated` | Auto Approval Updated | `auto_approvals:UPDATE` |
| `auto_approval_deleted` | Auto Approval Deleted | `auto_approvals:DELETE` |

**Example structure:**

```ts
import type { ActivityFragment } from '@/shared/lib/utils/activities';

const REGISTRY_ACTIVITIES = {
  catalog: {
    student_creation: { label: 'Student Creation', department: 'registry' },
    student_update: { label: 'Student Update', department: 'registry' },
    // ... all 50 registry entries
  },
  tableOperationMap: {
    'students:INSERT': 'student_creation',
    'students:UPDATE': 'student_update',
    // ... all registry table mappings
  },
} as const satisfies ActivityFragment;

export default REGISTRY_ACTIVITIES;

export type RegistryActivityType = keyof typeof REGISTRY_ACTIVITIES.catalog;
```

### 2.2 — Academic: `src/app/academic/_lib/activities.ts`

Contains academic-department activities (30 entries):

- Assessment CRUD (`assessment_created/updated/deleted`)
- Marks CRUD (`mark_entered/updated/deleted`)
- Module assignments (`module_assigned/unassigned`)
- Attendance (`attendance_recorded/updated`)
- Module management (`module_created/updated`)
- Semester modules (`semester_module_created/updated/deleted`)
- Programs (`program_created/updated`)
- Structures (`structure_created/updated`, `structure_semester_created/updated`)
- Feedback cycles (`feedback_cycle_created/updated/deleted`)
- Feedback categories (`feedback_category_created/updated/deleted`)
- Feedback questions (`feedback_question_created/updated/deleted`)

> **Note on `module_deleted`**: The `TABLE_OPERATION_MAP` maps `modules:DELETE` → `module_deleted`, but `module_deleted` is defined under the registry department catalog (for student module enrollment deletion). This is a pre-existing domain conflict — the academic table operation maps to a registry activity key. During migration, keep `modules:DELETE` → `module_deleted` in the academic fragment's `tableOperationMap`, but the catalog entry itself stays in the registry fragment since registry owns the `module_deleted` key. The `tableOperationMap` values are allowed to reference keys from other fragments (they resolve at assembly time).

### 2.3 — Finance: `src/app/finance/_lib/activities.ts`

Contains finance-department activities (8 entries):

- Payment receipts (`payment_receipt_added/removed`)
- Sponsors (`sponsor_created/updated/deleted`)
- Sponsorship (`sponsorship_assigned/updated/deleted`)

### 2.4 — Library: `src/app/library/_lib/activities.ts`

Contains library-department activities (29 entries):

- Books (`book_added/updated/deleted`)
- Book copies (`book_copy_added/updated/deleted`)
- Loans (`book_loan_created/renewed`, `book_returned`, `loan_deleted`)
- Fines (`fine_created/updated/deleted`)
- Authors (`author_created/updated/deleted`)
- Categories (`category_created/updated/deleted`)
- Publications (`publication_added/updated/deleted`)
- Question papers (`question_paper_uploaded/updated/deleted`)
- Settings (`library_settings_updated`)
- External libraries (`external_library_added/updated/deleted`)

### 2.5 — Admissions: `src/app/admissions/_lib/activities.ts`

Contains marketing-department activities (27 entries):

- Applications (`application_submitted/updated/deleted`, `application_status_changed`)
- Applicant documents (`applicant_document_uploaded/reviewed/deleted`)
- Deposits (`deposit_submitted/verified/deleted`)
- Applicants (`applicant_created/updated`)
- Subjects (`subject_created/updated/deleted`)
- Recognized schools (`recognized_school_added/updated/deleted`)
- Certificate types (`certificate_type_created/updated/deleted`)
- Entry requirements (`entry_requirement_created/updated/deleted`)
- Intake periods (`intake_period_created/updated/deleted`)

### 2.6 — Admin: `src/app/admin/_lib/activities.ts`

Contains admin-department activities (16 entries):

- Users (`user_created/updated/deleted`)
- Tasks (`task_created/updated/deleted`, `task_status_changed`, `task_assignees_changed`, `task_students_changed`, `task_due_date_changed`, `task_priority_changed`)
- Notifications (`notification_created/updated/deleted`, `notification_recipients_changed`, `notification_visibility_changed`)

### 2.7 — Timetable: `src/app/timetable/_lib/activities.ts`

Contains resource-department activities (12 entries):

- Venues (`venue_created/updated/deleted`)
- Venue types (`venue_type_created/updated/deleted`)
- Allocations (`allocation_created/updated/deleted`)
- Slots (`slot_created/updated/deleted`)

## Implementation Notes

- Each file exports a `default` const object satisfying `ActivityFragment`
- Each file also exports a module-scoped `ActivityType` union (e.g., `RegistryActivityType`)
- The `as const satisfies ActivityFragment` pattern ensures:
  - Keys are literal types (not widened to `string`)
  - The object shape is validated against the contract
  - Module-level type narrowing works
- Department is hardcoded per module (e.g., all registry entries have `department: 'registry'`) so a helper `createFragment(department, entries)` could reduce boilerplate
- `tableOperationMap` values must reference keys from the same fragment's `catalog` — the `satisfies` constraint enforces this at the fragment level. For cross-module references (like `modules:DELETE` → `module_deleted`), the `tableOperationMap` type should allow `string` values, and correctness is verified at assembly time
- The `ActivityFragment` generic constraint on `tableOperationMap` should be relaxed to `Record<string, string>` to support cross-module table operation mappings

````
