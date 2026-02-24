# Step 2: Service-Layer Tagging (stdNo + role)

Update all student-related services to pass `stdNo` in audit options. `role` is handled automatically by `BaseService.buildAuditOptions()` (Step 1.6), so this step focuses on custom services and ensuring `stdNo` is passed where possible.

---

## 2.1 Categories of services

### A. Custom services (NOT extending BaseService) — must pass `role` AND `stdNo` manually

These services use `withAuth(async (session) => ...)` and construct `AuditOptions` literals. Each must add:
- `role: session!.user!.role!`
- `stdNo: <derived from data or params>`

### B. BaseService-based services — must override methods IF stdNo is derivable

`role` is auto-populated from Step 1.6. `stdNo` needs to be added only where the service can derive it. For services that don't know the student (e.g., `TermService`, `ModuleService`), `stdNo` stays `null` — future table-specific repositories can add it.

---

## 2.2 StudentService (`src/app/registry/students/_server/service.ts`)

**Category**: Custom (not BaseService)
**Table(s)**: `students`, `student_programs`, `student_semesters`, `student_modules`
**stdNo derivation**: Directly available as parameter or `data.stdNo`

### Changes

Every `withAuth` callback that builds `AuditOptions` must include `role` and `stdNo`:

```typescript
async create(data: Student) {
  return withAuth(
    async (session) =>
      this.repository.create(data, {
        userId: requireSessionUserId(session),
        role: session!.user!.role!,
        activityType: 'student_creation',
        stdNo: data.stdNo,
      }),
    []
  );
}

async update(stdNo: number, data: Student) {
  return withAuth(
    async (session) =>
      this.repository.update(stdNo, data, {
        userId: requireSessionUserId(session),
        role: session!.user!.role!,
        activityType: 'student_update',
        stdNo,
      }),
    []
  );
}

async updateWithReasons(stdNo: number, data: Partial<Student>, reasons?: string) {
  return withAuth(
    async (session) =>
      this.repository.updateStudentWithAudit(stdNo, data, {
        userId: requireSessionUserId(session),
        role: session!.user!.role!,
        activityType: 'student_update',
        stdNo,
        metadata: reasons ? { reasons } : undefined,
      }),
    ['registry', 'admin']
  );
}
```

### For program/semester/module methods

These methods receive an `id` (not `stdNo`). Two approaches:

**Option A (recommended)**: Pass `stdNo` as an additional parameter from the UI. The UI already has the student context.

```typescript
async updateStudentProgram(
  id: number,
  data: Partial<typeof studentPrograms.$inferInsert>,
  stdNo: number,
  reasons?: string
) {
  return withAuth(
    async (session) =>
      this.repository.updateStudentProgram(id, data, {
        userId: requireSessionUserId(session),
        role: session!.user!.role!,
        activityType: resolveStudentProgramActivityType(data.status),
        stdNo,
        metadata: reasons ? { reasons } : undefined,
      }),
    ['registry', 'admin']
  );
}
```

**Option B**: Look up `stdNo` from the DB using the entity's ID. This adds a DB round-trip but keeps the API unchanged. NOT recommended per project guidelines (minimize DB calls).

**Decision**: Use Option A. Update the service method signatures and callers (actions + UI) to pass `stdNo`.

### Methods requiring stdNo parameter addition

| Method | Current Params | Add `stdNo` param | Notes |
|--------|---------------|-------------------|-------|
| `updateStudentProgram` | `id, data, reasons` | Yes | Caller has student context |
| `createStudentProgram` | `data, reasons` | No, use `data.stdNo` | Already available |
| `updateStudentSemester` | `id, data, reasons` | Yes | Caller has student context |
| `updateStudentModule` | `id, data, reasons` | Yes | Caller has student context |
| `updateUserId` | `stdNo, userId` | Yes (already has `stdNo`) | But audit options must be added |
| `updateProgramStructure` | `stdNo, structureId` | Yes (already has `stdNo`) | But audit options must be added |

---

## 2.3 AssessmentMarkService (`src/app/academic/assessment-marks/_server/service.ts`)

**Category**: Custom
**Table**: `assessment_marks`
**stdNo derivation**: Requires lookup: `assessment_marks.student_module_id` → `student_modules.student_semester_id` → `student_semesters.student_program_id` → `student_programs.std_no`

### Challenge
This is a 3-hop derivation. Doing a DB lookup per mark entry is expensive, especially for bulk operations.

### Solution
Add a `stdNo` parameter to the service methods. The UI (gradebook) already knows which student each mark belongs to.

