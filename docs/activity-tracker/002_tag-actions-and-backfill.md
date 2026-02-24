# Step 2: Tag All Actions & Backfill Historical Data

This step creates the activity type registry, tags every service method with the correct `activityType`, and backfills all historical audit records. **Prerequisite**: Step 1 must be fully complete — every write operation must produce audit records before tagging them.

---

## 2.1 Create activity type registry

Create `src/app/admin/activity-tracker/_lib/activity-types.ts` as a thin wrapper over `activity-catalog.ts` from Step 1.1.1 (do not duplicate definitions). It should re-export and derive:

1. A const map of all `activityType` identifiers → display labels
2. A `tableName + operation → activityType` mapping (for backfill and as a fallback)
3. A helper function `getActivityLabel(activityType: string): string`
4. A department grouping map (which activity types belong to which department/role)

Implementation rule: activity identifiers must come from the shared `ActivityType` union. Avoid raw string literals in services and mappings.

```typescript
export const ACTIVITY_LABELS: Record<string, string> = {
  student_creation: 'Student Creation',
  student_update: 'Student Update',
  student_deletion: 'Student Deletion',
  program_enrollment: 'Program Enrollment',
  program_completed: 'Program Completed',
  // ... all activity types from the master reference below
};

export const DEPARTMENT_ACTIVITIES: Record<string, string[]> = {
  registry: [
    'student_creation', 'student_update', 'student_deletion',
    'program_enrollment', 'program_completed', 'program_activated',
    'program_change', 'program_deleted', 'program_deactivated',
    'semester_activated', 'semester_deferred', 'semester_dropout',
    'semester_deleted', 'semester_withdrawal', 'semester_repeat',
    'semester_deactivated',
    'module_update', 'module_dropped', 'module_deleted', 'module_repeated',
    'registration_submitted', 'registration_updated', 'registration_cancelled',
    'clearance_created', 'clearance_approved', 'clearance_rejected',
    'transcript_print', 'statement_of_results_print', 'student_card_print',
    'graduation_date_created', 'graduation_date_updated',
    'graduation_request_submitted', 'graduation_request_updated',
    'graduation_clearance_created', 'graduation_clearance_decision',
    'certificate_generated', 'certificate_reprint',
    'student_blocked', 'student_unblocked',
    'term_created', 'term_updated', 'term_settings_updated',
    'document_uploaded',
    'auto_approval_created', 'auto_approval_updated', 'auto_approval_deleted',
  ],
  academic: [
    'assessment_created', 'assessment_updated', 'assessment_deleted',
    'mark_entered', 'mark_updated', 'mark_deleted',
    'module_assigned', 'module_unassigned',
    'attendance_recorded', 'attendance_updated',
    'module_created', 'module_updated',
    'semester_module_created', 'semester_module_updated', 'semester_module_deleted',
    'program_created', 'program_updated',
    'structure_created', 'structure_updated',
    'structure_semester_created', 'structure_semester_updated',
    'feedback_cycle_created', 'feedback_cycle_updated',
    'feedback_category_created', 'feedback_category_updated',
    'feedback_question_created', 'feedback_question_updated',
  ],
  finance: [
    'payment_receipt_added', 'payment_receipt_removed',
    'sponsor_created', 'sponsor_updated',
    'sponsorship_assigned', 'sponsorship_updated',
  ],
  library: [
    'book_added', 'book_updated', 'book_deleted',
    'book_copy_added', 'book_copy_updated',
    'book_loan_created', 'book_returned', 'loan_deleted',
    'fine_created', 'fine_updated',
    'author_created', 'author_updated', 'author_deleted',
    'category_created', 'category_updated', 'category_deleted',
    'publication_added', 'publication_updated', 'publication_deleted',
    'question_paper_uploaded', 'question_paper_updated', 'question_paper_deleted',
    'library_settings_updated',
    'external_library_added', 'external_library_updated', 'external_library_deleted',
  ],
  marketing: [
    'application_submitted', 'application_updated', 'application_status_changed',
    'applicant_document_uploaded', 'applicant_document_reviewed',
    'deposit_submitted', 'deposit_verified',
    'applicant_created', 'applicant_updated',
    'subject_created', 'subject_updated', 'subject_deleted',
    'recognized_school_added', 'recognized_school_updated', 'recognized_school_deleted',
    'certificate_type_created', 'certificate_type_updated', 'certificate_type_deleted',
    'entry_requirement_created', 'entry_requirement_updated', 'entry_requirement_deleted',
    'intake_period_created', 'intake_period_updated', 'intake_period_deleted',
  ],
  admin: [
    'user_created', 'user_updated', 'user_deleted',
    'task_created', 'task_updated',
    'notification_created', 'notification_updated',
  ],
  resource: [
    'venue_created', 'venue_updated',
    'venue_type_created', 'venue_type_updated',
    'allocation_created', 'allocation_updated', 'allocation_deleted',
    'slot_created', 'slot_updated', 'slot_deleted',
  ],
};

export function getActivityLabel(activityType: string): string {
  return ACTIVITY_LABELS[activityType] ?? activityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
```

