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
| `students/_server/service.ts` | `student_creation`, `student_update`, `program_structure_update`, `program_enrollment`, + resolvers for program/semester/module status |
| `blocked-students/_server/service.ts` | `student_blocked`, `student_unblocked` |
| `terms/_server/service.ts` | `term_created`, `term_updated` (via `activityTypes` config) |
| `terms/settings/_server/service.ts` | `term_settings_updated` |
| `registration/requests/_server/requests/service.ts` | `registration_submitted`, `registration_updated`, `registration_cancelled` |
| `registration/requests/_server/clearance/service.ts` | `clearance_approved`, `clearance_rejected` (inferred) |
| `registration/clearance/auto-approve/_server/service.ts` | `auto_approval_created`, `auto_approval_updated`, `auto_approval_deleted` |
| `print/transcript/_server/service.ts` | `transcript_print` |
| `print/statement-of-results/_server/service.ts` | `statement_of_results_print` |
| `print/student-card/_server/service.ts` | `student_card_print` |
| `documents/_server/service.ts` | `document_uploaded`, `document_deleted` |
| `graduation/dates/_server/service.ts` | `graduation_date_created`, `graduation_date_updated` (via `activityTypes` config) |
| `graduation/clearance/_server/requests/service.ts` | `graduation_request_submitted`, `graduation_request_updated` |
| `graduation/clearance/_server/clearance/service.ts` | `graduation_clearance_decision` |
| `certificate-reprints/_server/service.ts` | `certificate_reprint` |

### Academic Module (`src/app/academic/`)

Services using `activityTypes` config in `BaseService` constructor — update to import from `@academic/_lib/activities`.

### Finance Module (`src/app/finance/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `payment-receipts/_server/service.ts` | `payment_receipt_added`, `payment_receipt_removed` (via config) |
| `sponsors/_server/service.ts` | `sponsor_created`, `sponsor_updated` |

### Library Module (`src/app/library/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `books/_server/service.ts` | `book_added`, `book_updated`, `book_deleted` (via config) |
| `book-copies/_server/service.ts` | `book_copy_added`, `book_copy_updated` (via config) |
| `loans/_server/service.ts` | `book_loan_created`, `book_returned`, `loan_deleted` (via config + manual) |
| `fines/_server/service.ts` | `fine_created`, `fine_updated` (via config) |
| `authors/_server/service.ts` | `author_created`, `author_updated`, `author_deleted` (via config) |
| `categories/_server/service.ts` | `category_created`, `category_updated`, `category_deleted` (via config) |
| `resources/publications/_server/service.ts` | `publication_added`, etc. (via config) |
| `resources/question-papers/_server/service.ts` | `question_paper_uploaded`, etc. (via config) |
| `settings/_server/service.ts` | `library_settings_updated` (via config) |
| `external-libraries/_server/service.ts` | `external_library_added`, etc. (via config) |

### Timetable Module (`src/app/timetable/`)

| Service File | Activity Types Used |
|-------------|-------------------|
| `venues/_server/service.ts` | `venue_created`, `venue_updated` (via config) |
| `venue-types/_server/service.ts` | `venue_type_created`, `venue_type_updated` (via config) |
| `timetable-allocations/_server/service.ts` | `allocation_created`, etc. (via config) |
| `slots/_server/service.ts` | `slot_created`, etc. (via config) |

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

## `BaseService.activityTypes` Type Enhancement (Optional)

Currently `BaseService` accepts `activityTypes: { create?: string; update?: string; delete?: string }`. This could be narrowed:

```ts
activityTypes?: {
  create?: ActivityType;
  update?: ActivityType;
  delete?: ActivityType;
};
```

However, this would create a dependency from `BaseService` (core/platform) → assembled catalog (admin module), violating the dependency direction. Instead, keep the `string` type on `BaseService` but rely on module-level constants for safety at the call site. The type narrowing happens where the constant is used, not where it's accepted.