For `create`/`update` of a single mark:
```typescript
async create(data: AssessmentMark, stdNo?: number) {
  return withAuth(
    async (session) =>
      this.repository.create(data, {
        userId: session!.user!.id!,
        role: session!.user!.role!,
        activityType: 'mark_entered',
        stdNo: stdNo ?? undefined,
      }),
    ['academic']
  );
}
```

For bulk mark entry (the gradebook's `saveMarks`), the bulk upsert should resolve `stdNo` for each mark from the student context already loaded in the component.

### Alternative: Repository-level lookup
If the UI doesn't always have `stdNo`, the repository could do a single lookup:

```sql
SELECT sp.std_no
FROM student_modules sm
JOIN student_semesters ss ON sm.student_semester_id = ss.id
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE sm.id = $studentModuleId
```

This is acceptable for single-mark operations (1 extra query). For bulk, the UI should pass it.

---

## 2.4 ClearanceService (`src/app/registry/registration/requests/_server/clearance/service.ts`)

**Category**: Custom
**Table**: `clearance`
**stdNo derivation**: `clearance.id` → `registration_clearance.clearance_id` → `registration_requests.std_no`

### Solution
The clearance service methods are called in the context of a registration request. Pass `stdNo` from the caller.

---

## 2.5 GraduationClearanceService (`src/app/registry/graduation/clearance/_server/clearance/service.ts`)

**Category**: Custom
**Table**: `clearance` (shared table)
**stdNo derivation**: Via graduation request → student_program → student

### Solution
Same pattern — pass `stdNo` from the caller context.

---

## 2.6 PaymentReceiptService (`src/app/finance/payment-receipts/_server/service.ts`)

**Category**: BaseService
**Table**: `payment_receipts`
**stdNo derivation**: `payment_receipts.stdNo` — directly on the insert data

### Solution
Override `create()` in the service to extract `stdNo` from the data and pass it through. Or, update `buildAuditOptions()` to accept additional params.

**Recommended approach**: Override `create` and `update` to inject `stdNo`:

```typescript
override async create(data: typeof paymentReceipts.$inferInsert) {
  const roles = this.createRoles() as Role[] | AccessCheckFunction;
  return withAuth(async (session) => {
    const audit = this.buildAuditOptions(session, 'create');
    if (audit && data.stdNo) audit.stdNo = data.stdNo;
    return this.repository.create(data, audit);
  }, roles as Role[]);
}
```

---

## 2.7 BlockedStudentService (`src/app/registry/blocked-students/_server/service.ts`)

**Category**: Custom
**Table**: `blocked_students`
**stdNo derivation**: `blocked_students.stdNo` — directly available

### Solution
Add `stdNo` to audit options from the data parameter.

---

## 2.8 DocumentService (`src/app/registry/documents/_server/service.ts`)

**Category**: Custom
**Table**: `student_documents`
**stdNo derivation**: `student_documents.stdNo` — directly available

### Solution
Add `stdNo` to audit options from the data parameter.

---

## 2.9 Print services (Transcript, SoR, Student Card)

**Category**: Custom
**Tables**: `transcript_prints`, `statement_of_results_prints`, `student_card_prints`
**stdNo derivation**: Each print table has `stdNo` directly

### Solution
Add `stdNo` to audit options from the data parameter.

---

## 2.10 CertificateReprintsService (`src/app/registry/certificate-reprints/_server/service.ts`)

**Category**: Custom
**Table**: `certificate_reprints`
**stdNo derivation**: `certificate_reprints.stdNo` — directly available

### Solution
Add `stdNo` to audit options.

---

## 2.11 Other services (Library loans, fines, attendance, sponsored students, registration requests)

Each of these has `stdNo` directly on the table. Follow the same pattern: extract `stdNo` from the data and add to audit options.

---

## 2.12 Update callers (actions + UI) to pass stdNo

For service methods where `stdNo` was added as a parameter (e.g., `updateStudentSemester`), update:

1. **Actions** (`_server/actions.ts`) — pass `stdNo` through
2. **UI components** (modals, forms) — pass `stdNo` from the student context they already have

### Example: EditStudentSemesterModal

```typescript
// Before
await updateStudentSemester(semester.id, values, reasons);

// After
await updateStudentSemester(semester.id, values, student.stdNo, reasons);
```

---

## Verification

After completing this step:

1. `pnpm tsc --noEmit & pnpm lint:fix` → zero errors
2. Test: edit a student → check `SELECT std_no, changed_by_role FROM audit_logs ORDER BY id DESC LIMIT 5`
3. Test: enter marks in gradebook → verify `std_no` is populated
4. Test: approve clearance → verify `std_no` is populated
5. Test: add payment receipt → verify `std_no` is populated