Recommended hardening:

- Export `ACTIVITY_KEYS` constants from the catalog and reference those constants in service configs
- Add a CI-safe check script to fail on duplicate keys or labels and unknown department assignments

---

## 2.2 Tag BaseService-based services

For services extending `BaseService`, add `activityTypes` to the constructor config. This requires zero method overrides — the BaseService changes from Step 1.5 handle the rest automatically.

### Academic Module

| Service | File | Config |
|---------|------|--------|
| `AssessmentService` | `src/app/academic/assessments/_server/service.ts` | `{ create: 'assessment_created', update: 'assessment_updated', delete: 'assessment_deleted' }` |
| `ModuleService` | `src/app/academic/modules/_server/service.ts` | `{ create: 'module_created', update: 'module_updated' }` |
| `SemesterModuleService` | `src/app/academic/semester-modules/_server/service.ts` | `{ create: 'semester_module_created', update: 'semester_module_updated', delete: 'semester_module_deleted' }` |
| `StructureService` | `src/app/academic/schools/structures/_server/service.ts` | `{ create: 'structure_created', update: 'structure_updated' }` |
| `FeedbackCycleService` | `src/app/academic/feedback/cycles/_server/service.ts` | `{ create: 'feedback_cycle_created', update: 'feedback_cycle_updated' }` |
| `FeedbackCategoryService` | `src/app/academic/feedback/categories/_server/service.ts` | `{ create: 'feedback_category_created', update: 'feedback_category_updated' }` |
| `FeedbackQuestionService` | `src/app/academic/feedback/questions/_server/service.ts` | `{ create: 'feedback_question_created', update: 'feedback_question_updated' }` |

### Finance Module

| Service | File | Config |
|---------|------|--------|
| `PaymentReceiptService` | `src/app/finance/payment-receipts/_server/service.ts` | `{ create: 'payment_receipt_added', delete: 'payment_receipt_removed' }` |

### Library Module

| Service | File | Config |
|---------|------|--------|
| `BookService` | `src/app/library/books/_server/service.ts` | `{ create: 'book_added', update: 'book_updated', delete: 'book_deleted' }` |
| `BookCopyService` | `src/app/library/book-copies/_server/service.ts` | `{ create: 'book_copy_added', update: 'book_copy_updated' }` |
| `LoanService` | `src/app/library/loans/_server/service.ts` | `{ delete: 'loan_deleted' }` (custom methods tagged separately below) |
| `FineService` | `src/app/library/fines/_server/service.ts` | `{ create: 'fine_created', update: 'fine_updated' }` |
| `AuthorService` | `src/app/library/authors/_server/service.ts` | `{ create: 'author_created', update: 'author_updated', delete: 'author_deleted' }` |
| `CategoryService` | `src/app/library/categories/_server/service.ts` | `{ create: 'category_created', update: 'category_updated', delete: 'category_deleted' }` |
| `PublicationService` | `src/app/library/resources/publications/_server/service.ts` | `{ create: 'publication_added', update: 'publication_updated', delete: 'publication_deleted' }` |
| `QuestionPaperService` | `src/app/library/resources/question-papers/_server/service.ts` | `{ create: 'question_paper_uploaded', update: 'question_paper_updated', delete: 'question_paper_deleted' }` |
| `LibrarySettingsService` | `src/app/library/settings/_server/service.ts` | `{ update: 'library_settings_updated' }` |
| `ExternalLibraryService` | `src/app/library/external-libraries/_server/service.ts` | `{ create: 'external_library_added', update: 'external_library_updated', delete: 'external_library_deleted' }` |

### Admissions Module

| Service | File | Config |
|---------|------|--------|
| `ApplicationService` | `src/app/admissions/applications/_server/service.ts` | `{ create: 'application_submitted', update: 'application_updated' }` |
| `ApplicantService` | `src/app/admissions/applicants/_server/service.ts` | `{ create: 'applicant_created', update: 'applicant_updated' }` |
| `DocumentReviewService` | `src/app/admissions/documents/_server/service.ts` | `{ create: 'applicant_document_uploaded', update: 'applicant_document_reviewed' }` |
| `ApplicantDocumentService` | `src/app/admissions/applicants/[id]/documents/_server/service.ts` | `{ create: 'applicant_document_uploaded', update: 'applicant_document_reviewed' }` |
| `PaymentService` | `src/app/admissions/payments/_server/service.ts` | `{ create: 'deposit_submitted', update: 'deposit_verified' }` |
| `SubjectService` | `src/app/admissions/subjects/_server/service.ts` | `{ create: 'subject_created', update: 'subject_updated', delete: 'subject_deleted' }` |
| `RecognizedSchoolService` | `src/app/admissions/recognized-schools/_server/service.ts` | `{ create: 'recognized_school_added', update: 'recognized_school_updated', delete: 'recognized_school_deleted' }` |
| `CertificateTypeService` | `src/app/admissions/certificate-types/_server/service.ts` | `{ create: 'certificate_type_created', update: 'certificate_type_updated', delete: 'certificate_type_deleted' }` |
| `EntryRequirementService` | `src/app/admissions/entry-requirements/_server/service.ts` | `{ create: 'entry_requirement_created', update: 'entry_requirement_updated', delete: 'entry_requirement_deleted' }` |
| `IntakePeriodService` | `src/app/admissions/intake-periods/_server/service.ts` | `{ create: 'intake_period_created', update: 'intake_period_updated', delete: 'intake_period_deleted' }` |

### Timetable Module

| Service | File | Config |
|---------|------|--------|
| `VenueService` | `src/app/timetable/venues/_server/service.ts` | `{ create: 'venue_created', update: 'venue_updated' }` |
| `VenueTypeService` | `src/app/timetable/venue-types/_server/service.ts` | `{ create: 'venue_type_created', update: 'venue_type_updated' }` |
| `TimetableAllocationService` | `src/app/timetable/timetable-allocations/_server/service.ts` | `{ create: 'allocation_created', update: 'allocation_updated', delete: 'allocation_deleted' }` |
| `TimetableSlotService` | `src/app/timetable/slots/_server/service.ts` | `{ create: 'slot_created', update: 'slot_updated', delete: 'slot_deleted' }` |

### Registry Module (BaseService-based)

| Service | File | Config |
|---------|------|--------|
| `TermService` | `src/app/registry/terms/_server/service.ts` | `{ create: 'term_created', update: 'term_updated' }` |
| `GraduationDateService` | `src/app/registry/graduation/dates/_server/service.ts` | `{ create: 'graduation_date_created', update: 'graduation_date_updated' }` |

---

## 2.3 Tag custom services (non-BaseService)

For services that don't extend BaseService, explicitly pass `activityType` in the audit options for every write method.

### Student Service (`src/app/registry/students/_server/service.ts`)

```typescript
async create(data: Student) {
  return withAuth(async (session) => this.repository.create(data, {
    userId: session!.user!.id!,
    activityType: 'student_creation',
  }), []);
}

async update(stdNo: number, data: Student) {
  return withAuth(async (session) => this.repository.update(stdNo, data, {
    userId: session!.user!.id!,
    activityType: 'student_update',
  }), []);
}

async updateWithReasons(stdNo: number, data: Partial<Student>, reasons?: string) {
  return withAuth(async (session) => this.repository.updateStudentWithAudit(stdNo, data, {
    userId: session!.user!.id!,
    activityType: 'student_update',
    metadata: reasons ? { reasons } : undefined,
  }), ['registry', 'admin']);
}
```

### Student Programs — Status-based activity types

The `updateStudentProgram` method currently takes generic `Partial<Insert>` data. Add status-resolution logic in the service:

```typescript
async updateStudentProgram(
  id: number,
  data: Partial<typeof studentPrograms.$inferInsert>,
  reasons?: string
) {
  return withAuth(async (session) => {
    const activityType = resolveStudentProgramActivityType(data.status);
    return this.repository.updateStudentProgram(id, data, {
      userId: session!.user!.id!,
      activityType,
      metadata: reasons ? { reasons } : undefined,
    });
  }, ['registry', 'admin']);
}

async createStudentProgram(data: typeof studentPrograms.$inferInsert, reasons?: string) {
  return withAuth(async (session) => this.repository.createStudentProgram(data, {
    userId: session!.user!.id!,
    activityType: 'program_enrollment',
    metadata: reasons ? { reasons } : undefined,
  }), ['registry', 'admin']);
}
```

Create a private helper (or put in the service file):

```typescript
function resolveStudentProgramActivityType(status?: string): string {
  switch (status) {
    case 'Completed': return 'program_completed';
    case 'Active': return 'program_activated';
    case 'Changed': return 'program_change';
    case 'Deleted': return 'program_deleted';
    case 'Inactive': return 'program_deactivated';
    default: return 'program_enrollment';
  }
}
```

### Student Semesters — Status-based

```typescript
async updateStudentSemester(id: number, data: Partial<typeof studentSemesters.$inferInsert>, reasons?: string) {
  return withAuth(async (session) => {
    const activityType = resolveStudentSemesterActivityType(data.status);
    return this.repository.updateStudentSemester(id, data, {
      userId: session!.user!.id!,
      activityType,
      metadata: reasons ? { reasons } : undefined,
    });
  }, ['registry', 'admin']);
}
```

```typescript
function resolveStudentSemesterActivityType(status?: string): string {
  switch (status) {
    case 'Active': return 'semester_activated';
    case 'Deferred': return 'semester_deferred';
    case 'DroppedOut': return 'semester_dropout';
    case 'Deleted': return 'semester_deleted';
    case 'Withdrawn': return 'semester_withdrawal';
    case 'Repeat': return 'semester_repeat';
    case 'Inactive': return 'semester_deactivated';
    default: return 'semester_activated';
  }
}
```

### Student Modules — Status-based

```typescript
async updateStudentModule(id: number, data: Partial<typeof studentModules.$inferInsert>, reasons?: string) {
  return withAuth(async (session) => {
    const activityType = resolveStudentModuleActivityType(data.status);
    return this.repository.updateStudentModule(id, data, {
      userId: session!.user!.id!,
      activityType,
      metadata: reasons ? { reasons } : undefined,
    });
  }, ['registry', 'admin']);
}
```

```typescript
function resolveStudentModuleActivityType(status?: string): string {
  switch (status) {
    case 'Drop': return 'module_dropped';
    case 'Delete': return 'module_deleted';
    case 'Repeat1': case 'Repeat2': case 'Repeat3': return 'module_repeated';
    default: return 'module_update';
  }
}
```

### Registration Request Service

```typescript
async createWithModules(data: {...}) {
  return withAuth(async (session) => {
    return this.repository.createWithModules(data, {
      userId: session!.user!.id!,
      activityType: 'registration_submitted',
    });
  }, ...);
}

async updateWithModules(...) {
  return withAuth(async (session) => {
    return this.repository.updateWithModules(..., {
      userId: session!.user!.id!,
      activityType: 'registration_updated',
    });
  }, ['student', 'registry']);
}

async delete(id: number) {
  return withAuth(async (session) => {
    return this.repository.softDelete(id, session?.user?.id ?? null, {
      userId: session!.user!.id!,
      activityType: 'registration_cancelled',
    });
  }, ['registry']);
}
```

### Clearance Service

The `respond` and `update` methods need to resolve `clearance_approved` vs `clearance_rejected` based on `data.status`:

```typescript
async respond(data: Clearance) {
  return withAuth(async (session) => {
    const activityType = data.status === 'rejected' ? 'clearance_rejected' : 'clearance_approved';
    return this.repository.update(data.id!, {
      ...data,
      responseDate: new Date(),
      respondedBy: session?.user?.id,
    }, {
      userId: session!.user!.id!,
      activityType,
    });
  }, ['dashboard']);
}
```

The `create` method override in `ClearanceRepository` already calls `writeAuditLog()`. Update the service to pass `activityType: 'clearance_created'` in the audit options.

### Print Services

After Step 1 enables `auditEnabled` and fixes the services to pass audit:

```typescript
// TranscriptPrintsService
async create(data: TranscriptPrint) {
  return withAuth(async (session) => this.repository.create(data, {
    userId: session!.user!.id!,
    activityType: 'transcript_print',
  }), ['dashboard']);
}

// StatementOfResultsPrintsService — same pattern
// activityType: 'statement_of_results_print'

// StudentCardPrintService — same pattern
// activityType: 'student_card_print'
```

### Other Custom Services

Apply the same pattern to all remaining custom services listed in Step 1.8:

| Service | Activity Types |
|---------|---------------|
| `BlockedStudentService` | `create → 'student_blocked'`, `update(status=unblocked) → 'student_unblocked'`, `delete → 'student_unblocked'` |
| `DocumentService` | `create → 'document_uploaded'` |
| `GraduationRequestService` | `create → 'graduation_request_submitted'`, `update → 'graduation_request_updated'` |
| `GraduationClearanceService` | `update → 'graduation_clearance_decision'`, create via clearance system → `'graduation_clearance_created'` |
| `CertificateReprintsService` | `create → 'certificate_reprint'` |
| `AutoApprovalService` | `create → 'auto_approval_created'`, `update → 'auto_approval_updated'`, `delete → 'auto_approval_deleted'` |
| `TermSettingsService` | all update methods → `'term_settings_updated'` |
| `SponsorService` | `create → 'sponsor_created'`, `update → 'sponsor_updated'`, `updateStudentSponsorship → 'sponsorship_assigned'` or `'sponsorship_updated'` |
| `AttendanceService` | `markAttendance → 'attendance_recorded'` (for new) / `'attendance_updated'` (for upsert-update) |
| `AssignedModuleService` | `assignModulesToLecturer → 'module_assigned'`, `delete → 'module_unassigned'` |
| `UserService` | `create → 'user_created'`, `update → 'user_updated'`, `delete → 'user_deleted'` |
| `TaskService` | `create → 'task_created'`, `update → 'task_updated'` |
| `NotificationService` | `create → 'notification_created'`, `update → 'notification_updated'` |
| `LoanService` | `issueLoan → 'book_loan_created'`, `returnBook → 'book_returned'` |

### Assessment Marks — Custom repository

The `AssessmentMarkRepository` already uses `writeAuditLog()` in its overridden `create/update/delete` and `createOrUpdateMarks/createOrUpdateMarksInBulk`. For these, the service already passes audit options. Add `activityType` to the audit options in the service:

```typescript
// In AssessmentMarkService (or wherever the service/actions call the repo)
// For create: activityType: 'mark_entered'
// For update: activityType: 'mark_updated'
// For delete: activityType: 'mark_deleted'
```

Check the service that calls `createOrUpdateMarks` / `createOrUpdateMarksInBulk` — it should pass `activityType` dynamically based on whether the operation is INSERT or UPDATE. Since the repo method returns `{ mark, isNew }`, the activityType must be set at the repo level:

For `createOrUpdateMarks`, the repo can set the activityType based on whether `existing` is found:
```typescript
const at = existing ? 'mark_updated' : 'mark_entered';
await this.writeAuditLog(tx, existing ? 'UPDATE' : 'INSERT', ..., { ...audit, activityType: at });
```

For `createOrUpdateMarksInBulk`, same approach per record inside the batch.

---

## 2.4 Activity types to REMOVE from the plan

These activity types were in the original plan but have no corresponding write operations in the codebase:

| Activity Type | Reason |
|--------------|--------|
| `school_created` | `SchoolService` has no create method. Schools are managed directly or via migrations. |
| `school_updated` | `SchoolService` has no update method. |
| `certificate_generated` | No corresponding table or action found. Certificates are generated as PDFs on-the-fly. Remove unless a `certificate_prints` table is added. |

If these operations ARE needed in the future, add the service methods then and include the `activityType` at that time.

---

## 2.5 Backfill historical data

Run `pnpm db:generate --custom` and generate SQL from the shared activity catalog mapping (source-of-truth), then commit the generated CASE-based migration. Avoid maintaining a hand-written CASE as the long-term source.

**Critical**: For status-dependent activity types, generated rules must inspect `new_values` JSONB, not just `table_name + operation`:

```sql
UPDATE audit_logs SET activity_type = CASE
  -- Simple 1:1 mappings (table + operation → activity_type)
  WHEN table_name = 'students' AND operation = 'INSERT' THEN 'student_creation'
  WHEN table_name = 'students' AND operation = 'UPDATE' THEN 'student_update'
  WHEN table_name = 'students' AND operation = 'DELETE' THEN 'student_deletion'

  -- Status-based mappings for student_programs
  WHEN table_name = 'student_programs' AND operation = 'INSERT' THEN 'program_enrollment'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Completed' THEN 'program_completed'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Active' THEN 'program_activated'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Changed' THEN 'program_change'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Deleted' THEN 'program_deleted'
  WHEN table_name = 'student_programs' AND operation = 'UPDATE' AND new_values->>'status' = 'Inactive' THEN 'program_deactivated'

  -- Status-based mappings for student_semesters
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Active' THEN 'semester_activated'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Deferred' THEN 'semester_deferred'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'DroppedOut' THEN 'semester_dropout'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Deleted' THEN 'semester_deleted'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Withdrawn' THEN 'semester_withdrawal'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Repeat' THEN 'semester_repeat'
  WHEN table_name = 'student_semesters' AND operation = 'UPDATE' AND new_values->>'status' = 'Inactive' THEN 'semester_deactivated'

  -- Status-based mappings for student_modules
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' AND new_values->>'status' = 'Drop' THEN 'module_dropped'
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' AND new_values->>'status' = 'Delete' THEN 'module_deleted'
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' AND new_values->>'status' LIKE 'Repeat%' THEN 'module_repeated'
  WHEN table_name = 'student_modules' AND operation = 'UPDATE' THEN 'module_update'

  -- Clearance status-based
  WHEN table_name = 'clearance' AND operation = 'INSERT' THEN 'clearance_created'
  WHEN table_name = 'clearance' AND operation = 'UPDATE' AND new_values->>'status' = 'rejected' THEN 'clearance_rejected'
  WHEN table_name = 'clearance' AND operation = 'UPDATE' THEN 'clearance_approved'

  -- Registration requests
  WHEN table_name = 'registration_requests' AND operation = 'INSERT' THEN 'registration_submitted'
  WHEN table_name = 'registration_requests' AND operation = 'UPDATE' THEN 'registration_updated'
  WHEN table_name = 'registration_requests' AND operation = 'DELETE' THEN 'registration_cancelled'

  -- Prints
  WHEN table_name = 'transcript_prints' AND operation = 'INSERT' THEN 'transcript_print'
  WHEN table_name = 'statement_of_results_prints' AND operation = 'INSERT' THEN 'statement_of_results_print'
  WHEN table_name = 'student_card_prints' AND operation = 'INSERT' THEN 'student_card_print'

  -- Graduation
  WHEN table_name = 'graduation_dates' AND operation = 'INSERT' THEN 'graduation_date_created'
  WHEN table_name = 'graduation_dates' AND operation = 'UPDATE' THEN 'graduation_date_updated'
  WHEN table_name = 'graduation_requests' AND operation = 'INSERT' THEN 'graduation_request_submitted'
  WHEN table_name = 'graduation_requests' AND operation = 'UPDATE' THEN 'graduation_request_updated'
  WHEN table_name = 'graduation_clearance' AND operation = 'INSERT' THEN 'graduation_clearance_created'
  WHEN table_name = 'graduation_clearance' AND operation = 'UPDATE' THEN 'graduation_clearance_decision'

  -- Certificates
  WHEN table_name = 'certificate_reprints' AND operation = 'INSERT' THEN 'certificate_reprint'

  -- Blocked students
  WHEN table_name = 'blocked_students' AND operation = 'INSERT' THEN 'student_blocked'
  WHEN table_name = 'blocked_students' AND operation = 'DELETE' THEN 'student_unblocked'

  -- Terms
  WHEN table_name = 'terms' AND operation = 'INSERT' THEN 'term_created'
  WHEN table_name = 'terms' AND operation = 'UPDATE' THEN 'term_updated'
  WHEN table_name = 'term_settings' AND operation = 'UPDATE' THEN 'term_settings_updated'

  -- Documents
  WHEN table_name = 'student_documents' AND operation = 'INSERT' THEN 'document_uploaded'

  -- Auto-approvals
  WHEN table_name = 'auto_approvals' AND operation = 'INSERT' THEN 'auto_approval_created'
  WHEN table_name = 'auto_approvals' AND operation = 'UPDATE' THEN 'auto_approval_updated'
  WHEN table_name = 'auto_approvals' AND operation = 'DELETE' THEN 'auto_approval_deleted'

  -- Assessments
  WHEN table_name = 'assessments' AND operation = 'INSERT' THEN 'assessment_created'
  WHEN table_name = 'assessments' AND operation = 'UPDATE' THEN 'assessment_updated'
  WHEN table_name = 'assessments' AND operation = 'DELETE' THEN 'assessment_deleted'

  -- Assessment marks
  WHEN table_name = 'assessment_marks' AND operation = 'INSERT' THEN 'mark_entered'
  WHEN table_name = 'assessment_marks' AND operation = 'UPDATE' THEN 'mark_updated'
  WHEN table_name = 'assessment_marks' AND operation = 'DELETE' THEN 'mark_deleted'

  -- Assigned modules
  WHEN table_name = 'assigned_modules' AND operation = 'INSERT' THEN 'module_assigned'
  WHEN table_name = 'assigned_modules' AND operation = 'DELETE' THEN 'module_unassigned'

  -- Attendance
  WHEN table_name = 'attendance' AND operation = 'INSERT' THEN 'attendance_recorded'
  WHEN table_name = 'attendance' AND operation = 'UPDATE' THEN 'attendance_updated'

  -- Modules
  WHEN table_name = 'modules' AND operation = 'INSERT' THEN 'module_created'
  WHEN table_name = 'modules' AND operation = 'UPDATE' THEN 'module_updated'

  -- Semester modules
  WHEN table_name = 'semester_modules' AND operation = 'INSERT' THEN 'semester_module_created'
  WHEN table_name = 'semester_modules' AND operation = 'UPDATE' THEN 'semester_module_updated'
  WHEN table_name = 'semester_modules' AND operation = 'DELETE' THEN 'semester_module_deleted'

  -- Programs & Structures
  WHEN table_name = 'programs' AND operation = 'INSERT' THEN 'program_created'
  WHEN table_name = 'programs' AND operation = 'UPDATE' THEN 'program_updated'
  WHEN table_name = 'structures' AND operation = 'INSERT' THEN 'structure_created'
  WHEN table_name = 'structures' AND operation = 'UPDATE' THEN 'structure_updated'
  WHEN table_name = 'structure_semesters' AND operation = 'INSERT' THEN 'structure_semester_created'
  WHEN table_name = 'structure_semesters' AND operation = 'UPDATE' THEN 'structure_semester_updated'

  -- Feedback
  WHEN table_name = 'feedback_cycles' AND operation = 'INSERT' THEN 'feedback_cycle_created'
  WHEN table_name = 'feedback_cycles' AND operation = 'UPDATE' THEN 'feedback_cycle_updated'
  WHEN table_name = 'feedback_categories' AND operation = 'INSERT' THEN 'feedback_category_created'
  WHEN table_name = 'feedback_categories' AND operation = 'UPDATE' THEN 'feedback_category_updated'
  WHEN table_name = 'feedback_questions' AND operation = 'INSERT' THEN 'feedback_question_created'
  WHEN table_name = 'feedback_questions' AND operation = 'UPDATE' THEN 'feedback_question_updated'

  -- Finance
  WHEN table_name = 'payment_receipts' AND operation = 'INSERT' THEN 'payment_receipt_added'
  WHEN table_name = 'payment_receipts' AND operation = 'DELETE' THEN 'payment_receipt_removed'
  WHEN table_name = 'sponsors' AND operation = 'INSERT' THEN 'sponsor_created'
  WHEN table_name = 'sponsors' AND operation = 'UPDATE' THEN 'sponsor_updated'
  WHEN table_name = 'sponsored_students' AND operation = 'INSERT' THEN 'sponsorship_assigned'
  WHEN table_name = 'sponsored_students' AND operation = 'UPDATE' THEN 'sponsorship_updated'

  -- Library
  WHEN table_name = 'books' AND operation = 'INSERT' THEN 'book_added'
  WHEN table_name = 'books' AND operation = 'UPDATE' THEN 'book_updated'
  WHEN table_name = 'books' AND operation = 'DELETE' THEN 'book_deleted'
  WHEN table_name = 'book_copies' AND operation = 'INSERT' THEN 'book_copy_added'
  WHEN table_name = 'book_copies' AND operation = 'UPDATE' THEN 'book_copy_updated'
  WHEN table_name = 'loans' AND operation = 'INSERT' THEN 'book_loan_created'
  WHEN table_name = 'loans' AND operation = 'UPDATE' THEN 'book_returned'
  WHEN table_name = 'loans' AND operation = 'DELETE' THEN 'loan_deleted'
  WHEN table_name = 'fines' AND operation = 'INSERT' THEN 'fine_created'
  WHEN table_name = 'fines' AND operation = 'UPDATE' THEN 'fine_updated'
  WHEN table_name = 'authors' AND operation = 'INSERT' THEN 'author_created'
  WHEN table_name = 'authors' AND operation = 'UPDATE' THEN 'author_updated'
  WHEN table_name = 'authors' AND operation = 'DELETE' THEN 'author_deleted'
  WHEN table_name = 'categories' AND operation = 'INSERT' THEN 'category_created'
  WHEN table_name = 'categories' AND operation = 'UPDATE' THEN 'category_updated'
  WHEN table_name = 'categories' AND operation = 'DELETE' THEN 'category_deleted'
  WHEN table_name = 'publications' AND operation = 'INSERT' THEN 'publication_added'
  WHEN table_name = 'publications' AND operation = 'UPDATE' THEN 'publication_updated'
  WHEN table_name = 'publications' AND operation = 'DELETE' THEN 'publication_deleted'
  WHEN table_name = 'question_papers' AND operation = 'INSERT' THEN 'question_paper_uploaded'
  WHEN table_name = 'question_papers' AND operation = 'UPDATE' THEN 'question_paper_updated'
  WHEN table_name = 'question_papers' AND operation = 'DELETE' THEN 'question_paper_deleted'
  WHEN table_name = 'library_settings' AND operation = 'UPDATE' THEN 'library_settings_updated'
  WHEN table_name = 'external_libraries' AND operation = 'INSERT' THEN 'external_library_added'
  WHEN table_name = 'external_libraries' AND operation = 'UPDATE' THEN 'external_library_updated'
  WHEN table_name = 'external_libraries' AND operation = 'DELETE' THEN 'external_library_deleted'

  -- Admissions
  WHEN table_name = 'applications' AND operation = 'INSERT' THEN 'application_submitted'
  WHEN table_name = 'applications' AND operation = 'UPDATE' THEN 'application_updated'
  WHEN table_name = 'applicant_documents' AND operation = 'INSERT' THEN 'applicant_document_uploaded'
  WHEN table_name = 'applicant_documents' AND operation = 'UPDATE' THEN 'applicant_document_reviewed'
  WHEN table_name = 'bank_deposits' AND operation = 'INSERT' THEN 'deposit_submitted'
  WHEN table_name = 'bank_deposits' AND operation = 'UPDATE' THEN 'deposit_verified'
  WHEN table_name = 'applicants' AND operation = 'INSERT' THEN 'applicant_created'
  WHEN table_name = 'applicants' AND operation = 'UPDATE' THEN 'applicant_updated'
  WHEN table_name = 'subjects' AND operation = 'INSERT' THEN 'subject_created'
  WHEN table_name = 'subjects' AND operation = 'UPDATE' THEN 'subject_updated'
  WHEN table_name = 'subjects' AND operation = 'DELETE' THEN 'subject_deleted'
  WHEN table_name = 'recognized_schools' AND operation = 'INSERT' THEN 'recognized_school_added'
  WHEN table_name = 'recognized_schools' AND operation = 'UPDATE' THEN 'recognized_school_updated'
  WHEN table_name = 'recognized_schools' AND operation = 'DELETE' THEN 'recognized_school_deleted'
  WHEN table_name = 'certificate_types' AND operation = 'INSERT' THEN 'certificate_type_created'
  WHEN table_name = 'certificate_types' AND operation = 'UPDATE' THEN 'certificate_type_updated'
  WHEN table_name = 'certificate_types' AND operation = 'DELETE' THEN 'certificate_type_deleted'
  WHEN table_name = 'entry_requirements' AND operation = 'INSERT' THEN 'entry_requirement_created'
  WHEN table_name = 'entry_requirements' AND operation = 'UPDATE' THEN 'entry_requirement_updated'
  WHEN table_name = 'entry_requirements' AND operation = 'DELETE' THEN 'entry_requirement_deleted'
  WHEN table_name = 'intake_periods' AND operation = 'INSERT' THEN 'intake_period_created'
  WHEN table_name = 'intake_periods' AND operation = 'UPDATE' THEN 'intake_period_updated'
  WHEN table_name = 'intake_periods' AND operation = 'DELETE' THEN 'intake_period_deleted'

  -- Admin
  WHEN table_name = 'users' AND operation = 'INSERT' THEN 'user_created'
  WHEN table_name = 'users' AND operation = 'UPDATE' THEN 'user_updated'
  WHEN table_name = 'users' AND operation = 'DELETE' THEN 'user_deleted'
  WHEN table_name = 'tasks' AND operation = 'INSERT' THEN 'task_created'
  WHEN table_name = 'tasks' AND operation = 'UPDATE' THEN 'task_updated'
  WHEN table_name = 'notifications' AND operation = 'INSERT' THEN 'notification_created'
  WHEN table_name = 'notifications' AND operation = 'UPDATE' THEN 'notification_updated'

  -- Timetable
  WHEN table_name = 'venues' AND operation = 'INSERT' THEN 'venue_created'
  WHEN table_name = 'venues' AND operation = 'UPDATE' THEN 'venue_updated'
  WHEN table_name = 'venue_types' AND operation = 'INSERT' THEN 'venue_type_created'
  WHEN table_name = 'venue_types' AND operation = 'UPDATE' THEN 'venue_type_updated'
  WHEN table_name = 'timetable_allocations' AND operation = 'INSERT' THEN 'allocation_created'
  WHEN table_name = 'timetable_allocations' AND operation = 'UPDATE' THEN 'allocation_updated'
  WHEN table_name = 'timetable_allocations' AND operation = 'DELETE' THEN 'allocation_deleted'
  WHEN table_name = 'timetable_slots' AND operation = 'INSERT' THEN 'slot_created'
  WHEN table_name = 'timetable_slots' AND operation = 'UPDATE' THEN 'slot_updated'
  WHEN table_name = 'timetable_slots' AND operation = 'DELETE' THEN 'slot_deleted'

  ELSE NULL
END
WHERE activity_type IS NULL;
```

Backfill generation guardrails:

1. Generator output must be deterministic (stable sort order)
2. Include dry-run SQL preview in PR notes (`SELECT table_name, operation, count(*) ...`) before `UPDATE`
3. Add post-backfill verification query for unknown/NULL activity types within known tracked tables

### Backfill limitations

Some historical activity types cannot be backfilled because audit records **don't exist** for those operations (the services didn't pass audit options). These records were never written to `audit_logs`:

- `registration_submitted` / `registration_updated` / `registration_cancelled` — RegistrationRequestRepository had no audit
- `student_blocked` / `student_unblocked` — BlockedStudentService had no audit
- `document_uploaded` — DocumentService had no audit
- `graduation_request_submitted` / `graduation_request_updated` — GraduationRequestService had no audit
- `sponsor_created` / `sponsor_updated` — SponsorService had no audit
- `attendance_recorded` / `attendance_updated` — AttendanceService had no audit
- `module_assigned` / `module_unassigned` — AssignedModuleService had no audit
- `book_loan_created` / `book_returned` — LoanService custom methods had no audit
- `auto_approval_*` — AutoApprovalService had no audit
- `user_created` / `user_updated` / `user_deleted` — UserService had no audit
- `task_created` / `task_updated` — TaskService had no audit
- `notification_*` — NotificationService had no audit
- `term_settings_updated` — TermSettingsService had no audit
- `transcript_print` / `statement_of_results_print` / `student_card_print` — auditEnabled was false

Only the data ALREADY in `audit_logs` can be backfilled. Going forward, all new operations will be tagged correctly after Step 1 + 2.

---

## Verification

After completing this step:

1. Run `pnpm tsc --noEmit & pnpm lint:fix` → fix all type errors
2. Run `pnpm db:generate --custom` → write the backfill migration
3. Run `pnpm db:migrate`
4. Verify backfill: `SELECT activity_type, count(*) FROM audit_logs WHERE activity_type IS NOT NULL GROUP BY activity_type ORDER BY count DESC`
5. Manually test actions across modules → verify `activity_type` appears in new audit records
6. Verify status-based types: change a student program status → check the audit record has the correct `activity_type`
